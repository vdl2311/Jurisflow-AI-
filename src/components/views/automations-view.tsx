'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { Switch } from '@/components/ui/switch'
import { Zap, Play, Plus, Mail, MessageSquare, FileText, Bell, Bot, Clock } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

interface Automation {
  id: string
  name: string
  trigger: string
  actions: any[]
  enabled: boolean
  createdAt: string
}

const TRIGGERS = [
  { id: 'novo_processo', label: 'Novo processo cadastrado', icon: FileText },
  { id: 'nova_audiencia', label: 'Audiência marcada', icon: Clock },
  { id: 'honorario_vencido', label: 'Honorário vencido', icon: Mail },
  { id: 'novo_andamento', label: 'Novo andamento', icon: FileText },
]

const ACTION_TYPES = [
  { id: 'enviar_email', label: 'Enviar e-mail', icon: Mail },
  { id: 'enviar_whatsapp', label: 'Enviar WhatsApp', icon: MessageSquare },
  { id: 'criar_tarefa', label: 'Criar tarefa', icon: FileText },
  { id: 'gerar_pix', label: 'Gerar PIX', icon: FileText },
  { id: 'notificar_advogado', label: 'Notificar advogado', icon: Bell },
  { id: 'resumir_ia', label: 'Resumir com IA', icon: Bot },
  { id: 'verificar_prazo', label: 'Verificar prazo', icon: Clock },
]

function iconForAction(type: string) {
  return ACTION_TYPES.find((a) => a.id === type)?.icon || FileText
}

export function AutomationsView() {
  const [items, setItems] = useState<Automation[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [executing, setExecuting] = useState<string | null>(null)
  const [results, setResults] = useState<Record<string, string[]>>({})
  const { toast } = useToast()

  const load = () => {
    setLoading(true)
    fetch('/api/automations')
      .then((r) => r.json())
      .then(setItems)
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const toggle = async (a: Automation) => {
    await fetch(`/api/automations?id=${a.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled: !a.enabled }),
    })
    load()
  }

  const execute = async (a: Automation) => {
    setExecuting(a.id)
    try {
      const res = await fetch(`/api/automations?id=${a.id}`, { method: 'PUT' })
      const data = await res.json()
      setResults({ ...results, [a.id]: data.resultados })
      toast({
        title: 'Automação executada',
        description: `${a.name}: ${data.acoesExecutadas} ações`,
      })
    } finally {
      setExecuting(null)
    }
  }

  const handleCreate = async (data: Record<string, unknown>) => {
    const res = await fetch('/api/automations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (res.ok) {
      toast({ title: 'Automação criada' })
      setModalOpen(false)
      load()
    }
  }

  return (
    <div className="p-5 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            {items.filter((a) => a.enabled).length} ativas • {items.length} total
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4 mr-1.5" />
          Nova automação
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 rounded-md bg-muted/40 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((a) => {
            const trigger = TRIGGERS.find((t) => t.id === a.trigger)
            return (
              <Card key={a.id} className={cn(!a.enabled && 'opacity-60')}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className={cn(
                        'h-10 w-10 rounded-md flex items-center justify-center shrink-0',
                        a.enabled ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
                      )}>
                        <Zap className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-sm">{a.name}</p>
                          <Badge variant={a.enabled ? 'default' : 'outline'} className="text-[10px]">
                            {a.enabled ? 'Ativa' : 'Pausada'}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          Quando: {trigger?.label || a.trigger}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {a.actions.map((act, i) => {
                            const Icon = iconForAction(act.type)
                            return (
                              <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground flex items-center gap-1">
                                <Icon className="h-2.5 w-2.5" />
                                {act.type.replace(/_/g, ' ')}
                              </span>
                            )
                          })}
                        </div>
                        {results[a.id] && (
                          <div className="mt-2 p-2 rounded bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50">
                            <p className="text-[10px] font-medium text-emerald-700 dark:text-emerald-400 mb-1">Última execução:</p>
                            <ul className="space-y-0.5">
                              {results[a.id].map((r, i) => (
                                <li key={i} className="text-[10px] text-emerald-700 dark:text-emerald-400">{r}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <label className="flex items-center gap-1.5 text-[11px] cursor-pointer">
                        <Switch checked={a.enabled} onCheckedChange={() => toggle(a)} />
                      </label>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => execute(a)}
                        disabled={executing === a.id}
                      >
                        <Play className="h-3.5 w-3.5" />
                        <span className="ml-1 hidden sm:inline">Testar</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <NewAutomationModal open={modalOpen} onOpenChange={setModalOpen} onSubmit={handleCreate} />
    </div>
  )
}

function NewAutomationModal({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onSubmit: (data: Record<string, unknown>) => void
}) {
  const [name, setName] = useState('')
  const [trigger, setTrigger] = useState('novo_processo')
  const [selectedActions, setSelectedActions] = useState<string[]>([])

  const toggleAction = (id: string) => {
    setSelectedActions((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Nova automação</DialogTitle>
          <DialogDescription>Configure um workflow que executa automaticamente quando o evento ocorre.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label>Nome da automação *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Novo cliente - enviar boas-vindas" />
          </div>
          <div className="space-y-1.5">
            <Label>Gatilho (quando executar)</Label>
            <Select value={trigger} onValueChange={setTrigger}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TRIGGERS.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Ações a executar</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
              {ACTION_TYPES.map((a) => {
                const Icon = a.icon
                const selected = selectedActions.includes(a.id)
                return (
                  <label
                    key={a.id}
                    className={cn(
                      'flex items-center gap-2 p-2 rounded-md border cursor-pointer text-sm transition-colors',
                      selected ? 'border-primary bg-primary/5' : 'border-border hover:bg-accent'
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => toggleAction(a.id)}
                      className="h-4 w-4"
                    />
                    <Icon className="h-3.5 w-3.5" />
                    {a.label}
                  </label>
                )
              })}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button
            disabled={!name || selectedActions.length === 0}
            onClick={() => {
              onSubmit({
                name,
                trigger,
                actions: selectedActions.map((type) => {
                  const defaultData: Record<string, any> = { type }
                  if (type === 'enviar_email' || type === 'enviar_whatsapp') defaultData.to = 'cliente'
                  if (type === 'criar_tarefa') { defaultData.title = 'Tarefa automática'; defaultData.priority = 'Média' }
                  if (type === 'notificar_advogado') defaultData.message = 'Notificação automática'
                  if (type === 'resumir_ia') defaultData.target = 'andamento'
                  if (type === 'verificar_prazo') defaultData.days = 15
                  return defaultData
                }),
              })
              setName('')
              setSelectedActions([])
            }}
          >
            Criar automação
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
