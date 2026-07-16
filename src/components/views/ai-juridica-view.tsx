'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { FileText, Sparkles, Gavel, BookOpen, Loader2, Copy, Download, AlertCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

const TIPOS_PETICAO = [
  { id: 'inicial', label: 'Petição Inicial' },
  { id: 'contestacao', label: 'Contestação' },
  { id: 'replica', label: 'Réplica' },
  { id: 'alegacoes_finais', label: 'Alegações Finais' },
  { id: 'recursal', label: 'Recurso de Apelação' },
]

export function AiJuridicaView() {
  const [tab, setTab] = useState('peticao')

  return (
    <div className="p-5 md:p-6">
      <Card className="mb-4 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/15 text-primary flex items-center justify-center shrink-0">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-semibold text-base">IA Jurídica</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Gere petições, revise textos jurídicos e obtenha sugestões de jurisprudência com IA. Use sempre em conjunto com sua expertise.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="peticao">
            <FileText className="h-3.5 w-3.5 mr-1.5" />
            Geração de Petições
          </TabsTrigger>
          <TabsTrigger value="revisao">
            <Gavel className="h-3.5 w-3.5 mr-1.5" />
            Revisão Jurídica
          </TabsTrigger>
          <TabsTrigger value="jurisprudencia">
            <BookOpen className="h-3.5 w-3.5 mr-1.5" />
            Jurisprudência
          </TabsTrigger>
        </TabsList>

        <TabsContent value="peticao" className="mt-4">
          <PeticaoGenerator />
        </TabsContent>
        <TabsContent value="revisao" className="mt-4">
          <RevisaoTextos />
        </TabsContent>
        <TabsContent value="jurisprudencia" className="mt-4">
          <JurisprudenciaSugestao />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function PeticaoGenerator() {
  const [tipo, setTipo] = useState('inicial')
  const [processoId, setProcessoId] = useState('')
  const [descricao, setDescricao] = useState('')
  const [fatos, setFatos] = useState('')
  const [pedidos, setPedidos] = useState('')
  const [processes, setProcesses] = useState<{ id: string; title: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [resultado, setResultado] = useState('')
  const { toast } = useToast()

  useEffect(() => {
    fetch('/api/processes').then((r) => r.json()).then(setProcesses)
  }, [])

  const gerar = async () => {
    setLoading(true)
    setResultado('')
    try {
      const res = await fetch('/api/ai-peticao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo, processoId, descricao, fatos, pedidos }),
      })
      const data = await res.json()
      setResultado(data.conteudo || data.error || 'Erro ao gerar.')
      toast({ title: 'Petição gerada', description: `${TIPOS_PETICAO.find((t) => t.id === tipo)?.label} pronta para revisão.` })
    } catch {
      setResultado('Erro de conexão.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Configurar petição</CardTitle>
          <CardDescription>Quanto mais detalhes, melhor o resultado</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label>Tipo de petição</Label>
            <Select value={tipo} onValueChange={setTipo}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TIPOS_PETICAO.map((t) => <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Processo relacionado (opcional)</Label>
            <Select value={processoId} onValueChange={setProcessoId}>
              <SelectTrigger><SelectValue placeholder="Selecione para usar dados do processo" /></SelectTrigger>
              <SelectContent>
                {processes.map((p) => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Descrição do caso</Label>
            <Textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={2} placeholder="Ex.: Ação de cobrança de honorários..." />
          </div>
          <div className="space-y-1.5">
            <Label>Fatos</Label>
            <Textarea value={fatos} onChange={(e) => setFatos(e.target.value)} rows={4} placeholder="Descreva os fatos relevantes..." />
          </div>
          <div className="space-y-1.5">
            <Label>Pedidos</Label>
            <Textarea value={pedidos} onChange={(e) => setPedidos(e.target.value)} rows={3} placeholder="Liste os pedidos..." />
          </div>
          <Button onClick={gerar} disabled={loading} className="w-full">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Gerar petição
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base">Petição gerada</CardTitle>
            <CardDescription>Revise antes de usar</CardDescription>
          </div>
          {resultado && (
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" onClick={() => {
                navigator.clipboard.writeText(resultado)
                toast({ title: 'Copiado!' })
              }}>
                <Copy className="h-3.5 w-3.5" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => window.print()}>
                <Download className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-12 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-primary" />
              <p className="text-sm text-muted-foreground">Gerando petição com IA...</p>
            </div>
          ) : resultado ? (
            <div className="rounded-md border border-border p-3 bg-muted/30 max-h-[500px] overflow-y-auto">
              <pre className="text-[11px] whitespace-pre-wrap font-mono leading-relaxed">{resultado}</pre>
            </div>
          ) : (
            <div className="py-12 text-center">
              <FileText className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Preencha os campos e clique em &quot;Gerar petição&quot;.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function RevisaoTextos() {
  const [texto, setTexto] = useState('')
  const [loading, setLoading] = useState(false)
  const [resultado, setResultado] = useState('')
  const { toast } = useToast()

  const revisar = async () => {
    if (!texto.trim()) return
    setLoading(true)
    setResultado('')
    try {
      const res = await fetch('/api/ai-revisao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texto }),
      })
      const data = await res.json()
      setResultado(data.revisao || data.error || 'Erro.')
      toast({ title: 'Revisão concluída' })
    } catch {
      setResultado('Erro de conexão.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Texto para revisão</CardTitle>
          <CardDescription>Cole aqui sua peça jurídica</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            rows={16}
            placeholder="Cole aqui o texto que deseja revisar..."
            className="text-sm font-mono"
          />
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">{texto.length} caracteres</span>
            <Button onClick={revisar} disabled={loading || !texto.trim()}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Gavel className="h-4 w-4" />}
              Revisar
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Revisão da IA</CardTitle>
          <CardDescription>Correções, sugestões e score</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-12 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-primary" />
              <p className="text-sm text-muted-foreground">Analisando texto...</p>
            </div>
          ) : resultado ? (
            <div className="rounded-md border border-border p-3 bg-muted/30 max-h-[500px] overflow-y-auto">
              <pre className="text-[11px] whitespace-pre-wrap font-mono leading-relaxed">{resultado}</pre>
            </div>
          ) : (
            <div className="py-12 text-center">
              <Gavel className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Cole o texto e clique em &quot;Revisar&quot;.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function JurisprudenciaSugestao() {
  const [tema, setTema] = useState('')
  const [area, setArea] = useState('Geral')
  const [loading, setLoading] = useState(false)
  const [resultado, setResultado] = useState('')
  const { toast } = useToast()

  const buscar = async () => {
    if (!tema.trim()) return
    setLoading(true)
    setResultado('')
    try {
      const res = await fetch('/api/ai-jurisprudencia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tema, area }),
      })
      const data = await res.json()
      setResultado(data.jurisprudencia || data.error || 'Erro.')
      toast({ title: 'Análise jurisprudencial gerada' })
    } catch {
      setResultado('Erro de conexão.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sugestão de jurisprudência</CardTitle>
          <CardDescription>A IA sugere teses e posicionamentos. Sempre valide em fontes oficiais (STJ, STF, TST).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2 space-y-1.5">
              <Label>Tema / Questão jurídica</Label>
              <Input
                value={tema}
                onChange={(e) => setTema(e.target.value)}
                placeholder="Ex.: Dano moral por inscrição indevida no SPC"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Área</Label>
              <Select value={area} onValueChange={setArea}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['Geral', 'Cível', 'Trabalhista', 'Tributário', 'Penal', 'Consumidor', 'Família', 'Empresarial'].map((a) => (
                    <SelectItem key={a} value={a}>{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={buscar} disabled={loading || !tema.trim()}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <BookOpen className="h-4 w-4" />}
            Buscar jurisprudência
          </Button>
        </CardContent>
      </Card>

      {loading && (
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-primary" />
            <p className="text-sm text-muted-foreground">Analisando tema e gerando sugestões...</p>
          </CardContent>
        </Card>
      )}

      {resultado && (
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Resultado</CardTitle>
            <Button size="sm" variant="ghost" onClick={() => {
              navigator.clipboard.writeText(resultado)
              toast({ title: 'Copiado!' })
            }}>
              <Copy className="h-3.5 w-3.5" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-900/50 p-2.5 mb-3">
              <p className="text-[11px] text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5" />
                Sempre valide as teses em fontes oficiais (STJ, JusBrasil, TST) antes de usar em petições.
              </p>
            </div>
            <div className="rounded-md border border-border p-3 bg-muted/30">
              <pre className="text-[11px] whitespace-pre-wrap font-mono leading-relaxed">{resultado}</pre>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
