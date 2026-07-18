'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Cloud, Loader2, RefreshCw, AlertCircle, CheckCircle2, ExternalLink, Search, Download } from 'lucide-react'
import { formatDate, formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

interface MovimentoDataJud {
  codigo: number
  nome: string
  data: string
  descricao?: string
}

interface ResultadoDataJud {
  encontrado: boolean
  numeroProcesso: string
  tribunal: string
  tribunalNome: string
  classeNome?: string
  orgaoJulgador?: string
  dataAjuizamento?: string
  valorCausa?: number
  partes?: any[]
  movimentos?: MovimentoDataJud[]
  fonte: 'datajud' | 'demo'
  aviso?: string
  erroConexao?: boolean
}

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  cnj: string | null
  processId: string | null
  processTitle?: string
  onSynced?: () => void
}

export function DatajudModal({ open, onOpenChange, cnj, processId, processTitle, onSynced }: Props) {
  const [resultado, setResultado] = useState<ResultadoDataJud | null>(null)
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<any>(null)
  const { toast } = useToast()

  const consultar = async () => {
    if (!cnj) return
    setLoading(true)
    setResultado(null)
    setSyncResult(null)
    try {
      const res = await fetch('/api/datajud/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cnj, demo: false }),
      })
      const data = await res.json()
      setResultado(data)
    } catch {
      setResultado({
        encontrado: false,
        numeroProcesso: cnj,
        tribunal: '?',
        tribunalNome: 'Erro de conexão',
        fonte: 'demo',
        aviso: 'Erro de conexão com a API.',
      })
    } finally {
      setLoading(false)
    }
  }

  const sincronizar = async () => {
    if (!processId) return
    setSyncing(true)
    setSyncResult(null)
    try {
      const res = await fetch('/api/datajud/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ processId, demo: resultado?.fonte === 'demo' }),
      })
      const data = await res.json()
      setSyncResult(data)
      if (data.sincronizado) {
        toast({
          title: `${data.novosMovimentos} andamento(s) importado(s)`,
          description: `Tribunal: ${data.tribunal} • Fonte: ${data.fonte}`,
        })
        onSynced?.()
      } else {
        toast({
          title: 'Sincronização',
          description: data.mensagem || data.error,
        })
      }
    } catch {
      toast({ title: 'Erro', description: 'Falha ao sincronizar.', variant: 'destructive' })
    } finally {
      setSyncing(false)
    }
  }

  // Reset ao fechar
  const handleClose = (v: boolean) => {
    if (!v) {
      setResultado(null)
      setSyncResult(null)
    }
    onOpenChange(v)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-[95vw] max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Cloud className="h-5 w-5 text-primary" />
            Consultar DataJud (CNJ)
          </DialogTitle>
          <DialogDescription>
            {processTitle && <span className="block truncate">{processTitle}</span>}
            {cnj ? (
              <span className="font-mono text-[11px]">{cnj}</span>
            ) : (
              <span className="text-destructive">Processo sem CNJ cadastrado</span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {/* Aviso inicial sobre DataJud */}
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-3">
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                💡 O <strong>DataJud</strong> é a API pública do Conselho Nacional de Justiça (CNJ) que disponibiliza
                dados de processos de tribunais brasileiros. Permite consultar andamentos, partes e dados processuais
                de forma automatizada, sem precisar acessar cada site de tribunal.
              </p>
            </CardContent>
          </Card>

          {!cnj && (
            <div className="rounded-md border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-900/50 p-3 text-sm text-amber-700 dark:text-amber-300 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              Este processo ainda não tem número CNJ. Atualize o processo com o CNJ antes de consultar o DataJud.
            </div>
          )}

          {/* Botão consultar */}
          <div className="flex gap-2">
            <Button onClick={consultar} disabled={loading || !cnj} className="flex-1">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Consultar no DataJud
            </Button>
            <Button
              variant="outline"
              onClick={async () => {
                setLoading(true)
                setResultado(null)
                setSyncResult(null)
                try {
                  const res = await fetch('/api/datajud/search', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ cnj, demo: true }),
                  })
                  setResultado(await res.json())
                } finally { setLoading(false) }
              }}
              disabled={loading || !cnj}
            >
              Modo demo
            </Button>
          </div>

          {/* Aviso de erro de conexão */}
          {resultado?.aviso && (
            <div className={cn(
              'rounded-md border p-3 text-sm flex items-start gap-2',
              resultado.erroConexao
                ? 'border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-900/50 text-amber-700 dark:text-amber-300'
                : 'border-blue-300 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-900/50 text-blue-700 dark:text-blue-300'
            )}>
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span className="text-[12px]">{resultado.aviso}</span>
            </div>
          )}

          {/* Resultado */}
          {resultado && resultado.encontrado && (
            <div className="space-y-3">
              {/* Cabeçalho do resultado */}
              <Card>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      <p className="font-medium text-sm">Processo encontrado!</p>
                    </div>
                    <Badge variant="outline" className="text-[10px]">
                      Fonte: {resultado.fonte === 'datajud' ? 'DataJud (real)' : 'Demo'}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[12px]">
                    <div>
                      <span className="text-muted-foreground">Tribunal:</span>{' '}
                      <strong>{resultado.tribunalNome}</strong>
                    </div>
                    {resultado.classeNome && (
                      <div>
                        <span className="text-muted-foreground">Classe:</span>{' '}
                        <strong>{resultado.classeNome}</strong>
                      </div>
                    )}
                    {resultado.orgaoJulgador && (
                      <div>
                        <span className="text-muted-foreground">Órgão julgador:</span>{' '}
                        <strong>{resultado.orgaoJulgador}</strong>
                      </div>
                    )}
                    {resultado.dataAjuizamento && (
                      <div>
                        <span className="text-muted-foreground">Ajuizamento:</span>{' '}
                        <strong>{formatDate(resultado.dataAjuizamento)}</strong>
                      </div>
                    )}
                    {resultado.valorCausa && resultado.valorCausa > 0 && (
                      <div>
                        <span className="text-muted-foreground">Valor da causa:</span>{' '}
                        <strong>{formatCurrency(resultado.valorCausa)}</strong>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Movimentos */}
              {resultado.movimentos && resultado.movimentos.length > 0 && (
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm font-medium mb-2 flex items-center gap-2">
                      <RefreshCw className="h-4 w-4 text-primary" />
                      Andamentos encontrados ({resultado.movimentos.length})
                    </p>
                    <div className="max-h-64 overflow-y-auto space-y-1.5">
                      {resultado.movimentos.map((m, i) => (
                        <div key={i} className="flex items-start gap-2 p-2 rounded hover:bg-accent/30">
                          <span className="text-[10px] text-muted-foreground font-mono shrink-0 mt-0.5">
                            {formatDate(m.data)}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-[12px] font-medium">{m.nome}</p>
                            {m.descricao && (
                              <p className="text-[10px] text-muted-foreground">{m.descricao}</p>
                            )}
                          </div>
                          {m.codigo && (
                            <Badge variant="outline" className="text-[9px] font-mono shrink-0">
                              #{m.codigo}
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Botão sincronizar */}
              {processId && (
                <div className="space-y-2">
                  <Button
                    onClick={sincronizar}
                    disabled={syncing}
                    className="w-full"
                  >
                    {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                    Importar andamentos para o processo
                  </Button>
                  <p className="text-[10px] text-muted-foreground text-center">
                    Apenas os andamentos que ainda não existem no processo serão importados.
                  </p>
                </div>
              )}

              {/* Resultado da sincronização */}
              {syncResult && (
                <Card className={syncResult.sincronizado ? 'border-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/20' : 'border-amber-300'}>
                  <CardContent className="p-3">
                    {syncResult.sincronizado ? (
                      <>
                        <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                          <CheckCircle2 className="h-4 w-4" />
                          {syncResult.novosMovimentos} andamento(s) importado(s) com sucesso!
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-1">
                          Tribunal: {syncResult.tribunal} • Fonte: {syncResult.fonte}
                          {syncResult.dadosAtualizados?.length > 0 && (
                            <> • Dados atualizados: {syncResult.dadosAtualizados.join(', ')}</>
                          )}
                        </p>
                        {syncResult.movimentosImportados?.length > 0 && (
                          <ul className="mt-2 space-y-0.5">
                            {syncResult.movimentosImportados.map((m: any, i: number) => (
                              <li key={i} className="text-[11px] text-muted-foreground">
                                • {formatDate(m.data)} - {m.descricao}
                              </li>
                            ))}
                          </ul>
                        )}
                      </>
                    ) : (
                      <p className="text-sm">{syncResult.mensagem || syncResult.error}</p>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {resultado && !resultado.encontrado && !resultado.aviso && (
            <Card>
              <CardContent className="p-6 text-center">
                <AlertCircle className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Processo não encontrado no DataJud ({resultado.tribunalNome}).
                  <br />
                  Pode ainda não estar disponível na API pública.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)}>Fechar</Button>
          <Button variant="ghost" asChild>
            <a href="https://datajud-wp.cnj.jus.br/" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
              Sobre o DataJud
            </a>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
