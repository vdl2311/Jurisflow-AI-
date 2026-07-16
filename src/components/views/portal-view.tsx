'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Scale, FolderKanban, FileText, DollarSign, FileSignature, MessageCircle, Download, LogOut } from 'lucide-react'
import { formatCurrency, formatDate, relativeDate, statusColor } from '@/lib/format'
import { cn } from '@/lib/utils'

interface PortalData {
  cliente: { id: string; name: string; email: string; type: string }
  processes: any[]
  documents: any[]
  financials: any[]
  contracts: any[]
  resumo: {
    processosAtivos: number
    documentos: number
    aPagar: number
    contratos: number
  }
}

export function PortalView() {
  const [data, setData] = useState<PortalData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/portal?token=demo')
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-32 rounded-md bg-muted/40 animate-pulse" />
        ))}
      </div>
    )
  }

  if (!data) {
    return <div className="p-12 text-center text-sm text-muted-foreground">Erro ao carregar portal.</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-background">
      {/* Header do portal */}
      <header className="bg-card border-b border-border">
        <div className="max-w-5xl mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
              <Scale className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-sm">Portal do Cliente</p>
              <p className="text-[11px] text-muted-foreground">JusFlow • Área do cliente</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium">{data.cliente.name}</p>
              <p className="text-[11px] text-muted-foreground">{data.cliente.email}</p>
            </div>
            <Button variant="ghost" size="icon">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto p-5 md:p-6 space-y-5">
        {/* Boas-vindas */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-5">
            <h2 className="text-lg font-semibold">Olá, {data.cliente.name.split(' ')[0]}!</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Bem-vindo(a) à sua área do cliente. Aqui você acompanha seus processos, documentos, honorários e contratos.
            </p>
          </CardContent>
        </Card>

        {/* Resumo */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-4">
              <FolderKanban className="h-5 w-5 text-emerald-600 mb-1" />
              <p className="text-xl font-semibold">{data.resumo.processosAtivos}</p>
              <p className="text-[11px] text-muted-foreground">Processos ativos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <FileText className="h-5 w-5 text-blue-600 mb-1" />
              <p className="text-xl font-semibold">{data.resumo.documentos}</p>
              <p className="text-[11px] text-muted-foreground">Documentos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <DollarSign className="h-5 w-5 text-amber-600 mb-1" />
              <p className="text-xl font-semibold">{formatCurrency(data.resumo.aPagar)}</p>
              <p className="text-[11px] text-muted-foreground">A pagar</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <FileSignature className="h-5 w-5 text-purple-600 mb-1" />
              <p className="text-xl font-semibold">{data.resumo.contratos}</p>
              <p className="text-[11px] text-muted-foreground">Contratos</p>
            </CardContent>
          </Card>
        </div>

        {/* Processos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FolderKanban className="h-4 w-4" />
              Meus processos
            </CardTitle>
            <CardDescription>Acompanhe o andamento dos seus casos</CardDescription>
          </CardHeader>
          <CardContent>
            {data.processes.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Nenhum processo ativo.</p>
            ) : (
              <ul className="space-y-3">
                {data.processes.map((p) => (
                  <li key={p.id} className="rounded-md border border-border p-3">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-sm font-medium flex-1">{p.title}</p>
                      <span className={cn('text-[10px] px-1.5 py-0.5 rounded border font-medium', statusColor(p.status))}>
                        {p.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">{p.cnj} • {p.area}</p>
                    {p.ultimoAndamento && (
                      <div className="mt-2 p-2 rounded bg-muted/30 text-[11px]">
                        <p className="font-medium text-muted-foreground">Último andamento:</p>
                        <p>{p.ultimoAndamento.description}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{formatDate(p.ultimoAndamento.date)} • {relativeDate(p.ultimoAndamento.date)}</p>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Documentos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Documentos
            </CardTitle>
            <CardDescription>Baixe seus documentos</CardDescription>
          </CardHeader>
          <CardContent>
            {data.documents.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Nenhum documento disponível.</p>
            ) : (
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {data.documents.map((d) => (
                  <li key={d.id} className="flex items-center gap-3 rounded-md border border-border p-2.5">
                    <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{d.name}</p>
                      <p className="text-[10px] text-muted-foreground">{d.type} • {d.size}</p>
                    </div>
                    <Button size="sm" variant="ghost">
                      <Download className="h-3.5 w-3.5" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Financeiro */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Honorários e boletos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.financials.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Sem lançamentos.</p>
            ) : (
              <ul className="space-y-2">
                {data.financials.map((f) => (
                  <li key={f.id} className="flex items-center justify-between rounded-md border border-border p-3">
                    <div>
                      <p className="text-sm font-medium">{f.description}</p>
                      <p className="text-[11px] text-muted-foreground">Venc.: {formatDate(f.dueDate)} • {relativeDate(f.dueDate)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{formatCurrency(f.amount)}</p>
                      <span className={cn('text-[10px] px-1.5 py-0.5 rounded border font-medium', statusColor(f.status))}>
                        {f.status}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Contratos assinados */}
        {data.contracts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileSignature className="h-4 w-4" />
                Contratos assinados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {data.contracts.map((c) => (
                  <li key={c.id} className="flex items-center gap-3 rounded-md border border-border p-3">
                    <FileSignature className="h-5 w-5 text-emerald-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{c.title}</p>
                      <p className="text-[10px] text-muted-foreground">Assinado em {formatDate(c.signedAt)}</p>
                    </div>
                    <Button size="sm" variant="ghost">
                      <Download className="h-3.5 w-3.5" />
                    </Button>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Mensagem advogado */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Falar com seu advogado
            </CardTitle>
            <CardDescription>Envie uma mensagem direto para o escritório</CardDescription>
          </CardHeader>
          <CardContent>
            <textarea
              className="w-full rounded-md border border-border bg-background p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              rows={3}
              placeholder="Digite sua mensagem..."
            />
            <Button className="w-full mt-2">Enviar mensagem</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
