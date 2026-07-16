// JusFlow - Sistema de Permissões por Cargo (Hierarquia)
// Cada cargo tem um nível de acesso. Cargos superiores herdam permissões dos inferiores.

export type RoleName = 'Administrador' | 'Sócio' | 'Advogado' | 'Estagiário' | 'Secretária'

// Nível hierárquico - quanto maior, mais acesso
const ROLE_LEVEL: Record<RoleName, number> = {
  'Estagiário': 1,
  'Secretária': 2,
  'Advogado': 3,
  'Sócio': 4,
  'Administrador': 5,
}

export function getRoleLevel(role: string): number {
  return ROLE_LEVEL[role as RoleName] || 0
}

// Módulos que cada cargo pode VER
const VIEW_ACCESS: Record<RoleName, string[]> = {
  'Estagiário': [
    'dashboard', 'processes', 'process-detail', 'deadlines', 'tasks', 'copilot',
  ],
  'Secretária': [
    'dashboard', 'clients', 'processes', 'process-detail', 'deadlines', 'tasks', 'agenda', 'notifications',
  ],
  'Advogado': [
    'dashboard', 'processes', 'process-detail', 'clients', 'deadlines', 'tasks',
    'financial', 'copilot', 'ai-juridica', 'agenda', 'notifications', 'documents', 'contracts',
  ],
  'Sócio': [
    'dashboard', 'processes', 'process-detail', 'clients', 'deadlines', 'tasks',
    'financial', 'copilot', 'ai-juridica', 'agenda', 'team', 'reports',
    'notifications', 'documents', 'contracts', 'automations', 'conflicts', 'audit-log',
  ],
  'Administrador': [
    'dashboard', 'processes', 'process-detail', 'clients', 'deadlines', 'tasks',
    'financial', 'copilot', 'ai-juridica', 'agenda', 'team', 'admin', 'reports',
    'notifications', 'documents', 'contracts', 'automations', 'conflicts', 'portal', 'audit-log',
  ],
}

// Ações que cada cargo pode EXECUTAR por módulo
type Permission = 'view' | 'create' | 'edit' | 'delete'

