'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { FileText, Plus, FileSignature, Download, Eye, PenLine, CheckCircle2, Clock } from 'lucide-react'
import { formatDateTime, formatDate, statusColor } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

interface Contract {
  id: string
  title: string
  content: string
  status: string
  signedBy: string | null
  signedAt: string | null
  createdAt: string
  client: { id: string; name: string }
  process: { id: string; title: string } | null
  template: { id: string; name: string } | null
}

interface Template {
  id: string
  name: string
  category: string
  content: string
  variables: string[]
  _count: { contracts: number }
}

export function ContractsView() {
  const [tab, setTab] = useState('contracts')
  const [contracts, setContracts] = useState<Contract[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [clients, setClients] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [newModal, setNewModal] = useState(false)
  const [viewContract, setViewContract] = useState<Contract | null>(null)
  const { toast } = useToast()

  const load = () => {
    setLoading(true)
    Promise.all([
      fetch('/api/contracts').then((r) => r.json()),
      fetch('/api/templates').then((r) => r.json()),
      fetch('/api/clients').then((r) => r.json()),
    ]).then(([c, t, cl]) => {
      setContracts(c)
      setTemplates(t)
      setClients(cl)
    }).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleCreate = async (data: Record<string, unknown>) => {
    const res = await fetch('/api/contracts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (res.ok) {
      toast({ title: 'Contrato gerado', description: 'Contrato criado a partir do template.' })
      setNewModal(false)
      load()
    }
  }

  const signContract = async (c: Contract) => {
    const assinantes = prompt('Nome dos signatários:', c.client.name)
    if (!assinantes) return
    await fetch(`/api/contracts?id=${c.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ acao: 'assinar', assinantes }),
    })
    toast({ title: 'Contrato assinado eletronicamente', description: `Signatários: ${assinantes}` })
    load()
  }

  return (
    <div className="p-5 md:p-6 space-y-4">
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="contracts">Contratos ({contracts.length})</TabsTrigger>
          <TabsTrigger value="templates">Modelos ({templates.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="contracts" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {contracts.filter((c) => c.status === 'Assinado').length} assinados • {contracts.filter((c) => c.status === 'Rascunho').length} rascunhos
            </p>
            <Button onClick={() => setNewModal(true)}>
              <Plus className="h-4 w-4 mr-1.5" />
              Novo contrato
            </Button>
          </div>

          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-20 rounded-md bg-muted/40 animate-pulse" />
              ))}
            </div>
          ) : contracts.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <FileText className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Nenhum contrato cadastrado.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {contracts.map((c) => (
                <Card key={c.id}>
                  <CardContent className="p-3.5 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{c.title}</p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {c.client.name} • {c.template?.name || 'Sem modelo'} • Criado em {formatDate(c.createdAt)}
                      </p>
                      {c.signedBy && (
                        <p className="text-[10px] text-muted-foreground truncate">
                          ✍️ Assinado por: {c.signedBy} em {formatDateTime(c.signedAt || '')}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={cn('text-[10px] px-1.5 py-0.5 rounded border font-medium', statusColor(c.status))}>
                        {c.status}
                      </span>
                      <Button size="sm" variant="ghost" onClick={() => setViewContract(c)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      {c.status !== 'Assinado' && (
                        <Button size="sm" variant="outline" onClick={() => signContract(c)}>
                          <PenLine className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline ml-1">Assinar</span>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Modelos de documentos com variáveis dinâmicas. Use <code className="bg-muted px-1 rounded">{'{{variavel}}'}</code> no conteúdo.
          </p>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-32 rounded-md bg-muted/40 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {templates.map((t) => (
                <Card key={t.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <div className="h-9 w-9 rounded-md bg-muted flex items-center justify-center">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{t.name}</p>
                          <Badge variant="outline" className="text-[10px] mt-0.5">{t.category}</Badge>
                        </div>
                      </div>
                      <span className="text-[10px] text-muted-foreground">{t._count.contracts} usos</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {t.variables.slice(0, 6).map((v) => (
                        <code key={v} className="text-[10px] px-1 py-0.5 rounded bg-muted text-primary">
                          {`{{${v}}}`}
                        </code>
                      ))}
                      {t.variables.length > 6 && (
                        <span className="text-[10px] text-muted-foreground">+{t.variables.length - 6}</span>
                      )}
                    </div>
                    <Button size="sm" className="w-full mt-3" onClick={() => setNewModal(true)}>
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      Gerar deste modelo
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Modal ver contrato */}
      {viewContract && (
        <Dialog open={!!viewContract} onOpenChange={(v) => !v && setViewContract(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileSignature className="h-5 w-5" />
                {viewContract.title}
              </DialogTitle>
              <DialogDescription>
                Cliente: {viewContract.client.name} • Status: {viewContract.status}
                {viewContract.signedAt && ` • Assinado em ${formatDateTime(viewContract.signedAt)}`}
              </DialogDescription>
            </DialogHeader>
            <div className="rounded-md border border-border p-4 bg-muted/30 max-h-[60vh] overflow-y-auto">
              <pre className="text-xs whitespace-pre-wrap font-mono leading-relaxed">{viewContract.content}</pre>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => window.print()}>
                <Download className="h-4 w-4 mr-1.5" />
                Exportar PDF
              </Button>
              {viewContract.status !== 'Assinado' && (
                <Button onClick={() => signContract(viewContract)}>
                  <PenLine className="h-4 w-4 mr-1.5" />
                  Assinar eletronicamente
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal novo contrato */}
      <NewContractModal
        open={newModal}
        onOpenChange={setNewModal}
        templates={templates}
        clients={clients}
        onSubmit={handleCreate}
      />
    </div>
  )
}

function NewContractModal({
  open,
  onOpenChange,
  templates,
  clients,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  templates: Template[]
  clients: { id: string; name: string }[]
  onSubmit: (data: Record<string, unknown>) => void
}) {
  const [form, setForm] = useState({
    title: '',
    templateId: '',
    clientId: '',
  })
  const [variables, setVariables] = useState<Record<string, string>>({})
  const [generated, setGenerated] = useState('')

  const selectedTemplate = templates.find((t) => t.id === form.templateId)

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const handleGenerate = () => {
    if (!selectedTemplate) return
    let content = selectedTemplate.content
    for (const [k, v] of Object.entries(variables)) {
      content = content.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), v || `[${k}]`)
    }
    setGenerated(content)
  }

  const handleSubmit = () => {
    onSubmit({
      title: form.title || selectedTemplate?.name || 'Contrato',
      templateId: form.templateId,
      clientId: form.clientId,
      variables,
      content: generated,
    })
    setForm({ title: '', templateId: '', clientId: '' })
    setVariables({})
    setGenerated('')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gerar contrato</DialogTitle>
          <DialogDescription>Escolha um modelo e preencha as variáveis.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Modelo *</Label>
              <Select value={form.templateId} onValueChange={(v) => {
                set('templateId', v)
                setVariables({})
                setGenerated('')
              }}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Cliente *</Label>
              <Select value={form.clientId} onValueChange={(v) => set('clientId', v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ct-title">Título do contrato</Label>
            <Input id="ct-title" value={form.title} onChange={(e) => set('title', e.target.value)} placeholder={selectedTemplate?.name || 'Contrato'} />
          </div>

          {selectedTemplate && (
            <div className="space-y-2">
              <Label className="text-xs">Variáveis do template</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {selectedTemplate.variables.map((v) => (
                  <div key={v} className="space-y-1">
                    <Label className="text-[11px] font-mono">{`{{${v}}}`}</Label>
                    <Input
                      value={variables[v] || ''}
                      onChange={(e) => setVariables({ ...variables, [v]: e.target.value })}
                      placeholder={v}
                    />
                  </div>
                ))}
              </div>
              <Button variant="outline" size="sm" onClick={handleGenerate}>
                <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                Pré-visualizar
              </Button>
            </div>
          )}

          {generated && (
            <div className="space-y-1.5">
              <Label className="text-xs">Pré-visualização</Label>
              <div className="rounded-md border border-border p-3 bg-muted/30 max-h-64 overflow-y-auto">
                <pre className="text-[11px] whitespace-pre-wrap font-mono leading-relaxed">{generated}</pre>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button disabled={!form.templateId || !form.clientId} onClick={handleSubmit}>
            Criar contrato
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
