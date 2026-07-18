'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  ShieldCheck, ShieldAlert, Loader2, CheckCircle2, XCircle, Plus,
  Scale, FileText, User, Building2, AlertTriangle, Clock,
} from 'lucide-react'
import { formatDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

interface Rule {
  id: string
  name: string
  category: string
  description: string
  rule: string
  severity: string
  actionType: string
  enabled: boolean
  checksCount: number
}

const severityColor: Record<string, string> = {
  'Crítica': 'bg-red-100 text-red-700 border-red-300 dark:bg-red-950/40 dark:text-red-300',
  'Alta': 'bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-950/40 dark:text-orange-300',
  'Média': 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300',
  'Baixa': 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300',
}

const categoryIcon: Record<string, any> = {
  'LGPD': ShieldCheck,
  'OAB': Scale,
  'Conflito de Interesse': ShieldAlert,
  'Confidencialidade': FileText,
  'Honorários': User,
  'Prazos': Clock,
  'Segurança': ShieldCheck,
}

export function ComplianceView() {
  const [rules, setRules] = useState<Rule[]>([])
  const [recentChecks, setRecentChecks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [checkOpen, setCheckOpen] = useState(false)
  const [checking, setChecking] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [entityType, setEntityType] = useState('Process')
  const [entityName, setEntityName] = useState('')
  const [content, setContent] = useState('')
  const { toast } = useToast()

  const load = () => {
    setLoading(true)
    fetch('/api/compliance')
      .then((r) => r.json())
      .then((d) => {
        setRules(d.rules || [])
        setRecentChecks(d.recentChecks || [])
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const runCheck = async () => {
    if (!content.trim()) return
    setChecking(true)
    setResult(null)
    try {
      const res = await fetch('/api/compliance', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entityType, entityName, content }),
      })
      const data = await res.json()
      setResult(data)
      toast({
        title: `Verificação concluída: ${data.passed}/${data.totalRules} aprovadas`,
        description: data.failed > 0 ? `${data.failed} violações encontradas` : 'Conforme!',
        variant: data.failed > 0 ? 'destructive' : 'default',
      })
      load()
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' })
    } finally {
      setChecking(false)
    }
  }

  // Agrupar regras por categoria
  const rulesByCategory: Record<string, Rule[]> = {}
  for (const r of rules) {
    if (!rulesByCategory[r.category]) rulesByCategory[r.category] = []
    rulesByCategory[r.category].push(r)
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Hero */}
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <div className="h-12 w-12 rounded-lg bg-primary/15 text-primary flex items-center justify-center shrink-0">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h2 className="font-semibold text-base">Conformidade e Compliance</h2>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                Inspirado em <strong>Legal Engineering</strong> da Norm.ai: regras jurídicas codificadas em sistemas
                que verificam conformidade automaticamente. A IA verifica processos, contratos e documentos contra
                LGPD, Código de Ética da OAB, conflitos de interesse e padrões do escritório.
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                <Badge variant="outline" className="text-[10px]">{rules.length} regras ativas</Badge>
                <Badge variant="outline" className="text-[10px] gap-0.5 text-red-700 border-red-300">
                  <AlertTriangle className="h-2.5 w-2.5" /> {rules.filter((r) => r.severity === 'Crítica').length} críticas
                </Badge>
                <Badge variant="outline" className="text-[10px]">{recentChecks.length} verificações recentes</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Botão verificar */}
      <Card>
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Verificar conformidade</p>
            <p className="text-[11px] text-muted-foreground">Analise conteúdo contra todas as regras ativas</p>
          </div>
          <Button onClick={() => setCheckOpen(true)}>
            <ShieldCheck className="h-4 w-4 mr-1.5" />
            Nova verificação
          </Button>
        </CardContent>
      </Card>

      {/* Regras por categoria */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 rounded-md bg-muted/40 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(rulesByCategory).map(([cat, catRules]) => {
            const Icon = categoryIcon[cat] || ShieldCheck
            return (
              <Card key={cat}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Icon className="h-4 w-4 text-primary" />
                    {cat}
                    <Badge variant="outline" className="text-[10px]">{catRules.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {catRules.map((r) => (
                    <div key={r.id} className="rounded-md border border-border p-3">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="text-sm font-medium flex-1">{r.name}</p>
                        <div className="flex items-center gap-1 shrink-0">
                          <span className={cn('text-[10px] px-1.5 py-0.5 rounded border font-medium', severityColor[r.severity])}>
                            {r.severity}
                          </span>
                          <Badge variant="outline" className="text-[9px]">{r.actionType}</Badge>
                        </div>
                      </div>
                      <p className="text-[11px] text-muted-foreground">{r.description}</p>
                      <p className="text-[11px] text-muted-foreground mt-1 italic">
                        Critério: {r.rule.substring(0, 200)}{r.rule.length > 200 ? '...' : ''}
                      </p>
                      <div className="text-[10px] text-muted-foreground mt-1">
                        {r.checksCount} verificações realizadas
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Verificações recentes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Verificações recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentChecks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Nenhuma verificação realizada ainda.</p>
          ) : (
            <ul className="space-y-2 max-h-80 overflow-y-auto">
              {recentChecks.map((c) => (
                <li key={c.id} className="flex items-start gap-2 p-2 rounded border border-border">
                  {c.passed ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium">{c.rule?.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {c.entityType} {c.entityName ? `• ${c.entityName}` : ''} • {formatDateTime(c.checkedAt)}
                    </p>
                  </div>
                  <Badge variant="outline" className={cn('text-[9px]', c.passed ? 'text-emerald-700' : 'text-red-700')}>
                    {c.passed ? 'OK' : 'Falha'}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Modal de verificação */}
      <Dialog open={checkOpen} onOpenChange={(v) => { setCheckOpen(v); if (!v) setResult(null) }}>
        <DialogContent className="w-[95vw] max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Verificação de Conformidade
            </DialogTitle>
            <DialogDescription>
              O conteúdo será verificado contra todas as {rules.length} regras ativas. A IA analisa cada regra individualmente.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Tipo de entidade</Label>
                <Select value={entityType} onValueChange={setEntityType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Process">Processo</SelectItem>
                    <SelectItem value="Contract">Contrato</SelectItem>
                    <SelectItem value="Document">Documento</SelectItem>
                    <SelectItem value="Client">Cliente</SelectItem>
                    <SelectItem value="Communication">Comunicação</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Nome (opcional)</Label>
                <Input value={entityName} onChange={(e) => setEntityName(e.target.value)} placeholder="Ex.: Contrato Tech Solutions" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Conteúdo a verificar</Label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={6}
                placeholder="Cole aqui o conteúdo do contrato, documento, comunicação..."
                disabled={checking}
              />
            </div>

            <Button onClick={runCheck} disabled={checking || !content.trim()} className="w-full">
              {checking ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Verificando contra {rules.length} regras...</>
              ) : (
                <><ShieldCheck className="h-4 w-4" /> Verificar conformidade</>
              )}
            </Button>
          </div>

          {/* Resultado */}
          {result && (
            <div className="space-y-3 pt-2 border-t border-border">
              <div className={cn(
                'rounded-md border p-3 flex items-center gap-2',
                result.failed === 0
                  ? 'border-emerald-300 bg-emerald-50 dark:bg-emerald-950/20'
                  : 'border-amber-300 bg-amber-50 dark:bg-amber-950/20'
              )}>
                {result.failed === 0 ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <AlertTriangle className="h-5 w-5 text-amber-600" />}
                <div>
                  <p className="text-sm font-medium">
                    {result.failed === 0 ? 'Conforme!' : `${result.failed} violação(ões) encontrada(s)`}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {result.passed}/{result.totalRules} regras aprovadas
                  </p>
                </div>
              </div>

              {result.resultados.filter((r: any) => !r.passed).length > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs">Violações encontradas</Label>
                  {result.resultados.filter((r: any) => !r.passed).map((r: any, i: number) => (
                    <div key={i} className="rounded-md border border-red-300 bg-red-50 dark:bg-red-950/20 p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <XCircle className="h-4 w-4 text-red-600" />
                        <p className="text-sm font-medium">{r.rule}</p>
                        <span className={cn('text-[9px] px-1.5 py-0.5 rounded border font-medium', severityColor[r.severity])}>
                          {r.severity}
                        </span>
                      </div>
                      <ul className="space-y-0.5 ml-6">
                        {r.violations.map((v: string, j: number) => (
                          <li key={j} className="text-[11px] text-red-700 dark:text-red-300">• {v}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}

              {result.resultados.filter((r: any) => r.passed).length > 0 && (
                <div className="space-y-1.5">
                  <Label className="text-xs">Regras aprovadas</Label>
                  <div className="flex flex-wrap gap-1">
                    {result.resultados.filter((r: any) => r.passed).map((r: any, i: number) => (
                      <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 flex items-center gap-0.5">
                        <CheckCircle2 className="h-2.5 w-2.5" /> {r.rule}
                      </span>
                    ))}
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
