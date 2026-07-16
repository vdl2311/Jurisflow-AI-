'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { hasPermission } from '@/lib/permissions'
import { formatCurrency } from '@/lib/format'
import { postWithUser } from '@/lib/api'
import type { UserInfo } from '@/lib/api'
import { CalendarIcon, Loader2, ArrowUpCircle, ArrowDownCircle, X, CheckCircle } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface FinancialModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated?: () => void
  userRole: string
  user?: UserInfo | null
  prefillProcessId?: string
}

interface Client {
  id: string
  name: string
}

interface Process {
  id: string
  title: string
  cnj: string | null
  clientId: string
}

const RECEITA_CATEGORIES = [
  'Honorários',
  'Honorários Provisórios',
  'Honorários Sucumbência',
  'Consultoria',
  'Outras Receitas',
]

const DESPESA_CATEGORIES = [
  'Custas Processuais',
  'Aluguel',
  'Salários',
  'Software',
  'Consultoria',
  'Material de Escritório',
  'Internet e Telefone',
  'Transporte',
  'Outras Despesas',
]

export function FinancialModal({ open, onOpenChange, onCreated, userRole, user, prefillProcessId }: FinancialModalProps) {
  const [type, setType] = useState<'Receita' | 'Despesa'>('Receita')
  const [description, setDescription] = useState('')
  const [amountStr, setAmountStr] = useState('')
  const [category, setCategory] = useState('')
  const [status, setStatus] = useState('Pendente')
  const [competenceDate, setCompetenceDate] = useState<Date | undefined>(undefined)
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined)
  const [processId, setProcessId] = useState('')
  const [clientId, setClientId] = useState('')
  const [clients, setClients] = useState<Client[]>([])
  const [processes, setProcesses] = useState<Process[]>([])
  const [loading, setLoading] = useState(false)
  const [amountFocused, setAmountFocused] = useState(false)

  const canCreate = hasPermission(userRole, 'financial', 'create')

  // Carregar clientes e processos
  useEffect(() => {
    if (open) {
      fetch('/api/clients').then(r => r.json()).then(setClients).catch(() => {})
      fetch('/api/processes').then(r => r.json()).then(setProcesses).catch(() => {})
    }
  }, [open])

  // Prefill processo se veio da tela de detalhe
  useEffect(() => {
    if (prefillProcessId && open) {
      setProcessId(prefillProcessId)
      const p = processes.find(pr => pr.id === prefillProcessId)
      if (p) setClientId(p.clientId)
    }
  }, [prefillProcessId, open, processes])

  // Filtrar processos por cliente selecionado
  const filteredProcesses = useMemo(() => {
    if (!clientId) return processes
    return processes.filter(p => p.clientId === clientId)
  }, [clientId, processes])

  // Categorias dinâmicas baseadas no tipo
  const categories = type === 'Receita' ? RECEITA_CATEGORIES : DESPESA_CATEGORIES

  // Formatação BRL do valor
  const formatBRL = (value: string) => {
    const digits = value.replace(/\D/g, '')
    const num = parseInt(digits || '0', 10) / 100
    return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '')
    setAmountStr(raw)
  }

  const displayAmount = amountFocused
    ? formatBRL(amountStr)
    : (amountStr ? formatCurrency(parseInt(amountStr, 10) / 100) : '')

  const handleSubmit = async () => {
    if (!canCreate) return
    if (!description.trim()) return
    if (!amountStr || parseInt(amountStr, 10) === 0) return
    if (!category) return
    if (!dueDate) return

    setLoading(true)
    try {
      const body: Record<string, unknown> = {
        type,
        category,
        description: description.trim(),
        amount: parseInt(amountStr, 10) / 100,
        status,
        dueDate: dueDate.toISOString(),
        processId: processId || null,
        clientId: clientId || null,
      }
      if (status === 'Pago' || status === 'Confirmado') {
        body.paidDate = new Date().toISOString()
        body.status = 'Pago'
      }

      await postWithUser(user, '/api/financial', body)

      // Reset
      setType('Receita')
      setDescription('')
      setAmountStr('')
      setCategory('')
      setStatus('Pendente')
      setCompetenceDate(undefined)
      setDueDate(undefined)
      setProcessId('')
      setClientId('')

      onCreated?.()
      onOpenChange(false)
    } catch {
      // silencioso
    } finally {
      setLoading(false)
    }
  }

  const isValid = description.trim() && amountStr && parseInt(amountStr, 10) > 0 && category && dueDate

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border bg-gradient-to-r from-muted/60 to-muted/20">
          <DialogTitle className="text-lg font-semibold flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center">
              {type === 'Receita' ? (
                <ArrowUpCircle className="h-5 w-5 text-emerald-600" />
              ) : (
                <ArrowDownCircle className="h-5 w-5 text-red-600" />
              )}
            </div>
            Lançamento Financeiro
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Tipo de Transação */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Tipo de Transação</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => { setType('Receita'); setCategory('') }}
                className={cn(
                  'flex items-center gap-2 rounded-lg border-2 px-4 py-3 text-sm font-medium transition-all',
                  type === 'Receita'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-700'
                    : 'border-border hover:border-emerald-300 dark:hover:border-emerald-800'
                )}
              >
                <ArrowUpCircle className="h-5 w-5 shrink-0" />
                <div className="text-left">
                  <p>Receita</p>
                  <p className="text-[10px] font-normal opacity-70">Honorários / Entrada</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => { setType('Despesa'); setCategory('') }}
                className={cn(
                  'flex items-center gap-2 rounded-lg border-2 px-4 py-3 text-sm font-medium transition-all',
                  type === 'Despesa'
                    ? 'border-red-500 bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 dark:border-red-700'
                    : 'border-border hover:border-red-300 dark:hover:border-red-800'
                )}
              >
                <ArrowDownCircle className="h-5 w-5 shrink-0" />
                <div className="text-left">
                  <p>Despesa</p>
                  <p className="text-[10px] font-normal opacity-70">Custas / Saída</p>
                </div>
              </button>
            </div>
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="fin-description" className="text-sm font-medium">
              Descrição <span className="text-destructive">*</span>
            </Label>
            <Input
              id="fin-description"
              placeholder={type === 'Receita' ? 'Ex: Honorários Contratuais Provisórios Alpha' : 'Ex: Custas processuais - Distribuidora Norte'}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Valor */}
          <div className="space-y-2">
            <Label htmlFor="fin-amount" className="text-sm font-medium">
              Valor (R$) <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">R$</span>
              <Input
                id="fin-amount"
                className="pl-10 text-base font-semibold tabular-nums"
                placeholder="Ex: 15.000,00"
                value={displayAmount}
                onChange={handleAmountChange}
                onFocus={() => setAmountFocused(true)}
                onBlur={() => setAmountFocused(false)}
                inputMode="numeric"
              />
            </div>
          </div>

          {/* Categoria */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Categoria</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder={type === 'Receita' ? 'Ex: Honorários, Consultoria' : 'Ex: Custas, Aluguel, Software'} />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status do Pagamento */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Status do Pagamento</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Pendente">
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                    Pendente
                  </span>
                </SelectItem>
                <SelectItem value="Confirmado">
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    Confirmado / Pago
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Datas */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Data Competência</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !competenceDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {competenceDate ? format(competenceDate, 'MM/dd/yyyy') : 'Selecione'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={competenceDate}
                    onSelect={setCompetenceDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Vencimento <span className="text-destructive">*</span>
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !dueDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, 'MM/dd/yyyy') : 'Selecione'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={setDueDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Vincular a Processo */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Vincular a Processo</Label>
            <Select
              value={clientId}
              onValueChange={(val) => {
                setClientId(val)
                setProcessId('') // reseta processo ao trocar cliente
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Geral / Administrativo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Geral / Administrativo</SelectItem>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {clientId && clientId !== 'none' && (
              <Select value={processId} onValueChange={setProcessId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um processo (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum processo</SelectItem>
                  {filteredProcesses.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.cnj ? `${p.cnj} - ` : ''}{p.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-muted/30">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="gap-1.5"
          >
            <X className="h-4 w-4" />
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isValid || loading || !canCreate}
            className={cn(
              'gap-1.5 min-w-[140px]',
              type === 'Receita'
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-red-600 hover:bg-red-700 text-white'
            )}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4" />
            )}
            Lançar Transação
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}