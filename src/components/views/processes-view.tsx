'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, Plus, FolderKanban, Scale, ChevronRight, Cloud } from 'lucide-react'
import { formatCurrency, formatDate, statusColor, riskColor } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { MaskedInput } from '@/components/ui/masked-input'
import { maskCNJ, parseCurrency, onlyDigits } from '@/lib/masks'
import type { ViewName } from '@/app/page'

interface Process {
  id: string
  cnj: string | null
  title: string
  court: string | null
  section: string | null
  classType: string | null
  subject: string | null
  caseValue: number | null
  parties: string | null
  status: string
  area: string | null
  responsibleId: string | null
  risk: string
  client: { id: string; name: string }
  _count: { movements: number; deadlines: number; tasks: number; documents: number }
}

interface Props {
  onOpenProcess: (id: string) => void
  onNavigate: (v: ViewName) => void
}

const areas = ['Todos', 'Trabalhista', 'Cível', 'Tributário', 'Penal', 'Consumidor', 'Família', 'Empresarial']
const statuses = ['Todos', 'Ativo', 'Suspenso', 'Encerrado', 'Arquivado']

export function ProcessesView({ onOpenProcess, onNavigate }: Props) {
  const [items, setItems] = useState<Process[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('Todos')
  const [area, setArea] = useState('Todos')
  const [modalOpen, setModalOpen] = useState(false)
  const [clients, setClients] = useState<{ id: string; name: string }[]>([])
  const { toast } = useToast()

  const load = () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (status !== 'Todos') params.set('status', status)
    if (area !== 'Todos') params.set('area', area)
    fetch(`/api/processes?${params}`)
      .then((r) => r.json())
      .then((d) => setItems(d))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [search, status, area])

  useEffect(() => {
    fetch('/api/clients')
      .then((r) => r.json())
      .then((d) => setClients(d))
  }, [])

  const handleCreate = async (data: Record<string, unknown>) => {
    const res = await fetch('/api/processes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (res.ok) {
      toast({ title: 'Processo cadastrado', description: 'Processo criado com sucesso.' })
      setModalOpen(false)
      load()
    } else {
      toast({ title: 'Erro', description: 'Falha ao cadastrar processo.', variant: 'destructive' })
    }
  }

  return (
    <div className="p-5 md:p-6 space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-3 md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por título, CNJ ou partes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-full md:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {statuses.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={area} onValueChange={setArea}>
          <SelectTrigger className="w-full md:w-40">
            <SelectValue placeholder="Área" />
          </SelectTrigger>
          <SelectContent>
            {areas.map((a) => (
              <SelectItem key={a} value={a}>
                {a}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={() => setModalOpen(true)} className="shrink-0">
          <Plus className="h-4 w-4 mr-1.5" />
          Novo processo
        </Button>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 rounded-md bg-muted/40 animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FolderKanban className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Nenhum processo encontrado.</p>
            <Button className="mt-3" onClick={() => setModalOpen(true)}>
              <Plus className="h-4 w-4 mr-1.5" />
              Cadastrar primeiro processo
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {items.map((p) => (
            <Card
              key={p.id}
              className="cursor-pointer hover:shadow-md hover:border-primary/30 transition-all"
              onClick={() => onOpenProcess(p.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-start gap-2">
                      <div className="h-9 w-9 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                        <Scale className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{p.title}</p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {p.cnj || 'Sem CNJ'} • {p.client.name}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 pl-11">
                      <span className={cn('text-[10px] px-1.5 py-0.5 rounded border font-medium', statusColor(p.status))}>
                        {p.status}
                      </span>
                      {p.area && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border">
                          {p.area}
                        </span>
                      )}
                      <span className={cn('text-[10px] px-1.5 py-0.5 rounded font-medium', riskColor(p.risk))}>
                        Risco {p.risk}
                      </span>
                      {p.caseValue !== null && p.caseValue > 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 font-medium">
                          {formatCurrency(p.caseValue)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <div className="flex gap-1 text-[10px] text-muted-foreground">
                      <span title="Andamentos">📄 {p._count.movements}</span>
                      <span title="Prazos">⏰ {p._count.deadlines}</span>
                      <span title="Tarefas">✓ {p._count.tasks}</span>
                    </div>

                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <NewProcessModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        clients={clients}
        onSubmit={handleCreate}
      />
    </div>
  )
}

function NewProcessModal({
  open,
  onOpenChange,
  clients,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  clients: { id: string; name: string }[]
  onSubmit: (data: Record<string, unknown>) => void
}) {
  const [form, setForm] = useState<Record<string, string>>({
    title: '',
    cnj: '',
    clientId: '',
    area: 'Cível',
    court: '',
    section: '',
    classType: '',
    subject: '',
    parties: '',
    caseValue: '',
    responsibleId: 'Dra. Patrícia Almeida',
    risk: 'Médio',
  })

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const submit = () => {
    if (!form.title || !form.clientId) return
    onSubmit({
      ...form,
      cnj: form.cnj ? maskCNJ(form.cnj) : '', // Salva formatado
      caseValue: form.caseValue ? (typeof form.caseValue === 'string' && form.caseValue.includes(',') ? parseCurrency(form.caseValue) : parseFloat(form.caseValue)) : 0,
    })
    setForm({
      title: '',
      cnj: '',
      clientId: '',
      area: 'Cível',
      court: '',
      section: '',
      classType: '',
      subject: '',
      parties: '',
      caseValue: '',
      responsibleId: 'Dra. Patrícia Almeida',
      risk: 'Médio',
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cadastrar novo processo</DialogTitle>
          <DialogDescription>Preencha os dados do processo. Campos com * são obrigatórios.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 py-2">
          <div className="md:col-span-2 space-y-1.5">
            <Label htmlFor="title">Título *</Label>
            <Input id="title" value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="Ex.: Reclamação Trabalhista - João vs Empresa" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cnj">Número CNJ</Label>
            <MaskedInput
              id="cnj"
              mask="cnj"
              placeholder="0000000-00.0000.0.00.0000"
              onRawChange={(v) => set('cnj', String(v))}
            />
            <p className="text-[10px] text-muted-foreground">20 dígitos. Será detectado o tribunal automaticamente para consulta DataJud.</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="clientId">Cliente *</Label>
            <Select value={form.clientId} onValueChange={(v) => set('clientId', v)}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="area">Área</Label>
            <Select value={form.area} onValueChange={(v) => set('area', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {['Trabalhista', 'Cível', 'Tributário', 'Penal', 'Consumidor', 'Família', 'Empresarial'].map((a) => (
                  <SelectItem key={a} value={a}>{a}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="risk">Risco</Label>
            <Select value={form.risk} onValueChange={(v) => set('risk', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {['Baixo', 'Médio', 'Alto'].map((a) => (
                  <SelectItem key={a} value={a}>{a}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="court">Tribunal</Label>
            <Input id="court" value={form.court} onChange={(e) => set('court', e.target.value)} placeholder="Ex.: TJSP, TRT-2" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="section">Vara</Label>
            <Input id="section" value={form.section} onChange={(e) => set('section', e.target.value)} placeholder="Ex.: 3ª Vara Cível" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="classType">Classe</Label>
            <Input id="classType" value={form.classType} onChange={(e) => set('classType', e.target.value)} placeholder="Ex.: Procedimento Comum" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="caseValue">Valor da causa (R$)</Label>
            <MaskedInput
              id="caseValue"
              mask="currency"
              placeholder="0,00"
              onRawChange={(v) => set('caseValue', String(v))}
            />
          </div>
          <div className="md:col-span-2 space-y-1.5">
            <Label htmlFor="parties">Partes</Label>
            <Input id="parties" value={form.parties} onChange={(e) => set('parties', e.target.value)} placeholder="Autor: ... | Réu: ..." />
          </div>
          <div className="md:col-span-2 space-y-1.5">
            <Label htmlFor="subject">Assunto</Label>
            <Textarea id="subject" value={form.subject} onChange={(e) => set('subject', e.target.value)} rows={2} placeholder="Breve descrição do objeto" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={!form.title || !form.clientId}>Cadastrar processo</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
