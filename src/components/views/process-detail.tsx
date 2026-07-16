'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import {
  ArrowLeft,
  Scale,
  User,
  Calendar,
  Gavel,
  FileText,
  CheckSquare,
  DollarSign,
  FolderOpen,
  Sparkles,
  Plus,
  AlertCircle,
  Cloud,
} from 'lucide-react'
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  relativeDate,
  priorityColor,
  statusColor,
  riskColor,
  timelineColor,
} from '@/lib/format'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

interface ProcessDetailData {
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
  createdAt: string
  client: {
    id: string
    name: string
    type: string
    document: string | null
    email: string | null
    phone: string | null
  }
  movements: any[]
  deadlines: any[]
  tasks: any[]
  financials: any[]
  documents: any[]
  timeline: {
    date: string
    type: string
    title: string
    description: string | null
    color: string
  }[]
}

interface Props {
  processId: string
  onBack: () => void
  onOpenClient: (id: string) => void
}

export function ProcessDetail({ processId, onBack }: Props) {
  const [data, setData] = useState<ProcessDetailData | null>(null)
  const [loading, setLoading] = useState(true)
  const [movModalOpen, setMovModalOpen] = useState(false)
  const [aiSummary, setAiSummary] = useState<string | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const { toast } = useToast()

  const load = () => {
    setLoading(true)
    fetch(`/api/processes/${processId}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [processId])

  const addMovement = async (movData: Record<string, unknown>) => {
    const res = await fetch(`/api/processes/${processId}/movements`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(movData),
    })
    if (res.ok) {
      toast({ title: 'Andamento registrado', description: 'Movimento adicionado à timeline.' })
      setMovModalOpen(false)
      load()
    }
  }

  const toggleDeadline = async (id: string, done: boolean) => {
    await fetch(`/api/deadlines?id=${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ done: !done }),
    })
    load()
  }

  const summarizeWithAI = async () => {
    setAiLoading(true)
    setAiSummary(null)
    try {
      const res = await fetch('/api/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pergunta: `Resuma o processo "${data?.title}" (CNJ: ${data?.cnj}). Inclua: situação atual, últimos andamentos, próximos passos recomendados e possíveis riscos.`,
        }),
      })
      const result = await res.json()
      setAiSummary(result.resposta || result.error)
    } catch {
      setAiSummary('Erro ao gerar resumo.')
    } finally {
      setAiLoading(false)
    }
  }

  if (loading || !data) {
    return (
      <div className="p-6 space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-32 rounded-lg bg-muted/40 animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="p-5 md:p-6 space-y-5">
      {/* Header */}
      <div className="space-y-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="-ml-2">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Voltar para processos
        </Button>

        <div className="flex items-start gap-3">
          <div className="h-12 w-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Scale className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg md:text-xl font-semibold leading-tight">{data.title}</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {data.cnj || 'Sem CNJ'} • {data.court} • {data.section}
            </p>
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <span className={cn('text-[10px] px-1.5 py-0.5 rounded border font-medium', statusColor(data.status))}>
                {data.status}
              </span>
              {data.area && (
                <Badge variant="outline" className="text-[10px]">{data.area}</Badge>
              )}
              <span className={cn('text-[10px] px-1.5 py-0.5 rounded font-medium', riskColor(data.risk))}>
                Risco {data.risk}
              </span>
              {data.caseValue !== null && data.caseValue > 0 && (
                <Badge variant="outline" className="text-[10px]">
                  {formatCurrency(data.caseValue)}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <Button onClick={summarizeWithAI} disabled={aiLoading}>
              <Sparkles className="h-4 w-4 mr-1.5" />
              {aiLoading ? 'Resumindo...' : 'Resumir com IA'}
            </Button>
          </div>
        </div>
      </div>

      {/* AI Summary */}
      {aiSummary && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Resumo do Copiloto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm whitespace-pre-wrap leading-relaxed">{aiSummary}</div>
          </CardContent>
        </Card>
      )}

      {/* Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider font-medium">
              <User className="h-3.5 w-3.5" /> Cliente
            </div>
            <p className="font-medium text-sm">{data.client.name}</p>
            <p className="text-[11px] text-muted-foreground">
              {data.client.type === 'PF' ? 'CPF' : 'CNPJ'}: {data.client.document || '-'}
            </p>
            <p className="text-[11px] text-muted-foreground">{data.client.email || '-'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider font-medium">
              <Gavel className="h-3.5 w-3.5" /> Responsável
            </div>
            <p className="font-medium text-sm">{data.responsibleId || '-'}</p>
            <p className="text-[11px] text-muted-foreground">Cadastro: {formatDate(data.createdAt)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider font-medium">
              <FileText className="h-3.5 w-3.5" /> Classe / Assunto
            </div>
            <p className="font-medium text-sm">{data.classType || '-'}</p>
            <p className="text-[11px] text-muted-foreground line-clamp-2">{data.subject || '-'}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="timeline">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="timeline">Timeline ({data.timeline.length})</TabsTrigger>
          <TabsTrigger value="movements">Andamentos ({data.movements.length})</TabsTrigger>
          <TabsTrigger value="deadlines">Prazos ({data.deadlines.length})</TabsTrigger>
          <TabsTrigger value="tasks">Tarefas ({data.tasks.length})</TabsTrigger>
          <TabsTrigger value="financial">Financeiro ({data.financials.length})</TabsTrigger>
          <TabsTrigger value="documents">Documentos ({data.documents.length})</TabsTrigger>
        </TabsList>

        {/* TIMELINE */}
        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Timeline unificada</CardTitle>
              <CardDescription>Todos os eventos do processo em ordem cronológica</CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="relative border-l-2 border-muted ml-3 space-y-4">
                {data.timeline.map((t, i) => (
                  <li key={i} className="ml-6">
                    <span
                      className={cn(
                        'absolute -left-[9px] flex h-4 w-4 items-center justify-center rounded-full ring-4 ring-background',
                        timelineColor(t.type)
                      )}
                    />
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                      <span className="text-[11px] text-muted-foreground font-medium shrink-0 sm:w-28">
                        {formatDate(t.date)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="text-[10px]">{t.type}</Badge>
                          <p className="text-sm font-medium">{t.title}</p>
                        </div>
                        {t.description && (
                          <p className="text-xs text-muted-foreground mt-0.5">{t.description}</p>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </TabsContent>

        {/* MOVEMENTS */}
        <TabsContent value="movements">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-base">Andamentos processuais</CardTitle>
                <CardDescription>Histórico de movimentações no tribunal</CardDescription>
              </div>
              <Button size="sm" onClick={() => setMovModalOpen(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Adicionar
              </Button>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {data.movements.map((m) => (
                  <li key={m.id} className="rounded-md border border-border p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">{m.description}</p>
                          {m.important && (
                            <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                          )}
                        </div>
                        {m.summary && (
                          <p className="text-xs text-muted-foreground mt-1">{m.summary}</p>
                        )}
                      </div>
                      <span className="text-[11px] text-muted-foreground shrink-0">
                        {formatDate(m.date)}
                      </span>
                    </div>
                  </li>
                ))}
                {data.movements.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    Nenhum andamento registrado.
                  </p>
                )}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        {/* DEADLINES */}
        <TabsContent value="deadlines">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Prazos do processo</CardTitle>
              <CardDescription>Prazos fatais e internos</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {data.deadlines.map((d) => (
                  <li
                    key={d.id}
                    className={cn(
                      'rounded-md border p-3 flex items-start gap-3',
                      d.done ? 'border-emerald-200 bg-emerald-50/40 dark:bg-emerald-950/20' : 'border-border'
                    )}
                  >
                    <button
                      onClick={() => toggleDeadline(d.id, d.done)}
                      className={cn(
                        'mt-0.5 h-4 w-4 rounded border-2 flex items-center justify-center shrink-0',
                        d.done ? 'bg-emerald-500 border-emerald-500' : 'border-input hover:border-primary'
                      )}
                    >
                      {d.done && <CheckSquare className="h-3 w-3 text-white" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-sm font-medium', d.done && 'line-through text-muted-foreground')}>
                        {d.title}
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        <span className={cn('text-[10px] px-1.5 py-0.5 rounded border font-medium', priorityColor(d.priority))}>
                          {d.priority}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded border border-border text-muted-foreground">
                          {d.type}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {formatDate(d.dueDate)} • {relativeDate(d.dueDate)}
                        </span>
                        {d.responsible && (
                          <span className="text-[11px] text-muted-foreground">• {d.responsible}</span>
                        )}
                      </div>
                      {d.notes && <p className="text-xs text-muted-foreground mt-1">{d.notes}</p>}
                    </div>
                  </li>
                ))}
                {data.deadlines.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    Nenhum prazo para este processo.
                  </p>
                )}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TASKS */}
        <TabsContent value="tasks">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tarefas vinculadas</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {data.tasks.map((t) => (
                  <li key={t.id} className="rounded-md border border-border p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{t.title}</p>
                        {t.description && <p className="text-xs text-muted-foreground mt-0.5">{t.description}</p>}
                      </div>
                      <span className={cn('text-[10px] px-1.5 py-0.5 rounded border font-medium', statusColor(t.status))}>
                        {t.status}
                      </span>
                    </div>
                  </li>
                ))}
                {data.tasks.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-6">Nenhuma tarefa.</p>
                )}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        {/* FINANCIAL */}
        <TabsContent value="financial">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Lançamentos financeiros</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {data.financials.map((f) => (
                  <li key={f.id} className="rounded-md border border-border p-3 flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{f.description}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {f.category} • Venc.: {formatDate(f.dueDate)}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={cn('text-sm font-semibold', f.type === 'Receita' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400')}>
                        {f.type === 'Receita' ? '+' : '-'} {formatCurrency(f.amount)}
                      </p>
                      <span className={cn('text-[10px] px-1.5 py-0.5 rounded border font-medium', statusColor(f.status))}>
                        {f.status}
                      </span>
                    </div>
                  </li>
                ))}
                {data.financials.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-6">Nenhum lançamento.</p>
                )}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        {/* DOCUMENTS */}
        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Documentos</CardTitle>
              <CardDescription>Peças, contratos e anexos do processo</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {data.documents.map((d) => (
                  <li key={d.id} className="rounded-md border border-border p-3 flex items-center gap-3 hover:bg-accent/50 cursor-pointer">
                    <div className="h-9 w-9 rounded-md bg-muted flex items-center justify-center shrink-0">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{d.name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {d.type} • {d.size} • {formatDate(d.createdAt)}
                      </p>
                    </div>
                  </li>
                ))}
                {data.documents.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-6 md:col-span-2">
                    Nenhum documento vinculado.
                  </p>
                )}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <MovementModal open={movModalOpen} onOpenChange={setMovModalOpen} onSubmit={addMovement} />
    </div>
  )
}

function MovementModal({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onSubmit: (data: Record<string, unknown>) => void
}) {
  const [form, setForm] = useState({
    description: '',
    summary: '',
    date: new Date().toISOString().split('T')[0],
    important: false,
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar andamento</DialogTitle>
          <DialogDescription>Registre uma movimentação no processo.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="m-desc">Descrição *</Label>
            <Input id="m-desc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Ex.: Juntada de petição" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="m-sum">Resumo (IA vai enriquecer)</Label>
            <Textarea id="m-sum" value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} rows={3} placeholder="Detalhes do andamento..." />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="m-date">Data</Label>
            <Input id="m-date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="m-imp" checked={form.important} onChange={(e) => setForm({ ...form, important: e.target.checked })} />
            <Label htmlFor="m-imp" className="text-sm font-normal cursor-pointer">Marcar como importante</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button
            disabled={!form.description}
            onClick={() => {
              onSubmit({
                description: form.description,
                summary: form.summary,
                date: form.date,
                important: form.important,
              })
              setForm({ description: '', summary: '', date: new Date().toISOString().split('T')[0], important: false })
            }}
          >
            Adicionar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
