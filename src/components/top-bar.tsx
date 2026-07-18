'use client'

import { Search, Sparkles, Bell, Sun, Moon, LogOut, Menu } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import type { ViewName } from '@/app/page'

interface TopBarProps {
  onOpenSearch: () => void
  onOpenCopilot: () => void
  view: ViewName
  user?: { id: string; name: string; email: string; role: string } | null
  onLogout?: () => void
  onToggleMobileSidebar?: () => void
}

const titles: Record<ViewName, { title: string; subtitle: string }> = {
  dashboard: { title: 'Dashboard', subtitle: 'Visão acionável do seu escritório' },
  processes: { title: 'Processos', subtitle: 'Casos, andamentos e timeline' },
  'process-detail': { title: 'Detalhe do Processo', subtitle: 'Timeline unificada' },
  clients: { title: 'Clientes', subtitle: 'CRM jurídico' },
  deadlines: { title: 'Prazos', subtitle: 'Prazos fatais e internos' },
  tasks: { title: 'Tarefas', subtitle: 'Kanban da equipe' },
  financial: { title: 'Financeiro', subtitle: 'Honorários, custas e fluxo de caixa' },
  copilot: { title: 'Copiloto Jurídico', subtitle: 'Converse com a IA sobre seus casos' },
  'ai-juridica': { title: 'IA Jurídica', subtitle: 'Geração de petições, revisão e jurisprudência' },
  agenda: { title: 'Agenda Jurídica', subtitle: 'Audiências, prazos e compromissos' },
  team: { title: 'Equipe', subtitle: 'Usuários, cargos e permissões' },
  admin: { title: 'Painel Administrativo', subtitle: 'Planos, uso, logs e métricas' },
  reports: { title: 'Relatórios', subtitle: 'Múltiplos relatórios gerenciais' },
  contracts: { title: 'Contratos & Documentos', subtitle: 'Modelos, geração e assinatura eletrônica' },
  documents: { title: 'Documentos', subtitle: 'Gestão de arquivos' },
  automations: { title: 'Automações', subtitle: 'Workflows e gatilhos automáticos' },
  portal: { title: 'Portal do Cliente', subtitle: 'Área do cliente' },
  notifications: { title: 'Notificações', subtitle: 'Alertas e avisos do sistema' },
  conflicts: { title: 'Conflitos de Interesse', subtitle: 'Verificação conforme OAB' },
  'audit-log': { title: 'Log de Auditoria', subtitle: 'Registro completo de ações no sistema' },
  datajud: { title: 'DataJud (CNJ)', subtitle: 'Consulta pública de processos em todos os tribunais' },
  agents: { title: 'Agentes Jurídicos IA', subtitle: 'Agentes autônomos com Supervisory AI' },
  knowledge: { title: 'Base de Conhecimento', subtitle: 'Jurisprudência, teses e casos acumulados' },
  compliance: { title: 'Conformidade & Compliance', subtitle: 'Verificação automática LGPD, OAB e padrões' },
}

export function TopBar({ onOpenSearch, onOpenCopilot, view, user, onLogout, onToggleMobileSidebar }: TopBarProps) {
  const [dark, setDark] = useState(false)
  const [alertas, setAlertas] = useState(0)

  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark')
    setDark(isDark)
  }, [])

  useEffect(() => {
    fetch('/api/notifications')
      .then((r) => r.json())
      .then((d) => {
        const n = (d || []).filter((n: any) => !n.read && ['Crítica', 'Alta'].includes(n.priority)).length
        setAlertas(n)
      })
      .catch(() => {})
  }, [view])

  const toggleDark = () => {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
  }

  const meta = titles[view]
  const initials = user?.name.split(' ').slice(0, 2).map((p) => p[0]).join('') || 'U'

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/80 backdrop-blur px-5">
      {onToggleMobileSidebar && (
        <button
          onClick={onToggleMobileSidebar}
          className="md:hidden p-2 -ml-2 rounded-md hover:bg-muted text-muted-foreground"
          aria-label="Menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      )}
      <div className="flex-1 min-w-0">
        <h1 className="text-[17px] font-semibold leading-tight truncate">{meta.title}</h1>
        <p className="text-[12px] text-muted-foreground leading-tight truncate">{meta.subtitle}</p>
      </div>

      {/* Search trigger */}
      <button
        onClick={onOpenSearch}
        className="hidden md:flex items-center gap-2.5 w-64 lg:w-80 rounded-md border border-input bg-muted/40 px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted transition-colors"
      >
        <Search className="h-4 w-4" />
        <span className="flex-1 text-left">Buscar em tudo...</span>
        <kbd className="rounded border bg-background px-1.5 py-0.5 text-[10px] font-mono">⌘K</kbd>
      </button>

      <Button
        onClick={onOpenCopilot}
        size="sm"
        className="hidden sm:flex gap-1.5 bg-primary hover:bg-primary/90"
      >
        <Sparkles className="h-4 w-4" />
        <span className="hidden lg:inline">Copiloto</span>
      </Button>

      <button
        onClick={onOpenSearch}
        className="md:hidden p-2 rounded-md hover:bg-muted"
        aria-label="Buscar"
      >
        <Search className="h-5 w-5" />
      </button>

      <button
        className="relative p-2 rounded-md hover:bg-muted"
        aria-label="Notificações"
        title={`${alertas} alertas`}
        onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'notifications' }))}
      >
        <Bell className="h-5 w-5" />
        {alertas > 0 && (
          <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-medium text-destructive-foreground">
            {alertas}
          </span>
        )}
      </button>

      <button
        onClick={toggleDark}
        className="p-2 rounded-md hover:bg-muted"
        aria-label="Alternar tema"
        title="Alternar tema claro/escuro"
      >
        {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </button>

      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-2 pl-2 border-l border-border outline-none">
          <div className="h-8 w-8 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xs font-semibold">
            {initials}
          </div>
          <div className="hidden sm:flex flex-col text-[11px] leading-tight text-left">
            <span className="font-medium">{user?.name || 'Usuário'}</span>
            <span className="text-muted-foreground">{user?.role || ''}</span>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <p className="font-medium">{user?.name}</p>
            <p className="text-[11px] text-muted-foreground font-normal">{user?.email}</p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <Menu className="h-4 w-4 mr-2" /> Meu perfil
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'team' }))}>
            <Sparkles className="h-4 w-4 mr-2" /> Configurar 2FA
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onLogout} className="text-destructive">
            <LogOut className="h-4 w-4 mr-2" /> Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
