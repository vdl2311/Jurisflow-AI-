'use client'

import {
  LayoutDashboard,
  FolderKanban,
  Users,
  AlarmClock,
  CheckSquare,
  DollarSign,
  Sparkles,
  Scale,
  ChevronLeft,
  ChevronRight,
  Calendar,
  FileText,
  Zap,
  BookOpen,
  Bell,
  ShieldAlert,
  Settings,
  BarChart3,
  UserCog,
  Globe,
  Cloud,
  ScrollText,
  Bot,
  BookMarked,
  ShieldCheck,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { canView } from '@/lib/permissions'
import type { ViewName } from '@/app/page'

interface SidebarProps {
  current: ViewName
  onNavigate: (v: ViewName) => void
  collapsed: boolean
  onToggleCollapse: () => void
  userRole: string
  mobileOpen?: boolean
  onMobileClose?: () => void
}

interface NavGroup {
  label: string
  items: { id: ViewName; label: string; icon: React.ComponentType<{ className?: string }>; desc: string }[]
}

const allGroups: NavGroup[] = [
  {
    label: 'Principal',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, desc: 'Visão geral' },
      { id: 'copilot', label: 'Copiloto IA', icon: Sparkles, desc: 'Chat jurídico' },
      { id: 'ai-juridica', label: 'IA Jurídica', icon: BookOpen, desc: 'Petições e revisão' },
      { id: 'agents', label: 'Agentes IA', icon: Bot, desc: 'Autônomos com supervisão' },
    ],
  },
  {
    label: 'Operação',
    items: [
      { id: 'processes', label: 'Processos', icon: FolderKanban, desc: 'Casos' },
      { id: 'datajud', label: 'DataJud (CNJ)', icon: Cloud, desc: 'Consulta tribunais' },
      { id: 'agenda', label: 'Agenda', icon: Calendar, desc: 'Calendário' },
      { id: 'deadlines', label: 'Prazos', icon: AlarmClock, desc: 'Fatais e internos' },
      { id: 'tasks', label: 'Tarefas', icon: CheckSquare, desc: 'Kanban' },
      { id: 'clients', label: 'Clientes', icon: Users, desc: 'CRM' },
      { id: 'financial', label: 'Financeiro', icon: DollarSign, desc: 'Honorários' },
    ],
  },
  {
    label: 'Documentos',
    items: [
      { id: 'contracts', label: 'Contratos', icon: FileText, desc: 'Modelos e assinatura' },
      { id: 'documents', label: 'Documentos', icon: FileText, desc: 'Arquivos' },
    ],
  },
  {
    label: 'Gestão',
    items: [
      { id: 'automations', label: 'Automações', icon: Zap, desc: 'Workflows' },
      { id: 'knowledge', label: 'Conhecimento', icon: BookMarked, desc: 'Base jurídica' },
      { id: 'compliance', label: 'Conformidade', icon: ShieldCheck, desc: 'LGPD + OAB' },
      { id: 'notifications', label: 'Notificações', icon: Bell, desc: 'Alertas' },
      { id: 'conflicts', label: 'Conflitos', icon: ShieldAlert, desc: 'Verificação OAB' },
      { id: 'reports', label: 'Relatórios', icon: BarChart3, desc: 'Múltiplos tipos' },
      { id: 'team', label: 'Equipe', icon: UserCog, desc: 'Usuários e permissões' },
      { id: 'admin', label: 'Administração', icon: Settings, desc: 'Planos e logs' },
      { id: 'audit-log', label: 'Log de Auditoria', icon: ScrollText, desc: 'Quem fez o quê' },
    ],
  },
  {
    label: 'Cliente',
    items: [
      { id: 'portal', label: 'Portal do Cliente', icon: Globe, desc: 'Área do cliente' },
    ],
  },
]

