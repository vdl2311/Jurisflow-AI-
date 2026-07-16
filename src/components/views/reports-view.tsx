'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { FileBarChart, Download, Loader2 } from 'lucide-react'
import { formatCurrency } from '@/lib/format'

const REPORT_TYPES = [
  { id: 'processos', label: 'Processos', desc: 'Status, áreas, riscos, responsáveis' },
  { id: 'clientes', label: 'Clientes', desc: 'Cadastro, status, top clientes' },
  { id: 'financeiro', label: 'Financeiro', desc: 'Receitas, despesas, saldo, categorias' },
  { id: 'honorarios', label: 'Honorários', desc: 'Honorários por status e cliente' },
  { id: 'produtividade', label: 'Produtividade', desc: 'Horas trabalhadas, tarefas' },
  { id: 'advogados', label: 'Por Advogado', desc: 'Processos e valor por responsável' },
  { id: 'tribunal', label: 'Por Tribunal', desc: 'Distribuição por tribunal' },
  { id: 'area', label: 'Por Área', desc: 'Distribuição por área jurídica' },
]

const COLORS = ['oklch(0.55 0.13 155)', 'oklch(0.65 0.18 250)', 'oklch(0.7 0.18 60)', 'oklch(0.62 0.22 25)', 'oklch(0.65 0.16 295)']

