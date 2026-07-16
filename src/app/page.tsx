'use client'

import { useState, useEffect, useCallback } from 'react'
import { Sidebar } from '@/components/sidebar'
import { TopBar } from '@/components/top-bar'
import { CommandPalette } from '@/components/command-palette'
import { LoginScreen } from '@/components/login-screen'
import { DashboardView } from '@/components/views/dashboard-view'
import { ProcessesView } from '@/components/views/processes-view'
import { ProcessDetail } from '@/components/views/process-detail'
import { ClientsView } from '@/components/views/clients-view'
import { DeadlinesView } from '@/components/views/deadlines-view'
import { TasksView } from '@/components/views/tasks-view'
import { FinancialView } from '@/components/views/financial-view'
import { CopilotView } from '@/components/views/copilot-view'
import { AgendaView } from '@/components/views/agenda-view'
import { TeamView } from '@/components/views/team-view'
import { AdminView } from '@/components/views/admin-view'
import { ReportsView } from '@/components/views/reports-view'
import { ContractsView } from '@/components/views/contracts-view'
import { AutomationsView } from '@/components/views/automations-view'
import { PortalView } from '@/components/views/portal-view'
import { NotificationsView } from '@/components/views/notifications-view'
import { AiJuridicaView } from '@/components/views/ai-juridica-view'
import { ConflictsView } from '@/components/views/conflicts-view'
import { AdminAuditView } from '@/components/views/audit-view'
import { canView } from '@/lib/permissions'
import { ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'

export type ViewName =
  | 'dashboard'
  | 'processes'
  | 'process-detail'
  | 'clients'
  | 'deadlines'
  | 'tasks'
  | 'financial'
  | 'copilot'
  | 'ai-juridica'
  | 'agenda'
  | 'team'
  | 'admin'
  | 'reports'
  | 'contracts'
  | 'documents'
  | 'automations'
  | 'portal'
  | 'notifications'
  | 'conflicts'
  | 'audit-log'

interface User {
  id: string
  name: string
  email: string
  role: string
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [view, setView] = useState<ViewName>('dashboard')
  const [selectedProcessId, setSelectedProcessId] = useState<string | null>(null)
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
  const [commandOpen, setCommandOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  // Persistir sessão
  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('jusflow_user') : null
    if (saved) {
      try { setUser(JSON.parse(saved)) } catch {}
    }
  }, [])

  const handleLogin = (u: User) => {
    setUser(u)
    if (typeof window !== 'undefined') localStorage.setItem('jusflow_user', JSON.stringify(u))
  }

  const handleLogout = () => {
    setUser(null)
    if (typeof window !== 'undefined') localStorage.removeItem('jusflow_user')
  }

  // Atalho Cmd+K
  useEffect(() => {
    if (!user) return
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCommandOpen((v) => !v)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [user])

  const navigate = useCallback((v: ViewName) => {
    if (!user) return
    const checkView = v === 'process-detail' ? 'processes' : v
    if (canView(user.role, checkView)) {
      setView(v)
    }
  }, [user])

  // Listener para eventos de navegação global
  useEffect(() => {
    if (!user) return
    const navigateHandler = (e: Event) => {
      const detail = (e as CustomEvent).detail as ViewName
      if (detail) navigate(detail)
    }
    window.addEventListener('navigate', navigateHandler)
    return () => {
      window.removeEventListener('navigate', navigateHandler)
    }
  }, [user, navigate])

  const openProcess = useCallback((id: string) => {
    setSelectedProcessId(id)
    setView('process-detail')
  }, [])

  const openClient = useCallback((id: string) => {
    setSelectedClientId(id)
    setView('clients')
  }, [])

  if (!user) {
    return <LoginScreen onLogin={handleLogin} />
  }

  // Portal do cliente é tela cheia (sem sidebar)
  if (view === 'portal') {
    if (!canView(user.role, 'portal')) {
      setView('dashboard')
      return null
    }
    return <PortalView />
  }

  // Tela de acesso negado
  const AccessDenied = () => (
    <div className="flex flex-col items-center justify-center flex-1 p-6 text-center">
      <div className="rounded-full bg-amber-100 dark:bg-amber-950/40 p-4 mb-4">
        <ShieldAlert className="h-8 w-8 text-amber-600 dark:text-amber-400" />
      </div>
      <h2 className="text-lg font-semibold mb-1">Acesso restrito</h2>
      <p className="text-sm text-muted-foreground max-w-sm">
        Seu cargo (<strong>{user.role}</strong>) não tem permissão para acessar este módulo.
        Solicite acesso ao administrador ou sócio do escritório.
      </p>
      <Button
        variant="outline"
        className="mt-4"
        onClick={() => setView('dashboard')}
      >
        Voltar ao Dashboard
      </Button>
    </div>
  )

  // Verifica permissão da view atual (exceto process-detail que é verificado via processes)
  const currentViewForCheck = view === 'process-detail' ? 'processes' : view
  if (!canView(user.role, currentViewForCheck)) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar
          current={view}
          onNavigate={navigate}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
          userRole={user.role}
          mobileOpen={mobileSidebarOpen}
          onMobileClose={() => setMobileSidebarOpen(false)}
        />
        <div className="flex flex-1 flex-col min-w-0">
          <TopBar
            onOpenSearch={() => setCommandOpen(true)}
            onOpenCopilot={() => setView('copilot')}
            view={view}
            user={user}
            onLogout={handleLogout}
            onToggleMobileSidebar={() => setMobileSidebarOpen((v) => !v)}
          />
          <AccessDenied />
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar
        current={view}
        onNavigate={navigate}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
        userRole={user.role}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />
      <div className="flex flex-1 flex-col min-w-0">
        <TopBar
          onOpenSearch={() => setCommandOpen(true)}
          onOpenCopilot={() => setView('copilot')}
          view={view}
          user={user}
          onLogout={handleLogout}
          onToggleMobileSidebar={() => setMobileSidebarOpen((v) => !v)}
        />
        <main className="flex-1 overflow-y-auto">
          {view === 'dashboard' && (
            <DashboardView onOpenProcess={openProcess} onNavigate={navigate} />
          )}
          {view === 'processes' && (
            <ProcessesView onOpenProcess={openProcess} onNavigate={navigate} />
          )}
          {view === 'process-detail' && selectedProcessId && (
            <ProcessDetail
              processId={selectedProcessId}
              onBack={() => setView('processes')}
              onOpenClient={openClient}
            />
          )}
          {view === 'clients' && (
            <ClientsView selectedId={selectedClientId} onOpenProcess={openProcess} />
          )}
          {view === 'deadlines' && <DeadlinesView onOpenProcess={openProcess} />}
          {view === 'tasks' && <TasksView onOpenProcess={openProcess} />}
          {view === 'financial' && <FinancialView userRole={user.role} user={user} />}
          {view === 'copilot' && (
            <CopilotView onOpenProcess={openProcess} onNavigate={navigate} />
          )}
          {view === 'ai-juridica' && <AiJuridicaView />}
          {view === 'agenda' && <AgendaView onOpenProcess={openProcess} />}
          {view === 'team' && <TeamView />}
          {view === 'admin' && <AdminView user={user} />}
          {view === 'reports' && <ReportsView />}
          {view === 'contracts' && <ContractsView />}
          {view === 'documents' && <DocumentsView />}
          {view === 'automations' && <AutomationsView />}
          {view === 'notifications' && <NotificationsView />}
          {view === 'conflicts' && <ConflictsView />}
          {view === 'audit-log' && <AdminAuditView user={user} />}
        </main>
      </div>

      <CommandPalette
        open={commandOpen}
        onOpenChange={setCommandOpen}
        onOpenProcess={openProcess}
        onNavigate={navigate}
      />
    </div>
  )
}

// Placeholder para DocumentsView
function DocumentsView() {
  return (
    <div className="p-5 md:p-6">
      <div className="rounded-lg border border-border p-12 text-center">
        <p className="text-sm text-muted-foreground">
          Módulo de documentos integrado aos processos e contratos. Acesse via detalhe do processo ou pelo módulo de Contratos.
        </p>
      </div>
    </div>
  )
}