export function Sidebar({ current, onNavigate, collapsed, onToggleCollapse, userRole, mobileOpen, onMobileClose }: SidebarProps) {
  // Filtra os grupos e itens que o cargo pode ver
  const visibleGroups = allGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => canView(userRole, item.id)),
    }))
    .filter((group) => group.items.length > 0)

  return (
    <>
      {/* Backdrop para mobile */}
      {mobileOpen && (
        <div
          onClick={onMobileClose}
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
        />
      )}

      <aside
        className={cn(
          'flex flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-all duration-200 h-full shrink-0',
          // Desktop e Mobile
          'hidden md:flex',
          collapsed ? 'md:w-[68px]' : 'md:w-[244px]',
          'fixed inset-y-0 left-0 z-50 w-[244px] -translate-x-full md:relative md:translate-x-0',
          mobileOpen && 'flex translate-x-0 shadow-lg'
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-4 h-16 border-b border-sidebar-border">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shrink-0">
            <Scale className="h-5 w-5" />
          </div>
          {(!collapsed || mobileOpen) && (
            <div className="flex flex-col min-w-0">
              <span className="font-semibold text-[15px] leading-tight">JusFlow</span>
              <span className="text-[11px] text-muted-foreground leading-tight">
                Plataforma Jurídica
              </span>
            </div>
          )}
        </div>

        {/* Indicador de cargo */}
        {(!collapsed || mobileOpen) && (
          <div className="px-3 pt-3 pb-1">
            <div className="rounded-md bg-primary/8 border border-primary/15 px-2.5 py-1.5 flex items-center gap-2">
              <div className="h-5 w-5 rounded-full bg-primary/15 text-primary flex items-center justify-center text-[10px] font-bold shrink-0">
                {userRole?.charAt(0) || 'U'}
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-primary truncate">{userRole}</p>
                <p className="text-[9px] text-muted-foreground leading-tight truncate">
                  {userRole === 'Administrador' && 'Acesso total'}
                  {userRole === 'Sócio' && 'Gestão completa + relatórios'}
                  {userRole === 'Advogado' && 'Processos, clientes e finanças'}
                  {userRole === 'Estagiário' && 'Leitura e Copiloto IA'}
                  {userRole === 'Secretária' && 'Agenda, prazos e clientes'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 space-y-3 overflow-y-auto">
          {visibleGroups.map((group) => (
            <div key={group.label} className="space-y-0.5">
              {(!collapsed || mobileOpen) && (
                <p className="px-2.5 text-[10px] uppercase tracking-wider text-muted-foreground/70 font-semibold mb-1">
                  {group.label}
                </p>
              )}
              {group.items.map((item) => {
                const Icon = item.icon
                const isActive = current === item.id
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onNavigate(item.id)
                      if (onMobileClose) onMobileClose()
                    }}
                    title={collapsed ? item.label : undefined}
                    className={cn(
                      'group flex w-full items-center gap-3 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors',
                      'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                      isActive && 'bg-primary/10 text-primary font-medium',
                      (collapsed && !mobileOpen) && 'justify-center'
                    )}
                  >
                    <Icon
                      className={cn(
                        'h-[17px] w-[17px] shrink-0',
                        isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                      )}
                    />
                    {(!collapsed || mobileOpen) && <span className="truncate">{item.label}</span>}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-sidebar-border p-2 space-y-1">
          {(!collapsed || mobileOpen) && (
            <div className="rounded-lg bg-accent/40 p-3 text-[11px] text-muted-foreground">
              <p className="font-medium text-foreground mb-0.5">Plano Pro • Trial</p>
              <p>14 dias restantes • SaaS multi-escritório</p>
            </div>
          )}
          <button
            onClick={onToggleCollapse}
            className={cn(
              'flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-xs text-muted-foreground hover:bg-sidebar-accent hover:text-foreground transition-colors md:flex hidden',
              (collapsed && !mobileOpen) && 'justify-center'
            )}
          >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4" />
              <span>Recolher</span>
            </>
          )}
        </button>
      </div>
    </aside>
    </>
  )
}