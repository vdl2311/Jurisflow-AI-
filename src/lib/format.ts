// Utilitários de formatação para pt-BR

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value || 0)
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '-'
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function formatDateShort(date: string | Date | null | undefined): string {
  if (!date) return '-'
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '-'
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function daysUntil(date: string | Date): number {
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const d = typeof date === 'string' ? new Date(date) : date
  d.setHours(0, 0, 0, 0)
  return Math.floor((d.getTime() - hoje.getTime()) / 86400000)
}

export function relativeDate(date: string | Date): string {
  const dias = daysUntil(date)
  if (dias === 0) return 'Hoje'
  if (dias === 1) return 'Amanhã'
  if (dias === -1) return 'Ontem'
  if (dias > 0 && dias <= 7) return `Em ${dias} dias`
  if (dias < 0) return `Há ${Math.abs(dias)} dias`
  return formatDate(date)
}

export function priorityColor(priority: string): string {
  switch (priority) {
    case 'Crítica':
      return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-900'
    case 'Alta':
      return 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-900'
    case 'Média':
      return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-900'
    case 'Baixa':
      return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200'
  }
}

export function statusColor(status: string): string {
  switch (status) {
    case 'Ativo':
    case 'Pago':
    case 'Concluída':
      return 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-900'
    case 'Pendente':
    case 'Em Andamento':
    case 'Em Revisão':
    case 'A Fazer':
    case 'Prospect':
      return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-900'
    case 'Atrasado':
      return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-900'
    case 'Inativo':
    case 'Encerrado':
    case 'Arquivado':
      return 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200'
  }
}

export function riskColor(risk: string): string {
  switch (risk) {
    case 'Alto':
      return 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
    case 'Médio':
      return 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
    case 'Baixo':
      return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
    default:
      return 'bg-slate-100 text-slate-700'
  }
}

export function timelineColor(tipo: string): string {
  switch (tipo) {
    case 'Movimento':
      return 'bg-slate-500'
    case 'Prazo':
      return 'bg-amber-500'
    case 'Tarefa':
      return 'bg-purple-500'
    case 'Receita':
      return 'bg-emerald-500'
    case 'Despesa':
      return 'bg-red-500'
    case 'Documento':
      return 'bg-blue-500'
    default:
      return 'bg-slate-500'
  }
}

export function timelineIcon(tipo: string): string {
  switch (tipo) {
    case 'Movimento':
      return 'FileText'
    case 'Prazo':
      return 'AlarmClock'
    case 'Tarefa':
      return 'CheckSquare'
    case 'Receita':
      return 'ArrowUpCircle'
    case 'Despesa':
      return 'ArrowDownCircle'
    case 'Documento':
      return 'FolderOpen'
    default:
      return 'Circle'
  }
}
