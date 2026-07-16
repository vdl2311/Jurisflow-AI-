'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Search,
  Trash2,
  Plus,
  Pencil,
  LogIn,
  Download,
  ShieldAlert,
  FileText,
  Users,
  DollarSign,
  Clock,
  ArrowUpDown,
  AlertTriangle,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  Eye,
  CheckSquare,
} from 'lucide-react'
import { formatDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { UserInfo } from '@/lib/api'

interface AuditLogEntry {
  id: string
  user: string
  action: string
  entity: string
  entityId: string | null
  details: string
  createdAt: string
}

interface AuditStats {
  totalDeletions: number
  topUsers: { user: string; count: number }[]
}

interface AuditResponse {
  logs: AuditLogEntry[]
  pagination: { page: number; limit: number; total: number; pages: number }
  stats: AuditStats
}

interface AdminAuditViewProps {
  user?: UserInfo | null
}

const ACTION_CONFIG: Record<string, { color: string; bg: string; icon: React.ElementType; label: string }> = {
  CREATE: { color: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-100 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800', icon: Plus, label: 'Criação' },
  UPDATE: { color: 'text-blue-700 dark:text-blue-300', bg: 'bg-blue-100 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800', icon: Pencil, label: 'Atualização' },
  DELETE: { color: 'text-red-700 dark:text-red-300', bg: 'bg-red-100 dark:bg-red-950/50 border-red-200 dark:border-red-800', icon: Trash2, label: 'Exclusão' },
  LOGIN: { color: 'text-violet-700 dark:text-violet-300', bg: 'bg-violet-100 dark:bg-violet-950/50 border-violet-200 dark:border-violet-800', icon: LogIn, label: 'Login' },
  LOGOUT: { color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-100 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700', icon: LogIn, label: 'Logout' },
  EXPORT: { color: 'text-cyan-700 dark:text-cyan-300', bg: 'bg-cyan-100 dark:bg-cyan-950/50 border-cyan-200 dark:border-cyan-800', icon: Download, label: 'Exportação' },
  VIEW: { color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-700', icon: Eye, label: 'Visualização' },
}

const ENTITY_ICONS: Record<string, { icon: React.ElementType; color: string }> = {
  Financial: { icon: DollarSign, color: 'text-emerald-600' },
  Process: { icon: FileText, color: 'text-blue-600' },
  Client: { icon: Users, color: 'text-purple-600' },
  Task: { icon: CheckSquare, color: 'text-orange-600' },
  Deadline: { icon: Clock, color: 'text-red-600' },
  User: { icon: Users, color: 'text-violet-600' },
  System: { icon: ShieldAlert, color: 'text-slate-600' },
}

// Cores fixas por usuário para avatar
const USER_COLORS = [
  'bg-blue-600', 'bg-emerald-600', 'bg-violet-600', 'bg-orange-600',
  'bg-pink-600', 'bg-cyan-600', 'bg-amber-600', 'bg-indigo-600',
]

function getUserColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return USER_COLORS[Math.abs(hash) % USER_COLORS.length]
}

function getUserInitials(name: string): string {
  if (name === 'Sistema') return 'S'
  if (name === 'Desconhecido') return '?'
  return name
    .split(' ')
    .filter((p) => !['da', 'de', 'do', 'das', 'dos', 'e'].includes(p.toLowerCase()))
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase()
}

export function AdminAuditView({ user }: AdminAuditViewProps) {
  const [data, setData] = useState<AuditResponse | null>(null)
  const [loading, setLoading] = useState(true)

  // Filtros
  const [filterUser, setFilterUser] = useState('')
  const [filterAction, setFilterAction] = useState('')
  const [filterEntity, setFilterEntity] = useState('')
  const [filterSearch, setFilterSearch] = useState('')
  const [filterDeletions, setFilterDeletions] = useState(false)
  const [page, setPage] = useState(1)

  const loadLogs = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filterUser) params.set('user', filterUser)
    if (filterAction) params.set('action', filterAction)
    if (filterEntity) params.set('entity', filterEntity)
    if (filterSearch) params.set('search', filterSearch)
    if (filterDeletions) params.set('deletions', 'true')
    params.set('page', String(page))
    params.set('limit', '50')

    try {
      const res = await fetch(`/api/audit?${params.toString()}`)
      const json = await res.json()
      setData(json)
    } catch {
      // silencioso
    } finally {
      setLoading(false)
    }
  }, [filterUser, filterAction, filterEntity, filterSearch, filterDeletions, page])

  useEffect(() => {
    loadLogs()
  }, [loadLogs])

  const clearFilters = () => {
    setFilterUser('')
    setFilterAction('')
    setFilterEntity('')
    setFilterSearch('')
    setFilterDeletions(false)
    setPage(1)
  }

  const hasActiveFilters = filterUser || filterAction || filterEntity || filterSearch || filterDeletions

  return (
    <div className="p-5 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-primary" />
            Log de Auditoria
          </h2>
          <p className="text-sm text-muted-foreground">
            Registro completo de ações no sistema — conforme LGPD
          </p>
        </div>
      </div>

      {/* Cards de estatísticas */}
      {data?.stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Alerta de exclusões */}
          <Card className={cn(
            'border-2',
            data.stats.totalDeletions > 0
              ? 'border-red-300 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20'
              : 'border-border'
          )}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={cn(
                  'h-10 w-10 rounded-lg flex items-center justify-center',
                  data.stats.totalDeletions > 0
                    ? 'bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400'
                    : 'bg-muted text-muted-foreground'
                )}>
                  <Trash2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Exclusões registradas</p>
                  <p className={cn(
                    'text-2xl font-bold',
                    data.stats.totalDeletions > 0 && 'text-red-600 dark:text-red-400'
                  )}>
                    {data.stats.totalDeletions}
                  </p>
                </div>
              </div>
              {data.stats.totalDeletions > 0 && (
                <p className="text-[11px] text-red-600 dark:text-red-400 mt-2 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Há exclusões registradas. Verifique os detalhes abaixo.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Total de registros */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <ArrowUpDown className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Total de registros</p>
                  <p className="text-2xl font-bold">{data.pagination.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top usuários */}
          <Card>
            <CardContent className="p-4">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-2">Usuários mais ativos</p>
              <div className="space-y-1">
                {data.stats.topUsers.slice(0, 3).map((u) => (
                  <div key={u.user} className="flex items-center gap-2">
                    <div className={cn('h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0', getUserColor(u.user))}>
                      {getUserInitials(u.user)}
                    </div>
                    <span className="text-xs truncate flex-1">{u.user}</span>
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{u.count}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-medium">Filtros</p>
            {hasActiveFilters && (
              <Button size="sm" variant="ghost" onClick={clearFilters} className="h-6 text-[11px] gap-1 ml-auto">
                <X className="h-3 w-3" /> Limpar filtros
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {/* Busca */}
            <div className="sm:col-span-2 lg:col-span-2">
              <Label className="text-[11px] text-muted-foreground">Buscar nos detalhes</Label>
              <div className="relative mt-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Ex: exclusão, honorários, processo..."
                  value={filterSearch}
                  onChange={(e) => { setFilterSearch(e.target.value); setPage(1) }}
                  className="pl-8 h-8 text-xs"
                />
              </div>
            </div>

            {/* Usuário */}
            <div>
              <Label className="text-[11px] text-muted-foreground">Usuário</Label>
              <Input
                placeholder="Nome do usuário"
                value={filterUser}
                onChange={(e) => { setFilterUser(e.target.value); setPage(1) }}
                className="mt-1 h-8 text-xs"
              />
            </div>

            {/* Ação */}
            <div>
              <Label className="text-[11px] text-muted-foreground">Ação</Label>
              <Select value={filterAction} onValueChange={(v) => { setFilterAction(v); setPage(1) }}>
                <SelectTrigger className="mt-1 h-8 text-xs">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas</SelectItem>
                  <SelectItem value="CREATE">Criação</SelectItem>
                  <SelectItem value="UPDATE">Atualização</SelectItem>
                  <SelectItem value="DELETE">Exclusão</SelectItem>
                  <SelectItem value="LOGIN">Login</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Entidade */}
            <div>
              <Label className="text-[11px] text-muted-foreground">Entidade</Label>
              <Select value={filterEntity} onValueChange={(v) => { setFilterEntity(v); setPage(1) }}>
                <SelectTrigger className="mt-1 h-8 text-xs">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas</SelectItem>
                  <SelectItem value="Process">Processo</SelectItem>
                  <SelectItem value="Client">Cliente</SelectItem>
                  <SelectItem value="Financial">Financeiro</SelectItem>
                  <SelectItem value="Task">Tarefa</SelectItem>
                  <SelectItem value="Deadline">Prazo</SelectItem>
                  <SelectItem value="User">Usuário</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Toggle exclusões */}
            <div className="flex items-end">
              <button
                onClick={() => { setFilterDeletions(!filterDeletions); setPage(1) }}
                className={cn(
                  'w-full h-8 rounded-md border-2 text-xs font-medium flex items-center justify-center gap-1.5 transition-all',
                  filterDeletions
                    ? 'border-red-400 bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300 dark:border-red-800'
                    : 'border-border text-muted-foreground hover:border-red-300 hover:text-red-600'
                )}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Só exclusões
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de logs */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Histórico de ações</CardTitle>
              <CardDescription>
                {data && `Mostrando ${data.logs.length} de ${data.pagination.total} registros`}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-14 rounded-md bg-muted/40 animate-pulse" />
              ))}
            </div>
          ) : !data || data.logs.length === 0 ? (
            <div className="py-12 text-center">
              <ShieldAlert className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Nenhum registro encontrado com os filtros selecionados.</p>
            </div>
          ) : (
            <>
              <div className="max-h-[600px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-background border-b border-border z-10">
                    <tr>
                      <th className="text-left p-2 text-[11px] font-medium text-muted-foreground uppercase w-10">Tipo</th>
                      <th className="text-left p-2 text-[11px] font-medium text-muted-foreground uppercase">Quando</th>
                      <th className="text-left p-2 text-[11px] font-medium text-muted-foreground uppercase">Usuário</th>
                      <th className="text-left p-2 text-[11px] font-medium text-muted-foreground uppercase">Ação / Entidade</th>
                      <th className="text-left p-2 text-[11px] font-medium text-muted-foreground uppercase">Detalhes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.logs.map((log) => {
                      const actionCfg = ACTION_CONFIG[log.action] || ACTION_CONFIG.VIEW
                      const entityCfg = ENTITY_ICONS[log.entity] || { icon: FileText, color: 'text-muted-foreground' }
                      const EntityIcon = entityCfg.icon
                      const ActionIcon = actionCfg.icon
                      const isDeletion = log.action === 'DELETE'
                      const isLogin = log.action === 'LOGIN'

                      return (
                        <tr
                          key={log.id}
                          className={cn(
                            'border-b border-border/50 hover:bg-accent/30 transition-colors',
                            isDeletion && 'bg-red-50/50 dark:bg-red-950/10 hover:bg-red-100/50 dark:hover:bg-red-950/20'
                          )}
                        >
                          {/* Tipo/Ação */}
                          <td className="p-2">
                            <div className={cn(
                              'h-7 w-7 rounded-md flex items-center justify-center border',
                              actionCfg.bg
                            )}>
                              <ActionIcon className={cn('h-3.5 w-3.5', actionCfg.color)} />
                            </div>
                          </td>

                          {/* Quando */}
                          <td className="p-2 text-[11px] text-muted-foreground whitespace-nowrap">
                            {formatDateTime(log.createdAt)}
                          </td>

                          {/* Usuário */}
                          <td className="p-2">
                            <div className="flex items-center gap-2">
                              <div className={cn(
                                'h-6 w-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0',
                                getUserColor(log.user)
                              )}>
                                {getUserInitials(log.user)}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-medium truncate max-w-[140px]">{log.user}</p>
                              </div>
                            </div>
                          </td>

                          {/* Ação / Entidade */}
                          <td className="p-2">
                            <div className="flex items-center gap-1.5">
                              <Badge
                                variant="outline"
                                className={cn('text-[10px] font-semibold', actionCfg.bg, actionCfg.color)}
                              >
                                {actionCfg.label}
                              </Badge>
                              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                <EntityIcon className={cn('h-3 w-3', entityCfg.color)} />
                                {log.entity}
                              </span>
                            </div>
                          </td>

                          {/* Detalhes */}
                          <td className="p-2">
                            <p className={cn(
                              'text-[11px] leading-relaxed',
                              isDeletion ? 'text-red-700 dark:text-red-300 font-medium' : 'text-muted-foreground',
                              isLogin && 'text-violet-700 dark:text-violet-300'
                            )}>
                              {isDeletion && log.details.startsWith('LANÇAMENTO EXCLUÍDO') && (
                                <span className="inline-flex items-center gap-1 mr-1">
                                  <AlertTriangle className="h-3 w-3" />
                                </span>
                              )}
                              {isDeletion && log.details.startsWith('CLIENTE EXCLUÍDO') && (
                                <span className="inline-flex items-center gap-1 mr-1">
                                  <AlertTriangle className="h-3 w-3" />
                                </span>
                              )}
                              {isDeletion && log.details.startsWith('TAREFA EXCLUÍDA') && (
                                <span className="inline-flex items-center gap-1 mr-1">
                                  <AlertTriangle className="h-3 w-3" />
                                </span>
                              )}
                              {isDeletion && log.details.startsWith('PRAZO EXCLUÍDO') && (
                                <span className="inline-flex items-center gap-1 mr-1">
                                  <AlertTriangle className="h-3 w-3" />
                                </span>
                              )}
                              {log.details}
                            </p>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Paginação */}
              {data.pagination.pages > 1 && (
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                  <p className="text-[11px] text-muted-foreground">
                    Página {data.pagination.page} de {data.pagination.pages}
                  </p>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    {Array.from({ length: Math.min(5, data.pagination.pages) }, (_, i) => {
                      let pageNum: number
                      if (data.pagination.pages <= 5) {
                        pageNum = i + 1
                      } else if (page <= 3) {
                        pageNum = i + 1
                      } else if (page >= data.pagination.pages - 2) {
                        pageNum = data.pagination.pages - 4 + i
                      } else {
                        pageNum = page - 2 + i
                      }
                      return (
                        <Button
                          key={pageNum}
                          size="sm"
                          variant={page === pageNum ? 'default' : 'outline'}
                          className="h-7 w-7 p-0 text-xs"
                          onClick={() => setPage(pageNum)}
                        >
                          {pageNum}
                        </Button>
                      )
                    })}
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2"
                      disabled={page >= data.pagination.pages}
                      onClick={() => setPage((p) => Math.min(data.pagination.pages, p + 1))}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// Re-export para compatibilidade
export { AdminAuditView as default }