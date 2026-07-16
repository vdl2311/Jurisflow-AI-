// JusFlow - Helper de Auditoria
// Registra quem fez o quê, quando, e em qual entidade
import { db } from './db'

export interface AuditPayload {
  userName: string
  userEmail: string
  userRole: string
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'EXPORT' | 'VIEW'
  entity: string
  entityId?: string
  details: string
  oldValues?: string   // JSON com valores anteriores (útil para UPDATE/DELETE)
  newValues?: string   // JSON com novos valores (útil para CREATE/UPDATE)
}

/**
 * Extrai userInfo do header X-User-Info (JSON enviado pelo frontend)
 */
export function getUserFromRequest(req: Request): { name: string; email: string; role: string } {
  const header = req.headers.get('x-user-info')
  if (header) {
    try {
      const parsed = JSON.parse(header)
      return {
        name: parsed.name || 'Desconhecido',
        email: parsed.email || '',
        role: parsed.role || 'N/A',
      }
    } catch {
      // header inválido
    }
  }
  return { name: 'Sistema', email: '', role: '' }
}

/**
 * Registra uma entrada no log de auditoria de forma assíncrona (fire-and-forget)
 * Não bloqueia a resposta da API
 */
export async function logAudit(payload: AuditPayload): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        user: payload.userName,
        action: payload.action,
        entity: payload.entity,
        entityId: payload.entityId || null,
        details: payload.details,
      },
    })
  } catch (err) {
    // Nunca falha a requisição principal por causa do log
    console.error('[AuditLog] Falha ao registrar:', err)
  }
}

/**
 * Versão síncrona simplificada - uso nos casos onde não precisa esperar
 */
export function logAuditSync(payload: AuditPayload): void {
  logAudit(payload).catch(() => {})
}