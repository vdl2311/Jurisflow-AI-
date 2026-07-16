'use client'

import { useEffect, useState } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Activity,
  AlarmClock,
  AlertTriangle,
  ArrowDownCircle,
  ArrowUpCircle,
  CalendarClock,
  CheckSquare,
  FolderKanban,
  TrendingUp,
  Users,
  Sparkles,
  ChevronRight,
  Pause,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import { formatCurrency, formatDate, relativeDate, priorityColor, statusColor } from '@/lib/format'
import type { ViewName } from '@/app/page'
import { cn } from '@/lib/utils'

interface DashboardData {
  hoje: string
  resumo: {
    processosAtivos: number
    processosEncerrados: number
    clientesAtivos: number
    prazosHoje: number
    prazos7Dias: number
    prazosCriticos: number
    audienciasHoje: number
    tarefasAtrasadas: number
    tarefasPendentes: number
    processosParados: number
    aReceber: number
    aPagar: number
    recebidoMes: number
    despesasMes: number
  }
  prazosDeHoje: any[]
  proximosPrazos: any[]
  audienciasHoje: any[]
  honorariosAtrasados: any[]
  honorariosPendentes: any[]
  processosParados: any[]
  graficoMensal: { mes: string; receita: number; despesa: number }[]
  processosPorArea: { area: string; total: number }[]
}

interface Props {
  onOpenProcess: (id: string) => void
  onNavigate: (v: ViewName) => void
}

