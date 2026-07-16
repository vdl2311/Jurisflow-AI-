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
import { Search, Plus, Users, Mail, Phone, MapPin, Building2, User, Loader2 } from 'lucide-react'
import { statusColor, formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { MaskedInput } from '@/components/ui/masked-input'
import { applyMask, onlyDigits, isValidCPF, isValidCNPJ, isValidEmail } from '@/lib/masks'

interface Client {
  id: string
  name: string
  type: string
  document: string | null
  email: string | null
  phone: string | null
  mobile: string | null
  city: string | null
  state: string | null
  status: string
  tags: string | null
  notes: string | null
  createdAt: string
  _count: { processes: number; tasks: number; financials: number }
}

interface Props {
  selectedId?: string | null
  onOpenProcess: (id: string) => void
}

export function ClientsView({ selectedId }: Props) {
  const [items, setItems] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('Todos')
  const [modalOpen, setModalOpen] = useState(false)
  const [selected, setSelected] = useState<Client | null>(null)
  const { toast } = useToast()

  const load = () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (status !== 'Todos') params.set('status', status)
    fetch(`/api/clients?${params}`)
      .then((r) => r.json())
      .then((d) => {
        setItems(d)
        if (selectedId) {
          const sel = d.find((c: Client) => c.id === selectedId)
          if (sel) setSelected(sel)
        }
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [search, status])

  const handleCreate = async (data: Record<string, unknown>) => {
    const res = await fetch('/api/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (res.ok) {
      toast({ title: 'Cliente cadastrado', description: 'Cliente criado com sucesso.' })
      setModalOpen(false)
      load()
    } else {
      toast({ title: 'Erro', description: 'Falha ao cadastrar cliente.', variant: 'destructive' })
    }
  }

  return (
    <div className="p-5 md:p-6 space-y-4">
      <div className="flex flex-col md:flex-row gap-3 md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome, CPF/CNPJ, e-mail..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-full md:w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {['Todos', 'Prospect', 'Ativo', 'Inativo'].map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={() => setModalOpen(true)} className="shrink-0">
          <Plus className="h-4 w-4 mr-1.5" />
          Novo cliente
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-40 rounded-md bg-muted/40 animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Nenhum cliente encontrado.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map((c) => (
            <Card
              key={c.id}
              className="cursor-pointer hover:shadow-md hover:border-primary/30 transition-all"
              onClick={() => setSelected(c)}
            >
              <CardContent className="p-4 space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="h-10 w-10 rounded-full bg-primary/15 text-primary flex items-center justify-center shrink-0">
                      {c.type === 'PJ' ? <Building2 className="h-5 w-5" /> : <User className="h-5 w-5" />}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{c.name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {c.type === 'PJ' ? 'CNPJ' : 'CPF'}: {c.document || '-'}
                      </p>
                    </div>
                  </div>
                  <span className={cn('text-[10px] px-1.5 py-0.5 rounded border font-medium shrink-0', statusColor(c.status))}>
                    {c.status}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1">
                  {c.tags?.split(',').map((t) => (
                    <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                      {t.trim()}
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-3 text-[11px] text-muted-foreground pt-2 border-t border-border">
                  <span>{c._count.processes} proc.</span>
                  <span>{c._count.tasks} tarefas</span>
                  <span>{c._count.financials} fin.</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ClientDetailModal
        client={selected}
        onOpenChange={(v) => !v && setSelected(null)}
      />

      <NewClientModal open={modalOpen} onOpenChange={setModalOpen} onSubmit={handleCreate} />
    </div>
  )
}

function ClientDetailModal({ client, onOpenChange }: { client: Client | null; onOpenChange: (v: boolean) => void }) {
  if (!client) return null
  return (
    <Dialog open={!!client} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {client.type === 'PJ' ? <Building2 className="h-5 w-5" /> : <User className="h-5 w-5" />}
            {client.name}
          </DialogTitle>
          <DialogDescription>
            {client.type === 'PJ' ? 'Pessoa jurídica' : 'Pessoa física'} • Cliente desde {formatDate(client.createdAt)}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-[11px] text-muted-foreground">{client.type === 'PJ' ? 'CNPJ' : 'CPF'}</p>
              <p className="font-medium">{client.document || '-'}</p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">Status</p>
              <span className={cn('text-xs px-2 py-0.5 rounded border font-medium', statusColor(client.status))}>
                {client.status}
              </span>
            </div>
          </div>
          <div className="space-y-1.5 text-sm">
            {client.email && (
              <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" /> {client.email}</div>
            )}
            {client.phone && (
              <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" /> {client.phone}</div>
            )}
            {(client.city || client.state) && (
              <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground" /> {client.city}/{client.state}</div>
            )}
          </div>
          {client.tags && (
            <div className="flex flex-wrap gap-1">
              {client.tags.split(',').map((t) => (
                <span key={t} className="text-[11px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                  {t.trim()}
                </span>
              ))}
            </div>
          )}
          {client.notes && (
            <div>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1">Observações</p>
              <p className="text-sm text-muted-foreground">{client.notes}</p>
            </div>
          )}
          <div className="flex gap-3 pt-2 border-t border-border text-sm">
            <div><strong>{client._count.processes}</strong> processos</div>
            <div><strong>{client._count.tasks}</strong> tarefas</div>
            <div><strong>{client._count.financials}</strong> financeiros</div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function NewClientModal({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onSubmit: (data: Record<string, unknown>) => void
}) {
  const [form, setForm] = useState({
    name: '',
    type: 'PF',
    document: '',
    email: '',
    phone: '',
    mobile: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    status: 'Prospect',
    tags: '',
    notes: '',
  })
  const [cepLoading, setCepLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  // Busca endereço via ViaCEP
  const buscarCep = async (cep: string) => {
    const cepLimpo = onlyDigits(cep)
    if (cepLimpo.length !== 8) return
    setCepLoading(true)
    try {
      const res = await fetch(`/api/viacep?cep=${cepLimpo}`)
      if (res.ok) {
        const data = await res.json()
        if (!data.error) {
          setForm((f) => ({
            ...f,
            address: data.logradouro ? `${data.logradouro}${data.complemento ? ' - ' + data.complemento : ''}` : f.address,
            city: data.localidade || f.city,
            state: data.uf || f.state,
          }))
        }
      }
    } catch {
      // ignore
    } finally {
      setCepLoading(false)
    }
  }

  const validate = (): boolean => {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = 'Nome é obrigatório'
    if (form.document) {
      const doc = onlyDigits(form.document)
      if (form.type === 'PF' && doc.length === 11 && !isValidCPF(doc)) {
        e.document = 'CPF inválido'
      } else if (form.type === 'PJ' && doc.length === 14 && !isValidCNPJ(doc)) {
        e.document = 'CNPJ inválido'
      }
    }
    if (form.email && !isValidEmail(form.email)) e.email = 'E-mail inválido'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cadastrar cliente</DialogTitle>
          <DialogDescription>Pessoa física ou jurídica. Campos com * são obrigatórios.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 py-2">
          <div className="md:col-span-2 space-y-1.5">
            <Label htmlFor="c-name">Nome / Razão social *</Label>
            <Input id="c-name" value={form.name} onChange={(e) => set('name', e.target.value)} />
            {errors.name && <p className="text-[11px] text-destructive">{errors.name}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="c-type">Tipo *</Label>
            <Select value={form.type} onValueChange={(v) => set('type', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="PF">Pessoa Física</SelectItem>
                <SelectItem value="PJ">Pessoa Jurídica</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="c-doc">{form.type === 'PF' ? 'CPF' : 'CNPJ'}</Label>
            <MaskedInput
              id="c-doc"
              mask={form.type === 'PF' ? 'cpf' : 'cnpj'}
              placeholder={form.type === 'PF' ? '000.000.000-00' : '00.000.000/0000-00'}
              onRawChange={(v) => set('document', String(v))}
            />
            {errors.document && <p className="text-[11px] text-destructive">{errors.document}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="c-email">E-mail</Label>
            <Input id="c-email" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="cliente@email.com" />
            {errors.email && <p className="text-[11px] text-destructive">{errors.email}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="c-phone">Telefone</Label>
            <MaskedInput
              id="c-phone"
              mask="phone"
              placeholder="(00) 0000-0000"
              onRawChange={(v) => set('phone', String(v))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="c-mobile">Celular / WhatsApp</Label>
            <MaskedInput
              id="c-mobile"
              mask="phone"
              placeholder="(00) 90000-0000"
              onRawChange={(v) => set('mobile', String(v))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="c-status">Status</Label>
            <Select value={form.status} onValueChange={(v) => set('status', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Prospect">Prospect</SelectItem>
                <SelectItem value="Ativo">Ativo</SelectItem>
                <SelectItem value="Inativo">Inativo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="c-cep" className="flex items-center gap-1.5">
              CEP
              {cepLoading && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
            </Label>
            <div className="flex gap-2">
              <MaskedInput
                id="c-cep"
                mask="cep"
                placeholder="00000-000"
                onRawChange={(v) => set('zipCode', String(v))}
                onBlur={(e) => buscarCep(e.target.value)}
              />
              <Button type="button" size="sm" variant="outline" onClick={() => buscarCep(form.zipCode)} disabled={cepLoading}>
                <MapPin className="h-3.5 w-3.5" />
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground">Preenche endereço automaticamente via ViaCEP</p>
          </div>
          <div className="md:col-span-2 space-y-1.5">
            <Label htmlFor="c-address">Endereço</Label>
            <Input id="c-address" value={form.address} onChange={(e) => set('address', e.target.value)} placeholder="Rua, número, complemento" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="c-city">Cidade</Label>
            <Input id="c-city" value={form.city} onChange={(e) => set('city', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="c-state">Estado (UF)</Label>
            <Input id="c-state" value={form.state} onChange={(e) => set('state', e.target.value.toUpperCase().slice(0, 2))} placeholder="SP" maxLength={2} />
          </div>
          <div className="md:col-span-2 space-y-1.5">
            <Label htmlFor="c-tags">Tags (separadas por vírgula)</Label>
            <Input id="c-tags" value={form.tags} onChange={(e) => set('tags', e.target.value)} placeholder="Ex.: Trabalhista, Recorrente, PJ" />
          </div>
          <div className="md:col-span-2 space-y-1.5">
            <Label htmlFor="c-notes">Observações</Label>
            <Textarea id="c-notes" value={form.notes} onChange={(e) => set('notes', e.target.value)} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button disabled={!form.name} onClick={() => {
            if (!validate()) return
            onSubmit(form)
            setForm({ name: '', type: 'PF', document: '', email: '', phone: '', mobile: '', address: '', city: '', state: '', zipCode: '', status: 'Prospect', tags: '', notes: '' })
            setErrors({})
          }}>
            Cadastrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