const MODULE_PERMISSIONS: Record<string, Record<RoleName, Permission[]>> = {
  // Processos
  processes: {
    'Estagiário': ['view'],
    'Secretária': ['view'],
    'Advogado': ['view', 'create', 'edit'],
    'Sócio': ['view', 'create', 'edit', 'delete'],
    'Administrador': ['view', 'create', 'edit', 'delete'],
  },
  // Clientes
  clients: {
    'Estagiário': ['view'],
    'Secretária': ['view', 'create', 'edit'],
    'Advogado': ['view', 'create', 'edit'],
    'Sócio': ['view', 'create', 'edit', 'delete'],
    'Administrador': ['view', 'create', 'edit', 'delete'],
  },
  // Prazos
  deadlines: {
    'Estagiário': ['view'],
    'Secretária': ['view', 'create', 'edit'],
    'Advogado': ['view', 'create', 'edit'],
    'Sócio': ['view', 'create', 'edit', 'delete'],
    'Administrador': ['view', 'create', 'edit', 'delete'],
  },
  // Tarefas
  tasks: {
    'Estagiário': ['view', 'create', 'edit'],
    'Secretária': ['view', 'create', 'edit'],
    'Advogado': ['view', 'create', 'edit', 'delete'],
    'Sócio': ['view', 'create', 'edit', 'delete'],
    'Administrador': ['view', 'create', 'edit', 'delete'],
  },
  // Financeiro - ESTAGIÁRIO e SECRETÁRIA só visualizam
  financial: {
    'Estagiário': ['view'],
    'Secretária': ['view'],
    'Advogado': ['view', 'create', 'edit'],
    'Sócio': ['view', 'create', 'edit', 'delete'],
    'Administrador': ['view', 'create', 'edit', 'delete'],
  },
  // Contratos
  contracts: {
    'Estagiário': ['view'],
    'Secretária': ['view'],
    'Advogado': ['view', 'create', 'edit'],
    'Sócio': ['view', 'create', 'edit', 'delete'],
    'Administrador': ['view', 'create', 'edit', 'delete'],
  },
  // Equipe - só Sócio e Admin gerenciam
  team: {
    'Estagiário': [],
    'Secretária': [],
    'Advogado': [],
    'Sócio': ['view', 'create', 'edit', 'delete'],
    'Administrador': ['view', 'create', 'edit', 'delete'],
  },
  // Admin - só Administrador
  admin: {
    'Estagiário': [],
    'Secretária': [],
    'Advogado': [],
    'Sócio': ['view'],
    'Administrador': ['view', 'create', 'edit', 'delete'],
  },
  // Relatórios
  reports: {
    'Estagiário': [],
    'Secretária': [],
    'Advogado': [],
    'Sócio': ['view'],
    'Administrador': ['view', 'create', 'edit', 'delete'],
  },
  // Automações
  automations: {
    'Estagiário': [],
    'Secretária': [],
    'Advogado': [],
    'Sócio': ['view', 'create', 'edit', 'delete'],
    'Administrador': ['view', 'create', 'edit', 'delete'],
  },
  // Conflitos
  conflicts: {
    'Estagiário': [],
    'Secretária': [],
    'Advogado': [],
    'Sócio': ['view'],
    'Administrador': ['view'],
  },
  // Portal do cliente - só admin configura
  portal: {
    'Estagiário': [],
    'Secretária': [],
    'Advogado': [],
    'Sócio': ['view'],
    'Administrador': ['view', 'create', 'edit', 'delete'],
  },
  // IA - todos que tem acesso podem usar
  copilot: {
    'Estagiário': ['view'],
    'Secretária': [],
    'Advogado': ['view'],
    'Sócio': ['view'],
    'Administrador': ['view'],
  },
  'ai-juridica': {
    'Estagiário': [],
    'Secretária': [],
    'Advogado': ['view'],
    'Sócio': ['view'],
    'Administrador': ['view'],
  },
  // Agenda
  agenda: {
    'Estagiário': [],
    'Secretária': ['view'],
    'Advogado': ['view', 'create', 'edit'],
    'Sócio': ['view', 'create', 'edit', 'delete'],
    'Administrador': ['view', 'create', 'edit', 'delete'],
  },
  // Documentos
  documents: {
    'Estagiário': [],
    'Secretária': [],
    'Advogado': ['view'],
    'Sócio': ['view', 'create', 'edit', 'delete'],
    'Administrador': ['view', 'create', 'edit', 'delete'],
  },
  // Dashboard - todos veem
  dashboard: {
    'Estagiário': ['view'],
    'Secretária': ['view'],
    'Advogado': ['view'],
    'Sócio': ['view'],
    'Administrador': ['view'],
  },
  // Notificações
  notifications: {
    'Estagiário': ['view'],
    'Secretária': ['view'],
    'Advogado': ['view'],
    'Sócio': ['view'],
    'Administrador': ['view'],
  },
  // Log de Auditoria - só Sócio e Admin
  'audit-log': {
    'Estagiário': [],
    'Secretária': [],
    'Advogado': [],
    'Sócio': ['view'],
    'Administrador': ['view'],
  },
}

// Verifica se um cargo pode ver determinada view (módulo)
export function canView(role: string, viewName: string): boolean {
  const roleKey = role as RoleName
  if (!VIEW_ACCESS[roleKey]) return false
  return VIEW_ACCESS[roleKey].includes(viewName)
}

// Verifica se um cargo pode executar uma ação em um módulo
export function hasPermission(role: string, module: string, action: Permission): boolean {
  const roleKey = role as RoleName
  const modPerms = MODULE_PERMISSIONS[module]
  if (!modPerms) return false
  const perms = modPerms[roleKey]
  if (!perms) return false
  return perms.includes(action)
}

// Label bonito para o cargo
export function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    'Administrador': 'Administrador',
    'Sócio': 'Sócio',
    'Advogado': 'Advogado',
    'Estagiário': 'Estagiário',
    'Secretária': 'Secretária',
  }
  return labels[role] || role
}

// Descrição do nível de acesso do cargo
export function getRoleDescription(role: string): string {
  const descs: Record<string, string> = {
    'Administrador': 'Acesso total ao sistema. Pode gerenciar planos, usuários e configurações.',
    'Sócio': 'Acesso completo à operação. Pode ver relatórios, gerenciar equipe e finanças.',
    'Advogado': 'Pode gerenciar processos, clientes, prazos, tarefas e lançamentos financeiros.',
    'Estagiário': 'Acesso somente leitura a processos, prazos e tarefas. Pode usar o Copiloto IA.',
    'Secretária': 'Pode gerenciar clientes, prazos, tarefas e agenda. Sem acesso a financeiro.',
  }
  return descs[role] || ''
}