'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { Switch } from '@/components/ui/switch'
import { UserPlus, Mail, Phone, Shield, Clock, Trash2, Plus } from 'lucide-react'
import { formatDate, formatDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { MaskedInput } from '@/components/ui/masked-input'
import { applyMask } from '@/lib/masks'

interface User {
  id: string
  name: string
  email: string
  role: string
  oab: string | null
  permissions: string | null
  twoFactorEnabled: boolean
  lastLogin: string | null
  createdAt: string
}

const ROLES = ['Administrador', 'Sócio', 'Advogado', 'Estagiário', 'Secretária']
const ALL_PERMISSIONS = [
  { id: 'processes', label: 'Processos' },
  { id: 'clients', label: 'Clientes' },
  { id: 'deadlines', label: 'Prazos' },
  { id: 'tasks', label: 'Tarefas' },
  { id: 'financial', label: 'Financeiro' },
  { id: 'documents', label: 'Documentos' },
  { id: 'contracts', label: 'Contratos' },
  { id: 'admin', label: 'Administração' },
  { id: 'reports', label: 'Relatórios' },
  { id: 'team', label: 'Equipe' },
]

const roleColor = (role: string) => {
  switch (role) {
    case 'Administrador': return 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300'
    case 'Sócio': return 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300'
    case 'Advogado': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
    case 'Estagiário': return 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
    case 'Secretária': return 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
    default: return 'bg-slate-100 text-slate-700'
  }
}

export function TeamView() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const { toast } = useToast()

  const load = () => {
    setLoading(true)
    fetch('/api/team')
      .then((r) => r.json())
      .then(setUsers)
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleCreate = async (data: Record<string, unknown>) => {
    const res = await fetch('/api/team', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (res.ok) {
      toast({ title: 'Usuário criado', description: 'Convite enviado por e-mail.' })
      setModalOpen(false)
      load()
    }
  }

  const toggle2FA = async (u: User) => {
    await fetch(`/api/team?id=${u.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ twoFactorEnabled: !u.twoFactorEnabled }),
    })
    toast({ title: '2FA atualizado', description: `${u.name}: ${!u.twoFactorEnabled ? 'ativado' : 'desativado'}` })
    load()
  }

  const remove = async (u: User) => {
    if (!confirm(`Remover ${u.name}?`)) return
    await fetch(`/api/team?id=${u.id}`, { method: 'DELETE' })
    toast({ title: 'Usuário removido' })
    load()
  }

  return (
    <div className="p-5 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{users.length} membros na equipe</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <UserPlus className="h-4 w-4 mr-1.5" />
          Convidar membro
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 rounded-md bg-muted/40 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {users.map((u) => {
            const perms = u.permissions === 'all' ? ['Todas'] : (u.permissions || '').split(',').filter(Boolean)
            const initials = u.name.split(' ').slice(0, 2).map((p) => p[0]).join('')
            return (
              <Card key={u.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="h-12 w-12 rounded-full bg-primary/15 text-primary flex items-center justify-center font-semibold shrink-0">
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm">{u.name}</p>
                        <span className={cn('text-[10px] px-1.5 py-0.5 rounded font-medium', roleColor(u.role))}>
                          {u.role}
                        </span>
                        {u.twoFactorEnabled && (
                          <Badge variant="outline" className="text-[9px] gap-0.5">
                            <Shield className="h-2.5 w-2.5" /> 2FA
                          </Badge>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Mail className="h-3 w-3" /> {u.email}
                      </p>
                      {u.oab && (
                        <p className="text-[11px] text-muted-foreground mt-0.5">{u.oab}</p>
                      )}
                      {u.lastLogin && (
                        <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Último acesso: {formatDateTime(u.lastLogin)}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {perms.map((p) => (
                          <span key={p} className="text-[9px] px-1 py-0.5 rounded bg-muted text-muted-foreground">
                            {p}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-border">
                    <label className="flex items-center gap-1.5 text-[11px] cursor-pointer">
                      <Switch checked={u.twoFactorEnabled} onCheckedChange={() => toggle2FA(u)} />
                      <span className="text-muted-foreground">2FA</span>
                    </label>
                    {u.role !== 'Administrador' && (
                      <Button size="sm" variant="ghost" onClick={() => remove(u)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <NewUserModal open={modalOpen} onOpenChange={setModalOpen} onSubmit={handleCreate} />
    </div>
  )
}

function NewUserModal({
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
    email: '',
    role: 'Advogado',
    oab: '',
    twoFactorEnabled: false,
  })
  const [perms, setPerms] = useState<string[]>(['processes', 'clients', 'deadlines', 'tasks'])

  const togglePerm = (p: string) => {
    setPerms((prev) => prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p])
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Convidar membro da equipe</DialogTitle>
          <DialogDescription>Um convite será enviado por e-mail. A senha padrão é &quot;demo123&quot;.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="n-name">Nome completo *</Label>
            <Input id="n-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="n-email">E-mail *</Label>
              <Input id="n-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="n-role">Cargo</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="n-oab">OAB (se aplicável)</Label>
            <MaskedInput
              id="n-oab"
              mask="oab"
              placeholder="OAB/SP 123.456"
              onRawChange={(v) => setForm({ ...form, oab: String(v) })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Permissões de acesso</Label>
            <div className="grid grid-cols-2 gap-2">
              {ALL_PERMISSIONS.map((p) => (
                <label key={p.id} className="flex items-center gap-2 text-sm cursor-pointer p-1.5 rounded hover:bg-accent">
                  <input
                    type="checkbox"
                    checked={perms.includes(p.id)}
                    onChange={() => togglePerm(p.id)}
                    className="h-4 w-4 rounded"
                  />
                  {p.label}
                </label>
              ))}
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <Switch checked={form.twoFactorEnabled} onCheckedChange={(v) => setForm({ ...form, twoFactorEnabled: v })} />
            Exigir autenticação 2FA
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button
            disabled={!form.name || !form.email}
            onClick={() => {
              onSubmit({
                ...form,
                permissions: form.role === 'Administrador' ? 'all' : perms.join(','),
              })
              setForm({ name: '', email: '', role: 'Advogado', oab: '', twoFactorEnabled: false })
              setPerms(['processes', 'clients', 'deadlines', 'tasks'])
            }}
          >
            <Plus className="h-4 w-4 mr-1" />
            Convidar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
