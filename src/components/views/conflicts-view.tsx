'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertTriangle, Search, ShieldAlert, ShieldCheck, Clock, History } from 'lucide-react'
import { formatDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

interface Match {
  tipo: string
  descricao: string
}

interface ConflictResult {
  found: boolean
  totalMatches: number
  matches: Match[]
  checkedAt: string
}

interface HistoryItem {
  id: string
  clientName: string
  searchText: string
  found: boolean
  matches: Match[]
  checkedAt: string
}

export function ConflictsView() {
  const [clientName, setClientName] = useState('')
  const [searchText, setSearchText] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ConflictResult | null>(null)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const { toast } = useToast()

  const loadHistory = () => {
    fetch('/api/conflicts')
      .then((r) => r.json())
      .then(setHistory)
  }

  useEffect(() => { loadHistory() }, [])

  const check = async () => {
    if (!searchText.trim()) return
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/conflicts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientName, searchText }),
      })
      const data = await res.json()
      setResult(data)
      if (data.found) {
        toast({
          title: '⚠️ Possível conflito detectado',
          description: `${data.totalMatches} correspondência(s) encontrada(s).`,
          variant: 'destructive',
        })
      } else {
        toast({ title: '✓ Sem conflitos', description: 'Nenhuma correspondência encontrada.' })
      }
      loadHistory()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-5 md:p-6 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-primary" />
            Verificação de conflito de interesse
          </CardTitle>
          <CardDescription>
            Verifique se um novo cliente ou parte tem relação com processos existentes antes de aceitar o caso.
            Conformidade essencial do Código de Ética da OAB.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="cn">Nome do cliente (opcional)</Label>
              <Input id="cn" value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Ex.: João Santos" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cs">Busca (nome, CPF/CNPJ, parte contrária)</Label>
              <Input
                id="cs"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && check()}
                placeholder="Ex.: Construtora Horizonte"
              />
            </div>
          </div>
          <Button onClick={check} disabled={loading || !searchText.trim()}>
            <Search className="h-4 w-4 mr-1.5" />
            Verificar conflito
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card className={cn(
          result.found ? 'border-red-300 bg-red-50/50 dark:bg-red-950/20 dark:border-red-900/50' : 'border-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/20 dark:border-emerald-900/50'
        )}>
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <div className={cn(
                'h-12 w-12 rounded-full flex items-center justify-center shrink-0',
                result.found ? 'bg-red-100 dark:bg-red-900/40 text-red-600' : 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600'
              )}>
                {result.found ? <AlertTriangle className="h-6 w-6" /> : <ShieldCheck className="h-6 w-6" />}
              </div>
              <div className="flex-1">
                <h3 className={cn('font-semibold', result.found ? 'text-red-900 dark:text-red-200' : 'text-emerald-900 dark:text-emerald-200')}>
                  {result.found ? `Conflito detectado: ${result.totalMatches} correspondência(s)` : 'Nenhum conflito encontrado'}
                </h3>
                <p className={cn('text-sm mt-0.5', result.found ? 'text-red-700 dark:text-red-300' : 'text-emerald-700 dark:text-emerald-300')}>
                  {result.found
                    ? 'Recomenda-se não aceitar o caso ou analisar detalhadamente antes de prosseguir.'
                    : 'Pode prosseguir com o cadastro do cliente com segurança.'}
                </p>

                {result.found && (
                  <ul className="mt-3 space-y-2">
                    {result.matches.map((m, i) => (
                      <li key={i} className="rounded-md border border-red-200 dark:border-red-900/50 bg-card p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 font-medium">
                            {m.tipo}
                          </span>
                        </div>
                        <p className="text-sm">{m.descricao}</p>
                      </li>
                    ))}
                  </ul>
                )}

                <p className="text-[10px] text-muted-foreground mt-3 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Verificado em {formatDateTime(result.checkedAt)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Histórico */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <History className="h-4 w-4" />
            Histórico de verificações
          </CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Nenhuma verificação realizada.</p>
          ) : (
            <ul className="space-y-2">
              {history.map((h) => (
                <li key={h.id} className="flex items-center gap-3 p-2.5 rounded border border-border">
                  {h.found ? (
                    <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
                  ) : (
                    <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {h.clientName || 'Cliente não informado'} • &quot;{h.searchText}&quot;
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {formatDateTime(h.checkedAt)} • {h.matches.length} correspondência(s)
                    </p>
                  </div>
                  <span className={cn(
                    'text-[10px] px-1.5 py-0.5 rounded font-medium',
                    h.found ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                  )}>
                    {h.found ? 'Conflito' : 'OK'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