export function ReportsView() {
  const [type, setType] = useState('processos')
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [inicio, setInicio] = useState('')
  const [fim, setFim] = useState('')

  const load = () => {
    setLoading(true)
    const params = new URLSearchParams({ type })
    if (inicio) params.set('inicio', inicio)
    if (fim) params.set('fim', fim)
    fetch(`/api/reports?${params}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [type])

  return (
    <div className="p-5 md:p-6 space-y-4">
      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3 md:items-end">
            <div className="flex-1 space-y-1.5">
              <Label className="text-xs">Tipo de relatório</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {REPORT_TYPES.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.label} — {r.desc}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Data início</Label>
              <Input type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} className="w-full md:w-40" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Data fim</Label>
              <Input type="date" value={fim} onChange={(e) => setFim(e.target.value)} className="w-full md:w-40" />
            </div>
            <Button onClick={load} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileBarChart className="h-4 w-4" />}
              Gerar
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading && (
        <Card>
          <CardContent className="p-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-primary" />
            <p className="text-sm text-muted-foreground">Gerando relatório...</p>
          </CardContent>
        </Card>
      )}

      {!loading && data && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-base">{data.titulo}</CardTitle>
                {data.periodo && (
                  <CardDescription>
                    Período: {new Date(data.periodo.inicio).toLocaleDateString('pt-BR')} a {new Date(data.periodo.fim).toLocaleDateString('pt-BR')}
                  </CardDescription>
                )}
              </div>
              <Button variant="outline" size="sm" onClick={() => window.print()}>
                <Download className="h-4 w-4 mr-1.5" />
                Exportar PDF
              </Button>
            </CardHeader>
          </Card>

          {/* Renderização específica por tipo */}
          {type === 'processos' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader><CardTitle className="text-sm">Por Status</CardTitle></CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={data.porStatus} dataKey="total" nameKey="status" cx="50%" cy="50%" outerRadius={80} label>
                          {data.porStatus.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-sm">Por Área</CardTitle></CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.porArea}>
                        <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.91 0 0 / 0.5)" />
                        <XAxis dataKey="area" fontSize={11} />
                        <YAxis fontSize={11} />
                        <Tooltip />
                        <Bar dataKey="total" fill="oklch(0.55 0.13 155)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-sm">Por Risco</CardTitle></CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {data.porRisco.map((r: any) => (
                      <li key={r.risco} className="flex items-center justify-between p-2 rounded bg-muted/30">
                        <span className="text-sm">Risco {r.risco}</span>
                        <Badge variant="outline">{r.total}</Badge>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-sm">Por Responsável</CardTitle></CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {data.porResponsavel.map((r: any) => (
                      <li key={r.advogado} className="flex items-center justify-between p-2 rounded bg-muted/30">
                        <span className="text-sm">{r.advogado || '-'}</span>
                        <Badge variant="outline">{r.total} processos</Badge>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
              <Card className="md:col-span-2">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Valor total das causas:</p>
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(data.valorTotalCausas)}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {type === 'financeiro' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Card><CardContent className="p-4"><p className="text-[11px] text-muted-foreground uppercase">Recebido</p><p className="text-xl font-semibold text-emerald-600">{formatCurrency(data.recebido)}</p></CardContent></Card>
                <Card><CardContent className="p-4"><p className="text-[11px] text-muted-foreground uppercase">Pago</p><p className="text-xl font-semibold text-red-600">{formatCurrency(data.pago)}</p></CardContent></Card>
                <Card><CardContent className="p-4"><p className="text-[11px] text-muted-foreground uppercase">A receber</p><p className="text-xl font-semibold">{formatCurrency(data.aReceber)}</p></CardContent></Card>
                <Card><CardContent className="p-4"><p className="text-[11px] text-muted-foreground uppercase">Saldo</p><p className={`text-xl font-semibold ${data.saldo >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{formatCurrency(data.saldo)}</p></CardContent></Card>
              </div>
              <Card>
                <CardHeader><CardTitle className="text-sm">Por Categoria</CardTitle></CardHeader>
                <CardContent>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.porCategoria}>
                        <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.91 0 0 / 0.5)" />
                        <XAxis dataKey="categoria" fontSize={11} />
                        <YAxis fontSize={11} tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
                        <Tooltip formatter={(v: number) => formatCurrency(v)} />
                        <Legend />
                        <Bar dataKey="total" name="Valor" fill="oklch(0.55 0.13 155)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {type === 'produtividade' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Card><CardContent className="p-4"><p className="text-[11px] text-muted-foreground uppercase">Total de horas</p><p className="text-xl font-semibold">{data.totalHoras}h</p></CardContent></Card>
                <Card><CardContent className="p-4"><p className="text-[11px] text-muted-foreground uppercase">Horas faturáveis</p><p className="text-xl font-semibold text-emerald-600">{data.horasFaturaveis}h</p></CardContent></Card>
                <Card><CardContent className="p-4"><p className="text-[11px] text-muted-foreground uppercase">Tarefas concluídas</p><p className="text-xl font-semibold">{data.tarefasConcluidas}</p></CardContent></Card>
              </div>
              <Card>
                <CardHeader><CardTitle className="text-sm">Horas por usuário</CardTitle></CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {data.porUsuario.map((u: any) => (
                      <li key={u.usuario} className="flex items-center justify-between p-2 rounded bg-muted/30">
                        <span className="text-sm font-medium">{u.usuario}</span>
                        <div className="text-right">
                          <p className="text-sm">{u.horas}h totais</p>
                          <p className="text-[11px] text-muted-foreground">{u.faturaveis}h faturáveis</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          )}

          {type === 'honorarios' && (
            <div className="space-y-4">
              <Card>
                <CardHeader><CardTitle className="text-sm">Honorários por status</CardTitle></CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {data.porStatus.map((s: any) => (
                      <li key={s.status} className="flex items-center justify-between p-2 rounded bg-muted/30">
                        <span className="text-sm">{s.status} ({s.quantidade} lançamentos)</span>
                        <span className="text-sm font-semibold">{formatCurrency(s.total)}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 pt-4 border-t border-border">
                    <p className="text-sm text-muted-foreground">Total geral:</p>
                    <p className="text-2xl font-bold">{formatCurrency(data.totalGeral)}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {(type === 'tribunal' || type === 'area' || type === 'advogados') && (
            <Card>
              <CardHeader><CardTitle className="text-sm">Distribuição</CardTitle></CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={data.tribunais || data.areas || data.advogados}
                      layout="vertical"
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.91 0 0 / 0.5)" />
                      <XAxis type="number" fontSize={11} />
                      <YAxis type="category" dataKey={Object.keys(data.tribunais?.[0] || data.areas?.[0] || data.advogados?.[0] || {})[0]} fontSize={11} width={150} />
                      <Tooltip />
                      <Bar dataKey="total" fill="oklch(0.55 0.13 155)" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {type === 'clientes' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Card><CardContent className="p-4"><p className="text-[11px] text-muted-foreground uppercase">Novos no período</p><p className="text-xl font-semibold">{data.novosNoPeriodo}</p></CardContent></Card>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader><CardTitle className="text-sm">Por status</CardTitle></CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {data.porStatus.map((s: any) => (
                        <li key={s.status} className="flex items-center justify-between p-2 rounded bg-muted/30">
                          <span className="text-sm">{s.status}</span>
                          <Badge variant="outline">{s.total}</Badge>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle className="text-sm">Top 10 clientes</CardTitle></CardHeader>
                  <CardContent>
                    <ul className="space-y-1">
                      {data.topClientes.map((c: any, i: number) => (
                        <li key={c.nome} className="flex items-center gap-2 p-1.5 rounded hover:bg-accent/30">
                          <span className="text-[11px] text-muted-foreground w-5">{i + 1}.</span>
                          <span className="text-sm flex-1 truncate">{c.nome}</span>
                          <Badge variant="outline" className="text-[10px]">{c.processos} proc.</Badge>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
