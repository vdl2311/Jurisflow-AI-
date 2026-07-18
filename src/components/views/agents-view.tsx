'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
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
import {
  Bot, Play, Loader2, Sparkles, ShieldCheck, ShieldAlert, CheckCircle2,
  XCircle, Clock, Cpu, FileSearch, Search, PenLine, BookOpen, Scale, Plus,
} from 'lucide-react'
import { formatDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

interface Agent {
  id: string
  name: string
  description: string
  category: string
  capabilities: string[]
  tools: string[]
  supervisionEnabled: boolean
  status: string
  icon: string
  color: string
  stats: {
    totalRuns: number
    successRate: number
    avgDuration: number
    totalTokens: number
  }
}

const iconMap: Record<string, any> = {
  FileSearch, ShieldCheck, Search, PenLine, BookOpen, Scale, Bot,
}

const colorMap: Record<string, string> = {
  blue: 'bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400',
  green: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400',
  purple: 'bg-purple-50 text-purple-600 dark:bg-purple-950/30 dark:text-purple-400',
  amber: 'bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400',
  indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400',
  red: 'bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400',
}

export function AgentsView() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [runs, setRuns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [task, setTask] = useState('')
  const [executing, setExecuting] = useState(false)
  const [result, setResult] = useState<any>(null)
  const { toast } = useToast()

  const load = () => {
    setLoading(true)
    Promise.all([
      fetch('/api/agents').then((r) => r.json()),
      fetch('/api/agents/run?limit=10').then((r) => r.json()),
    ]).then(([a, r]) => {
      setAgents(a)
      setRuns(r)
    }).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const executeAgent = async () => {
    if (!selectedAgent || !task.trim()) return
    setExecuting(true)
    setResult(null)
    try {
      const res = await fetch('/api/agents/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: selectedAgent.id,
          task: task.trim(),
        }),
      })
      const data = await res.json()
      setResult(data)
      toast({
        title: data.status === 'Concluído' ? 'Agente executado' : 'Execução falhou',
        description: data.supervisionPassed ? 'Supervisory AI: APROVADO' : 'Supervisory AI: REJEITADO',
        variant: data.status === 'Concluído' ? 'default' : 'destructive',
      })
      load() // Atualiza histórico
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' })
    } finally {
      setExecuting(false)
    }
  }

  const openAgent = (agent: Agent) => {
    setSelectedAgent(agent)
    setTask('')
    setResult(null)
    setModalOpen(true)
  }

  return (
    <div className="p-4 md:p-6 space-y-5">
      {/* Hero explicativo - inspirado na Norm.ai */}
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <div className="h-12 w-12 rounded-lg bg-primary/15 text-primary flex items-center justify-center shrink-0">
              <Bot className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h2 className="font-semibold text-base">Agentes Jurídicos Autônomos</h2>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                Inspirado em <strong>Agentic Law</strong> da Norm.ai: agentes que executam tarefas jurídicas
                completas (não apenas respondem perguntas). Cada agente é verificado por uma{' '}
                <strong>Supervisory AI</strong> — segunda camada de IA que valida o output antes de entregar.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3">
                <div className="rounded-md border border-border bg-card/60 p-2">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Agentes ativos</p>
                  <p className="text-lg font-semibold">{agents.filter((a) => a.status === 'Ativo').length}</p>
                </div>
                <div className="rounded-md border border-border bg-card/60 p-2">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Execuções totais</p>
                  <p className="text-lg font-semibold">{agents.reduce((s, a) => s + a.stats.totalRuns, 0)}</p>
                </div>
                <div className="rounded-md border border-border bg-card/60 p-2">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Taxa aprovação</p>
                  <p className="text-lg font-semibold text-emerald-600">
                    {agents.length > 0
                      ? Math.round(agents.reduce((s, a) => s + a.stats.successRate, 0) / agents.length)
                      : 0}%
                  </p>
                </div>
                <div className="rounded-md border border-border bg-card/60 p-2">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Tokens consumidos</p>
                  <p className="text-lg font-semibold">
                    {(agents.reduce((s, a) => s + a.stats.totalTokens, 0) / 1000).toFixed(1)}k
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid de agentes */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-44 rounded-md bg-muted/40 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {agents.map((a) => {
            const Icon = iconMap[a.icon] || Bot
            return (
              <Card
                key={a.id}
                className="cursor-pointer hover:shadow-md hover:border-primary/30 transition-all"
                onClick={() => openAgent(a)}
              >
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className={cn('h-10 w-10 rounded-md flex items-center justify-center shrink-0', colorMap[a.color] || colorMap.blue)}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm leading-tight">{a.name}</p>
                      <Badge variant="outline" className="text-[9px] mt-0.5">{a.category}</Badge>
                    </div>
                    {a.supervisionEnabled && (
                      <div title="Supervisory AI ativa" className="text-primary">
                        <ShieldCheck className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                    {a.description}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {a.capabilities.slice(0, 3).map((c) => (
                      <span key={c} className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                        {c.replace(/_/g, ' ')}
                      </span>
                    ))}
                    {a.capabilities.length > 3 && (
                      <span className="text-[9px] text-muted-foreground">+{a.capabilities.length - 3}</span>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-1 pt-2 border-t border-border text-center">
                    <div>
                      <p className="text-[9px] text-muted-foreground uppercase">Runs</p>
                      <p className="text-xs font-semibold">{a.stats.totalRuns}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-muted-foreground uppercase">Aprovação</p>
                      <p className="text-xs font-semibold text-emerald-600">{a.stats.successRate}%</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-muted-foreground uppercase">Avg ms</p>
                      <p className="text-xs font-semibold">{a.stats.avgDuration}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Histórico de execuções */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Execuções recentes
          </CardTitle>
          <CardDescription>Histórico das últimas execuções de agentes</CardDescription>
        </CardHeader>
        <CardContent>
          {runs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Nenhuma execução ainda.</p>
          ) : (
            <ul className="space-y-2 max-h-96 overflow-y-auto">
              {runs.map((r) => (
                <li
                  key={r.id}
                  className="rounded-md border border-border p-3 cursor-pointer hover:bg-accent/40"
                  onClick={() => { setSelectedAgent(null); setResult(r); setModalOpen(true) }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{r.task}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {r.agent?.name} • {formatDateTime(r.createdAt)} • {r.duration}ms
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {r.supervisionPassed ? (
                        <Badge variant="outline" className="text-[9px] gap-0.5 text-emerald-700 border-emerald-300">
                          <CheckCircle2 className="h-2.5 w-2.5" /> Aprovado
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[9px] gap-0.5 text-red-700 border-red-300">
                          <XCircle className="h-2.5 w-2.5" /> Rejeitado
                        </Badge>
                      )}
                      <Badge variant="ghost" className="text-[9px]">{r.status}</Badge>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Modal de execução */}
      <Dialog open={modalOpen} onOpenChange={(v) => {
        setModalOpen(v)
        if (!v) { setTask(''); setResult(null) }
      }}>
        <DialogContent className="w-[95vw] max-h-[90vh] overflow-y-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedAgent && (() => {
                const Icon = iconMap[selectedAgent.icon] || Bot
                return <Icon className="h-5 w-5 text-primary" />
              })()}
              {selectedAgent?.name || 'Detalhes da execução'}
              {selectedAgent?.supervisionEnabled && (
                <Badge variant="outline" className="text-[10px] gap-0.5">
                  <ShieldCheck className="h-3 w-3" /> Supervisory AI
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              {selectedAgent?.description || (result && `Executado em ${formatDateTime(result.createdAt)}`)}
            </DialogDescription>
          </DialogHeader>

          {/* Capacidades do agente */}
          {selectedAgent && (
            <div className="space-y-2">
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">Capacidades</p>
              <div className="flex flex-wrap gap-1">
                {selectedAgent.capabilities.map((c) => (
                  <span key={c} className="text-[10px] px-2 py-0.5 rounded bg-muted text-muted-foreground">
                    {c.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Formulário de tarefa */}
          {selectedAgent && (
            <div className="space-y-2">
              <Label htmlFor="task">Descreva a tarefa para o agente executar</Label>
              <Textarea
                id="task"
                value={task}
                onChange={(e) => setTask(e.target.value)}
                rows={3}
                placeholder={`Ex.: Analise o contrato de prestação de serviços e identifique cláusulas abusivas...`}
                disabled={executing}
              />
              <Button
                onClick={executeAgent}
                disabled={executing || !task.trim()}
                className="w-full"
              >
                {executing ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Agente executando... Supervisory AI verificando...</>
                ) : (
                  <><Play className="h-4 w-4" /> Executar agente {selectedAgent.supervisionEnabled && '+ Supervisory AI'}</>
                )}
              </Button>
              <p className="text-[10px] text-muted-foreground text-center">
                💡 A Supervisory AI fará uma segunda análise crítica do output antes de aprovar.
              </p>
            </div>
          )}

          {/* Resultado da execução */}
          {result && (
            <div className="space-y-3 pt-2 border-t border-border">
              {/* Status */}
              <div className={cn(
                'rounded-md border p-3 flex items-center gap-2',
                result.supervisionPassed
                  ? 'border-emerald-300 bg-emerald-50 dark:bg-emerald-950/20'
                  : 'border-amber-300 bg-amber-50 dark:bg-amber-950/20'
              )}>
                {result.supervisionPassed ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                ) : (
                  <ShieldAlert className="h-5 w-5 text-amber-600" />
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {result.supervisionPassed ? 'Aprovado pela Supervisory AI' : 'Requer atenção humana'}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Status: {result.status} • Duração: {result.duration}ms • Tokens: {result.tokensUsed || 'N/A'}
                  </p>
                </div>
              </div>

              {/* Output do agente */}
              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1.5">
                  <Bot className="h-3.5 w-3.5" /> Output do agente
                </Label>
                <div className="rounded-md border border-border p-3 bg-muted/30 max-h-72 overflow-y-auto">
                  <pre className="text-[11px] whitespace-pre-wrap font-mono leading-relaxed">{result.output}</pre>
                </div>
              </div>

              {/* Supervisão */}
              {result.supervision && (
                <div className="space-y-1.5">
                  <Label className="text-xs flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Supervisory AI
                  </Label>
                  <div className="rounded-md border border-primary/30 bg-primary/5 p-3 max-h-72 overflow-y-auto">
                    <pre className="text-[11px] whitespace-pre-wrap font-mono leading-relaxed">{result.supervision}</pre>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
