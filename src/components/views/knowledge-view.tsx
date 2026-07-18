'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import {
  BookOpen, Search, Plus, Loader2, FileText, Sparkles, CheckCircle2,
  Clock, User, Tag, ExternalLink, BookMarked,
} from 'lucide-react'
import { formatDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

interface Article {
  id: string
  title: string
  content: string
  summary: string | null
  category: string
  area: string | null
  tags: string | null
  source: string | null
  sourceUrl: string | null
  author: string | null
  confidence: number
  verified: boolean
  createdAt: string
  updatedAt: string
}

const CATEGORIES = ['Todas', 'Jurisprudência', 'Doutrina', 'Tese', 'Caso Prático', 'Modelo']
const AREAS = ['Todas', 'Trabalhista', 'Cível', 'Tributário', 'Penal', 'Consumidor', 'Família', 'Empresarial']

const categoryColor: Record<string, string> = {
  'Jurisprudência': 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300',
  'Doutrina': 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
  'Tese': 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  'Caso Prático': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
  'Modelo': 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300',
}

export function KnowledgeView() {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('Todas')
  const [area, setArea] = useState('Todas')
  const [selected, setSelected] = useState<Article | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [newModal, setNewModal] = useState(false)
  const [summarizing, setSummarizing] = useState(false)
  const { toast } = useToast()

  const load = () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (category !== 'Todas') params.set('category', category)
    if (area !== 'Todas') params.set('area', area)
    fetch(`/api/knowledge?${params}`)
      .then((r) => r.json())
      .then(setArticles)
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [search, category, area])

  const summarize = async (id: string) => {
    setSummarizing(true)
    try {
      const res = await fetch('/api/knowledge', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleId: id }),
      })
      const data = await res.json()
      if (data.summary) {
        setSelected(data)
        toast({ title: 'Resumo gerado com IA' })
        load()
      }
    } finally {
      setSummarizing(false)
    }
  }

  const handleCreate = async (data: Record<string, unknown>) => {
    const res = await fetch('/api/knowledge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (res.ok) {
      toast({ title: 'Artigo criado' })
      setNewModal(false)
      load()
    }
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Hero */}
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <div className="h-12 w-12 rounded-lg bg-primary/15 text-primary flex items-center justify-center shrink-0">
              <BookMarked className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h2 className="font-semibold text-base">Base de Conhecimento Jurídico</h2>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                Inspirado em <strong>Knowledge Accumulation</strong> da Norm.ai: cada caso aprende com casos anteriores.
                Teses, jurisprudência, doutrina e modelos acumulados pelo escritório. A IA gera resumos automáticos
                e utiliza este conhecimento ao gerar petições e análises.
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                <Badge variant="outline" className="text-[10px]">{articles.length} artigos</Badge>
                <Badge variant="outline" className="text-[10px] gap-0.5">
                  <CheckCircle2 className="h-2.5 w-2.5" /> {articles.filter((a) => a.verified).length} verificados
                </Badge>
                <Badge variant="outline" className="text-[10px]">
                  Confiança média: {articles.length > 0 ? Math.round(articles.reduce((s, a) => s + a.confidence, 0) / articles.length) : 0}%
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-3 md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por título, conteúdo, tags..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-full md:w-44"><SelectValue placeholder="Categoria" /></SelectTrigger>
          <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={area} onValueChange={setArea}>
          <SelectTrigger className="w-full md:w-40"><SelectValue placeholder="Área" /></SelectTrigger>
          <SelectContent>{AREAS.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
        </Select>
        <Button onClick={() => setNewModal(true)} className="shrink-0">
          <Plus className="h-4 w-4 mr-1.5" /> Novo artigo
        </Button>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 rounded-md bg-muted/40 animate-pulse" />
          ))}
        </div>
      ) : articles.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <BookOpen className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Nenhum artigo encontrado.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {articles.map((a) => (
            <Card
              key={a.id}
              className="cursor-pointer hover:shadow-md hover:border-primary/30 transition-all"
              onClick={() => { setSelected(a); setModalOpen(true) }}
            >
              <CardContent className="p-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="h-9 w-9 rounded-md bg-muted flex items-center justify-center shrink-0">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm leading-tight">{a.title}</p>
                      {a.summary && (
                        <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{a.summary}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                        <span className={cn('text-[9px] px-1.5 py-0.5 rounded font-medium', categoryColor[a.category] || 'bg-muted')}>
                          {a.category}
                        </span>
                        {a.area && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{a.area}</span>
                        )}
                        {a.source && (
                          <span className="text-[9px] text-muted-foreground">• {a.source}</span>
                        )}
                        {a.verified && (
                          <span className="text-[9px] text-emerald-600 flex items-center gap-0.5">
                            <CheckCircle2 className="h-2.5 w-2.5" /> Verificado
                          </span>
                        )}
                        <span className="text-[9px] text-muted-foreground">• {a.confidence}% confiança</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-[10px] text-muted-foreground shrink-0">
                    {new Date(a.updatedAt).toLocaleDateString('pt-BR')}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de visualização */}
      <Dialog open={modalOpen} onOpenChange={(v) => { setModalOpen(v); if (!v) setSelected(null) }}>
        <DialogContent className="w-[95vw] max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 flex-wrap">
              <BookOpen className="h-5 w-5" />
              {selected?.title}
            </DialogTitle>
            <DialogDescription>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {selected && (
                  <span className={cn('text-[10px] px-1.5 py-0.5 rounded font-medium', categoryColor[selected.category])}>
                    {selected.category}
                  </span>
                )}
                {selected?.area && <Badge variant="outline" className="text-[10px]">{selected.area}</Badge>}
                {selected?.source && <Badge variant="outline" className="text-[10px]">{selected.source}</Badge>}
                {selected?.verified && (
                  <Badge variant="outline" className="text-[10px] gap-0.5 text-emerald-700 border-emerald-300">
                    <CheckCircle2 className="h-2.5 w-2.5" /> Verificado
                  </Badge>
                )}
              </div>
            </DialogDescription>
          </DialogHeader>

          {selected && (
            <div className="space-y-3">
              {/* Metadados */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px]">
                <div className="flex items-center gap-1.5"><User className="h-3 w-3" /> {selected.author || '-'}</div>
                <div className="flex items-center gap-1.5"><Clock className="h-3 w-3" /> {formatDateTime(selected.updatedAt)}</div>
                <div className="flex items-center gap-1.5"><Sparkles className="h-3 w-3" /> {selected.confidence}% confiança</div>
                <div className="flex items-center gap-1.5"><Tag className="h-3 w-3" /> {selected.tags?.split(',').slice(0, 2).join(', ') || '-'}</div>
              </div>

              {/* Resumo */}
              {selected.summary && (
                <div className="rounded-md border border-primary/30 bg-primary/5 p-3">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-1">Resumo IA</p>
                  <p className="text-xs">{selected.summary}</p>
                </div>
              )}

              {/* Conteúdo */}
              <div className="rounded-md border border-border bg-muted/30 p-3 max-h-96 overflow-y-auto">
                <pre className="text-[12px] whitespace-pre-wrap font-mono leading-relaxed">{selected.content}</pre>
              </div>

              {/* Tags */}
              {selected.tags && (
                <div className="flex flex-wrap gap-1">
                  {selected.tags.split(',').map((t) => (
                    <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                      {t.trim()}
                    </span>
                  ))}
                </div>
              )}

              {/* Ações */}
              <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
                {!selected.summary && (
                  <Button size="sm" variant="outline" onClick={() => summarize(selected.id)} disabled={summarizing}>
                    {summarizing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                    Gerar resumo com IA
                  </Button>
                )}
                {selected.sourceUrl && (
                  <Button size="sm" variant="outline" asChild>
                    <a href={selected.sourceUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3.5 w-3.5" /> Fonte original
                    </a>
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <NewArticleModal open={newModal} onOpenChange={setNewModal} onSubmit={handleCreate} />
    </div>
  )
}

function NewArticleModal({
  open, onOpenChange, onSubmit,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onSubmit: (data: Record<string, unknown>) => void
}) {
  const [form, setForm] = useState({
    title: '',
    content: '',
    category: 'Doutrina',
    area: 'Cível',
    tags: '',
    source: 'Caso Próprio',
    author: '',
    confidence: '85',
  })
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Novo artigo de conhecimento</DialogTitle>
          <DialogDescription>
            Adicione teses, jurisprudência, casos práticos ou modelos. A IA usará este conhecimento ao gerar petições.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label>Título *</Label>
            <Input value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="Ex.: Tese STJ sobre dano moral..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Categoria</Label>
              <Select value={form.category} onValueChange={(v) => set('category', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.filter((c) => c !== 'Todas').map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Área</Label>
              <Select value={form.area} onValueChange={(v) => set('area', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {AREAS.filter((a) => a !== 'Todas').map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Conteúdo (markdown)</Label>
            <Textarea
              value={form.content}
              onChange={(e) => set('content', e.target.value)}
              rows={8}
              placeholder="Digite o conteúdo completo..."
              className="font-mono text-xs"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Tags (vírgula)</Label>
              <Input value={form.tags} onChange={(e) => set('tags', e.target.value)} placeholder="dano moral, STJ, CDC" />
            </div>
            <div className="space-y-1.5">
              <Label>Fonte</Label>
              <Input value={form.source} onChange={(e) => set('source', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Autor</Label>
              <Input value={form.author} onChange={(e) => set('author', e.target.value)} placeholder="Dra. Patrícia Almeida" />
            </div>
            <div className="space-y-1.5">
              <Label>Confiança (0-100)</Label>
              <Input type="number" min="0" max="100" value={form.confidence} onChange={(e) => set('confidence', e.target.value)} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button
            disabled={!form.title || !form.content}
            onClick={() => {
              onSubmit({ ...form, confidence: parseInt(form.confidence) })
              setForm({ title: '', content: '', category: 'Doutrina', area: 'Cível', tags: '', source: 'Caso Próprio', author: '', confidence: '85' })
            }}
          >
            Criar artigo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