export function DashboardView({ onOpenProcess, onNavigate }: Props) {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard')
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false))
  }, [])

  if (loading || !data) {
    return (
      <div className="p-6 space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-28 rounded-lg bg-muted/40 animate-pulse" />
        ))}
      </div>
    )
  }

  const lucroMes = data.resumo.recebidoMes - data.resumo.despesasMes
  const pieData = data.processosPorArea
  const pieColors = ['oklch(0.55 0.13 155)', 'oklch(0.65 0.18 250)', 'oklch(0.7 0.18 60)', 'oklch(0.62 0.22 25)', 'oklch(0.65 0.16 295)']

  return (
    <div className="p-5 md:p-6 space-y-5">
      {/* Hero: alertas críticos */}
      {(data.resumo.prazosHoje > 0 || data.resumo.honorariosAtrasados > 0 || data.resumo.tarefasAtrasadas > 0) && (
        <Card className="border-amber-200 bg-amber-50/60 dark:bg-amber-950/20 dark:border-amber-900/50">
          <CardContent className="p-4 md:p-5">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-amber-900 dark:text-amber-200">Atenção necessária hoje</h3>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-0.5">
                  {data.resumo.prazosHoje > 0 && `${data.resumo.prazosHoje} prazo(s) vencendo hoje • `}
                  {data.resumo.honorariosAtrasados > 0 && `${data.resumo.honorariosAtrasados} honorário(s) em atraso • `}
                  {data.resumo.tarefasAtrasadas > 0 && `${data.resumo.tarefasAtrasadas} tarefa(s) atrasada(s)`}
                </p>
                <div className="flex flex-wrap gap-2 mt-2.5">
                  <Button size="sm" variant="outline" onClick={() => onNavigate('deadlines')}>
                    Ver prazos
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => onNavigate('financial')}>
                    Ver financeiro
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Métricas principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard
          label="Processos ativos"
          value={data.resumo.processosAtivos}
          sub={`${data.resumo.processosEncerrados} encerrados`}
          icon={FolderKanban}
          color="emerald"
          onClick={() => onNavigate('processes')}
        />
        <KpiCard
          label="Prazos hoje"
          value={data.resumo.prazosHoje}
          sub={`${data.resumo.prazosCriticos} críticos no total`}
          icon={AlarmClock}
          color="red"
          onClick={() => onNavigate('deadlines')}
        />
        <KpiCard
          label="Clientes ativos"
          value={data.resumo.clientesAtivos}
          sub={`${data.resumo.processosParados} processos parados`}
          icon={Users}
          color="blue"
          onClick={() => onNavigate('clients')}
        />
        <KpiCard
          label="Tarefas pendentes"
          value={data.resumo.tarefasPendentes}
          sub={`${data.resumo.tarefasAtrasadas} atrasadas`}
          icon={CheckSquare}
          color="purple"
          onClick={() => onNavigate('tasks')}
        />
      </div>

      {/* Financeiro resumido */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard
          label="Recebido no mês"
          value={formatCurrency(data.resumo.recebidoMes)}
          icon={ArrowUpCircle}
          color="emerald"
        />
        <KpiCard
          label="Despesas no mês"
          value={formatCurrency(data.resumo.despesasMes)}
          icon={ArrowDownCircle}
          color="red"
        />
        <KpiCard
          label="A receber"
          value={formatCurrency(data.resumo.aReceber)}
          sub="Honorários pendentes"
          icon={TrendingUp}
          color="emerald"
        />
        <KpiCard
          label="Resultado do mês"
          value={formatCurrency(lucroMes)}
          sub={lucroMes >= 0 ? 'Positivo' : 'Negativo'}
          icon={lucroMes >= 0 ? ArrowUpCircle : ArrowDownCircle}
          color={lucroMes >= 0 ? 'emerald' : 'red'}
        />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Receita vs Despesas</CardTitle>
            <CardDescription>Últimos 6 meses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.graficoMensal}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.91 0 0 / 0.5)" />
                  <XAxis dataKey="mes" stroke="oklch(0.52 0 0)" fontSize={12} />
                  <YAxis
                    stroke="oklch(0.52 0 0)"
                    fontSize={11}
                    tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(v: number) => formatCurrency(v)}
                    contentStyle={{
                      borderRadius: 8,
                      border: '1px solid oklch(0.91 0 0)',
                      fontSize: 12,
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="receita" name="Receita" fill="oklch(0.55 0.13 155)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="despesa" name="Despesa" fill="oklch(0.62 0.22 25)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Processos por área</CardTitle>
            <CardDescription>Distribuição dos casos ativos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="total"
                    nameKey="area"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={40}
                    label={(entry: { area: string; total: number }) => `${entry.area}: ${entry.total}`}
                    labelLine={false}
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={pieColors[i % pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Colunas: Prazos de hoje + Processos parados */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <AlarmClock className="h-4 w-4 text-amber-500" />
                  Prazos de hoje
                </CardTitle>
                <CardDescription>{data.prazosDeHoje.length} vencendo hoje</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => onNavigate('deadlines')}>
                Ver todos <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {data.prazosDeHoje.length === 0 ? (
              <EmptyState text="Nenhum prazo para hoje. Bom trabalho!" />
            ) : (
              <ul className="space-y-2 max-h-72 overflow-y-auto">
                {data.prazosDeHoje.map((d) => (
                  <li
                    key={d.id}
                    onClick={() => d.process && onOpenProcess(d.processId)}
                    className="cursor-pointer rounded-md border border-border p-3 hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-start gap-2">
                      <span className={cn('text-xs px-1.5 py-0.5 rounded border font-medium', priorityColor(d.priority))}>
                        {d.priority}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{d.title}</p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {d.process?.title}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Pause className="h-4 w-4 text-muted-foreground" />
                  Processos sem movimento
                </CardTitle>
                <CardDescription>Há mais de 90 dias sem andamento</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => onNavigate('processes')}>
                Ver todos <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {data.processosParados.length === 0 ? (
              <EmptyState text="Todos os processos estão em movimento." />
            ) : (
              <ul className="space-y-2 max-h-72 overflow-y-auto">
                {data.processosParados.map((p) => (
                  <li
                    key={p.id}
                    onClick={() => onOpenProcess(p.id)}
                    className="cursor-pointer rounded-md border border-border p-3 hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{p.title}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{p.cnj}</p>
                      </div>
                      <Badge variant="outline" className="text-[10px]">
                        {p.diasParado >= 999 ? 'Sem movimentação' : `${p.diasParado}d parado`}
                      </Badge>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Honorários atrasados + Ações sugeridas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ArrowDownCircle className="h-4 w-4 text-red-500" />
              Honorários em atraso
            </CardTitle>
            <CardDescription>{data.honorariosAtrasados.length} em atraso</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            {data.honorariosAtrasados.length === 0 ? (
              <EmptyState text="Nenhum honorário em atraso." />
            ) : (
              <ul className="space-y-2 max-h-72 overflow-y-auto">
                {data.honorariosAtrasados.map((h) => (
                  <li
                    key={h.id}
                    className="rounded-md border border-border p-3 flex items-start justify-between gap-2"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{h.description}</p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {h.client?.name} • Venc.: {formatDate(h.dueDate)}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-red-600 dark:text-red-400">
                      {formatCurrency(h.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Ações sugeridas pelo Copiloto
            </CardTitle>
            <CardDescription>Com base nos dados do seu escritório</CardDescription>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            <SuggestedAction
              text="Resumir o processo João Santos vs Construtora Horizonte antes da audiência de amanhã"
              onClick={() => onNavigate('copilot')}
            />
            <SuggestedAction
              text={`Enviar cobrança de R$ ${data.honorariosAtrasados[0]?.amount.toFixed(2) || '0'} para ${data.honorariosAtrasados[0]?.client?.name || ''}`}
              onClick={() => onNavigate('financial')}
            />
            <SuggestedAction
              text={`${data.resumo.processosParados} processo(s) parado(s) há mais de 90 dias. Verificar andamentos.`}
              onClick={() => onNavigate('processes')}
            />
            <Button className="w-full mt-2" onClick={() => onNavigate('copilot')}>
              <Sparkles className="h-4 w-4 mr-2" />
              Abrir Copiloto Jurídico
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  color,
  onClick,
}: {
  label: string
  value: string | number
  sub?: string
  icon: React.ComponentType<{ className?: string }>
  color: 'emerald' | 'red' | 'blue' | 'purple'
  onClick?: () => void
}) {
  const colorMap = {
    emerald: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30',
    red: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30',
    blue: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30',
    purple: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/30',
  }
  return (
    <Card
      className={cn(onClick && 'cursor-pointer hover:shadow-md transition-shadow')}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
            {label}
          </p>
          <div className={cn('h-8 w-8 rounded-md flex items-center justify-center', colorMap[color])}>
            <Icon className="h-4 w-4" />
          </div>
        </div>
        <p className="text-2xl font-semibold mt-2 leading-none">{value}</p>
        {sub && <p className="text-[11px] text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <Activity className="h-8 w-8 text-muted-foreground/40 mb-2" />
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  )
}

function SuggestedAction({ text, onClick }: { text: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-md border border-primary/20 bg-card/60 hover:bg-card p-2.5 text-sm transition-colors"
    >
      <div className="flex items-start gap-2">
        <ChevronRight className="h-4 w-4 mt-0.5 text-primary shrink-0" />
        <span>{text}</span>
      </div>
    </button>
  )
}
