'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Users, HardDrive, FolderKanban, FileText, Activity, Crown,
  LogIn, UserPlus, FilePlus, DollarSign, CheckCircle, Zap, Database,
  Cloud, RefreshCw, Loader2, Clock, AlertCircle,
} from 'lucide-react'
import { formatCurrency, formatDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

interface AdminData {
  resumo: {
    totalUsers: number
    totalClients: number
    totalProcesses: number
    totalDocuments: number
    totalFinanceiro: number
    storageUsedMB: number
    storageLimitMB: number
    maxUsers: number
  }
  metricas30d: {
    logins: number
    novosProcessos: number
    novosClientes: number
    tarefasConcluidas: number
    recebido: number
  }
  subscription: {
    plano: string
    status: string
    startDate: string
    endDate: string
    price: number
    maxUsers: number
    maxStorage: number
    features: string | null
  } | null
  plans: any[]
  automations: any[]
  auditLogs: any[]
}

export function AdminView() {
  const [data, setData] = useState<AdminData | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'overview' | 'planos' | 'logs' | 'automations'>('overview')

  useEffect(() => {
    fetch('/api/admin')
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false))
  }, [])

  if (loading || !data) {
    return (
      <div className="p-6 space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-32 rounded-md bg-muted/40 animate-pulse" />
        ))}
      </div>
    )
  }

  const storagePercent = Math.min(100, (data.resumo.storageUsedMB / data.resumo.storageLimitMB) * 100)
  const usersPercent = Math.min(100, (data.resumo.totalUsers / data.resumo.maxUsers) * 100)
  const features: string[] = data.subscription?.features ? JSON.parse(data.subscription.features) : []
  const diasRestantes = data.subscription
    ? Math.max(0, Math.floor((new Date(data.subscription.endDate).getTime() - Date.now()) / 86400000))
    : 0

  return (
    <div className="p-5 md:p-6 space-y-4">
      {/* Tabs */}
      <div className="flex gap-1 rounded-md border border-border p-0.5 bg-muted/30 w-fit">
        {[
          { id: 'overview', label: 'Visão geral' },
          { id: 'planos', label: 'Planos & Assinatura' },
          { id: 'automations', label: 'Automações' },
          { id: 'logs', label: 'Logs & Auditoria' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as any)}
            className={cn(
              'px-3 py-1 text-xs font-medium rounded transition-colors',
              tab === t.id ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="space-y-4">
          {/* Assinatura atual */}
          <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-primary/20 text-primary flex items-center justify-center">
                    <Crown className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-base">Plano {data.subscription?.plano || 'Starter'}</h3>
                      <Badge variant="outline" className="text-[10px]">{data.subscription?.status}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {diasRestantes} dias restantes • Vence em {new Date(data.subscription?.endDate || '').toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">{formatCurrency(data.subscription?.price || 0)}<span className="text-xs font-normal text-muted-foreground">/mês</span></p>
                  <Button size="sm" className="mt-1">Fazer upgrade</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Estatísticas de uso */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Usuários</p>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-semibold">{data.resumo.totalUsers} <span className="text-sm text-muted-foreground font-normal">/ {data.resumo.maxUsers}</span></p>
                <Progress value={usersPercent} className="h-2" />
                <p className="text-[11px] text-muted-foreground">
                  {data.resumo.maxUsers - data.resumo.totalUsers} usuários disponíveis
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Armazenamento</p>
                  <HardDrive className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-semibold">{data.resumo.storageUsedMB} MB <span className="text-sm text-muted-foreground font-normal">/ {data.resumo.storageLimitMB} MB</span></p>
                <Progress value={storagePercent} className="h-2" />
                <p className="text-[11px] text-muted-foreground">
                  {data.resumo.storageLimitMB - data.resumo.storageUsedMB} MB disponíveis
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Estatísticas do sistema */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="Total de clientes" value={data.resumo.totalClients} icon={Users} color="emerald" />
            <StatCard label="Total de processos" value={data.resumo.totalProcesses} icon={FolderKanban} color="blue" />
            <StatCard label="Documentos" value={data.resumo.totalDocuments} icon={FileText} color="purple" />
            <StatCard label="Movimentação fin." value={formatCurrency(data.resumo.totalFinanceiro)} icon={DollarSign} color="amber" />
          </div>

          {/* Métricas 30 dias */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Métricas dos últimos 30 dias</CardTitle>
              <CardDescription>Atividade do escritório no período</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <MetricItem icon={LogIn} label="Logins" value={data.metricas30d.logins} />
                <MetricItem icon={FolderKanban} label="Novos processos" value={data.metricas30d.novosProcessos} />
                <MetricItem icon={UserPlus} label="Novos clientes" value={data.metricas30d.novosClientes} />
                <MetricItem icon={CheckCircle} label="Tarefas concluídas" value={data.metricas30d.tarefasConcluidas} />
                <MetricItem icon={DollarSign} label="Recebido" value={formatCurrency(data.metricas30d.recebido)} />
              </div>
            </CardContent>
          </Card>

          {/* Features habilitadas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recursos habilitados no plano</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {features.map((f) => (
                  <Badge key={f} variant="outline" className="text-[11px] gap-1">
                    <Zap className="h-3 w-3" /> {f.replace(/_/g, ' ')}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {tab === 'planos' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {data.plans.map((p) => (
            <Card key={p.id} className={cn(p.name === data.subscription?.plano && 'border-primary ring-1 ring-primary')}>
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{p.name}</h3>
                  {p.name === data.subscription?.plano && (
                    <Badge className="text-[10px]">Plano atual</Badge>
                  )}
                </div>
                <p className="text-3xl font-bold">
                  {formatCurrency(p.price)}<span className="text-xs font-normal text-muted-foreground">/mês</span>
                </p>
                <ul className="space-y-1.5 text-sm">
                  <li className="flex items-center gap-2">
                    <Users className="h-3.5 w-3.5 text-muted-foreground" />
                    Até {p.maxUsers} usuários
                  </li>
                  <li className="flex items-center gap-2">
                    <HardDrive className="h-3.5 w-3.5 text-muted-foreground" />
                    {p.maxStorage} MB de armazenamento
                  </li>
                  {JSON.parse(p.features).map((f: string) => (
                    <li key={f} className="flex items-center gap-2">
                      <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                      {f.replace(/_/g, ' ')}
                    </li>
                  ))}
                </ul>
                <Button variant={p.name === data.subscription?.plano ? 'outline' : 'default'} className="w-full" disabled={p.name === data.subscription?.plano}>
                  {p.name === data.subscription?.plano ? 'Plano atual' : 'Fazer upgrade'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {tab === 'automations' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Automações configuradas</CardTitle>
            <CardDescription>Workflows executados automaticamente com base em eventos</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {data.automations.map((a) => (
                <li key={a.id} className="rounded-md border border-border p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-primary" />
                        <p className="text-sm font-medium">{a.name}</p>
                        <Badge variant={a.enabled ? 'default' : 'outline'} className="text-[10px]">
                          {a.enabled ? 'Ativa' : 'Pausada'}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Gatilho: <code className="bg-muted px-1 rounded">{a.trigger}</code>
                      </p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {a.actions.map((act: any, i: number) => (
                          <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                            {act.type.replace(/_/g, ' ')}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {tab === 'logs' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Logs de auditoria</CardTitle>
            <CardDescription>Registro completo de ações no sistema (LGPD)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-[600px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-background border-b border-border">
                  <tr>
                    <th className="text-left p-2 text-[11px] font-medium text-muted-foreground uppercase">Quando</th>
                    <th className="text-left p-2 text-[11px] font-medium text-muted-foreground uppercase">Usuário</th>
                    <th className="text-left p-2 text-[11px] font-medium text-muted-foreground uppercase">Ação</th>
                    <th className="text-left p-2 text-[11px] font-medium text-muted-foreground uppercase">Detalhes</th>
                  </tr>
                </thead>
                <tbody>
                  {data.auditLogs.map((log) => (
                    <tr key={log.id} className="border-b border-border/50 hover:bg-accent/30">
                      <td className="p-2 text-[11px] text-muted-foreground whitespace-nowrap">{formatDateTime(log.createdAt)}</td>
                      <td className="p-2 text-xs">{log.user}</td>
                      <td className="p-2 text-xs">
                        <Badge variant="outline" className="text-[10px]">{log.action}</Badge>
                        <span className="ml-1 text-muted-foreground">{log.entity}</span>
                      </td>
                      <td className="p-2 text-[11px] text-muted-foreground">{log.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  )
}

function StatCard({ label, value, icon: Icon, color }: any) {
  const colorMap: Record<string, string> = {
    emerald: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30',
    red: 'text-red-600 bg-red-50 dark:bg-red-950/30',
    blue: 'text-blue-600 bg-blue-50 dark:bg-blue-950/30',
    purple: 'text-purple-600 bg-purple-50 dark:bg-purple-950/30',
    amber: 'text-amber-600 bg-amber-50 dark:bg-amber-950/30',
  }
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">{label}</p>
          <div className={cn('h-7 w-7 rounded-md flex items-center justify-center', colorMap[color])}>
            <Icon className="h-3.5 w-3.5" />
          </div>
        </div>
        <p className="text-xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  )
}

function MetricItem({ icon: Icon, label, value }: any) {
  return (
    <div className="rounded-md border border-border p-3 text-center">
      <Icon className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
      <p className="text-lg font-semibold">{value}</p>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
    </div>
  )
}
