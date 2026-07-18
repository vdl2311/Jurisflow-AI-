'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Cloud, Search, Loader2, AlertCircle, CheckCircle2, ExternalLink, Database } from 'lucide-react'
import { formatDate, formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'
import { maskCNJ, onlyDigits } from '@/lib/masks'

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
  movimentos?: any[]
  fonte: string
  aviso?: string
  erroConexao?: boolean
}

export function DatajudView() {
  const [cnj, setCnj] = useState('')
  const [loading, setLoading] = useState(false)
  const [resultado, setResultado] = useState<ResultadoDataJud | null>(null)
  const [tribunais, setTribunais] = useState<any[]>([])

  // Carregar lista de tribunais suportados
  useEffect(() => {
    fetch('/api/datajud/search')
      .then((r) => r.json())
      .then(setTribunais)
      .catch(() => {})
  }, [])

  const consultar = async (demo: boolean = false) => {
    if (!cnj.trim()) return
    setLoading(true)
    setResultado(null)
    try {
      const res = await fetch('/api/datajud/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cnj, demo }),
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
        aviso: 'Erro de conexão com a API DataJud.',
      })
    } finally {
      setLoading(false)
    }
  }

  // Formatar CNJ usando máscara do utilitário
  const formatarCNJ = (v: string) => maskCNJ(v)

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Hero explicativo */}
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <div className="h-12 w-12 rounded-lg bg-primary/15 text-primary flex items-center justify-center shrink-0">
              <Database className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h2 className="font-semibold text-base flex items-center gap-2">
                DataJud — API Pública do CNJ
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                Consulte processos de <strong>todos os tribunais brasileiros</strong> em um único lugar.
                A API pública do Conselho Nacional de Justiça disponibiliza andamentos, partes e dados processuais
                de forma automatizada, sem precisar acessar cada site de tribunal individualmente.
              </p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                <Badge variant="outline" className="text-[10px] gap-0.5">
                  <CheckCircle2 className="h-2.5 w-2.5" /> {tribunais.length || '35+'} tribunais
                </Badge>
                <Badge variant="outline" className="text-[10px]">Justiça Estadual</Badge>
                <Badge variant="outline" className="text-[10px]">Trabalhista</Badge>
                <Badge variant="outline" className="text-[10px]">Federal</Badge>
                <Badge variant="outline" className="text-[10px]">Eleitoral</Badge>
                <Badge variant="outline" className="text-[10px]">Superiores (STJ/STF/TST)</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Busca */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Consultar processo</CardTitle>
          <CardDescription>
            Informe o número CNJ (formato: NNNNNNN-DD.AAAA.J.TR.OOOO)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="cnj">Número CNJ</Label>
            <div className="flex gap-2">
              <Input
                id="cnj"
                value={cnj}
                onChange={(e) => setCnj(formatarCNJ(e.target.value))}
                placeholder="0012345-67.2023.5.02.0001"
                className="font-mono"
                onKeyDown={(e) => e.key === 'Enter' && consultar(false)}
              />
              <Button onClick={() => consultar(false)} disabled={loading || cnj.replace(/\D/g, '').length < 20}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                Consultar
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              💡 O tribunal é identificado automaticamente a partir do CNJ.
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => consultar(true)} disabled={loading || cnj.replace(/\D/g, '').length < 20}>
              <Cloud className="h-3.5 w-3.5" />
              Modo demonstração
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <a href="https://datajud-wp.cnj.jus.br/" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3.5 w-3.5 mr-1" />
                Documentação oficial
              </a>
            </Button>
          </div>

          {/* Exemplos rápidos */}
          <div className="flex flex-wrap gap-1.5 pt-2 border-t border-border">
            <span className="text-[11px] text-muted-foreground self-center">Exemplos:</span>
            {[
              { cnj: '0012345-67.2023.5.02.0001', label: 'TRT-2' },
              { cnj: '0023456-78.2024.8.26.0100', label: 'TJSP' },
              { cnj: '0034567-89.2024.4.03.0000', label: 'TRF-3' },
            ].map((ex) => (
              <button
                key={ex.cnj}
                onClick={() => setCnj(ex.cnj)}
                className="text-[11px] px-2 py-0.5 rounded bg-muted hover:bg-accent border border-border"
              >
                {ex.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Aviso de conexão */}
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
          <Card className="border-emerald-300">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                <p className="font-medium text-sm">Processo encontrado!</p>
                <Badge variant="outline" className="text-[10px] ml-auto">
                  Fonte: {resultado.fonte === 'datajud' ? 'DataJud (real)' : 'Demo'}
                </Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[12px]">
                <Field label="Tribunal" value={resultado.tribunalNome} />
                <Field label="Sigla" value={resultado.tribunal} />
                {resultado.classeNome && <Field label="Classe" value={resultado.classeNome} />}
                {resultado.orgaoJulgador && <Field label="Órgão julgador" value={resultado.orgaoJulgador} />}
                {resultado.dataAjuizamento && <Field label="Data ajuizamento" value={formatDate(resultado.dataAjuizamento)} />}
                {resultado.valorCausa !== undefined && resultado.valorCausa > 0 && (
                  <Field label="Valor da causa" value={formatCurrency(resultado.valorCausa)} />
                )}
                <Field label="Número CNJ" value={resultado.numeroProcesso} mono />
              </div>
            </CardContent>
          </Card>

          {/* Partes */}
          {resultado.partes && resultado.partes.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Partes envolvidas ({resultado.partes.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1">
                  {resultado.partes.map((p, i) => (
                    <li key={i} className="text-[12px] flex items-center gap-2">
                      <Badge variant="outline" className="text-[9px]">{p.polo || '-'}</Badge>
                      <span>{p.nome}</span>
                      {p.tipo && <span className="text-muted-foreground text-[11px]">({p.tipo})</span>}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Movimentos */}
          {resultado.movimentos && resultado.movimentos.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Andamentos ({resultado.movimentos.length})</CardTitle>
                <CardDescription>Histórico processual disponível no tribunal</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="max-h-96 overflow-y-auto space-y-1.5">
                  {resultado.movimentos.map((m, i) => (
                    <div key={i} className="flex items-start gap-2 p-2 rounded hover:bg-accent/30 border border-border/50">
                      <span className="text-[10px] text-muted-foreground font-mono shrink-0 mt-0.5 w-20">
                        {formatDate(m.data)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-medium">{m.nome}</p>
                        {m.descricao && (
                          <p className="text-[10px] text-muted-foreground mt-0.5">{m.descricao}</p>
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
        </div>
      )}

      {resultado && !resultado.encontrado && !resultado.aviso && (
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-10 w-10 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              Processo não encontrado no DataJud ({resultado.tribunalNome}).
              <br />
              Pode ainda não estar disponível na API pública.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Tribunais suportados */}
      {tribunais.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Tribunais suportados ({tribunais.length})</CardTitle>
            <CardDescription>Endpoints disponíveis na API pública DataJud</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {tribunais.map((t) => (
                <div key={t.sigla} className="rounded border border-border p-2">
                  <div className="flex items-center gap-1.5">
                    <Badge variant="outline" className="text-[10px]">{t.sigla}</Badge>
                    <Badge variant="outline" className="text-[10px]">{t.tipo}</Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1 line-clamp-1">{t.nome}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className={cn('font-medium', mono && 'font-mono text-[11px]')}>{value}</p>
    </div>
  )
}
