import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

// GET /api/audit - logs de auditoria com filtros avançados
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const user = searchParams.get('user') || ''
  const action = searchParams.get('action') || ''
  const entity = searchParams.get('entity') || ''
  const search = searchParams.get('search') || ''
  const page = parseInt(searchParams.get('page') || '1', 10)
  const limit = parseInt(searchParams.get('limit') || '50', 10)
  const deletionsOnly = searchParams.get('deletions') === 'true'

  const where: Prisma.AuditLogWhereInput = {}

  if (user) {
    where.user = { contains: user }
  }
  if (action) {
    where.action = action
  }
  if (entity) {
    where.entity = entity
  }
  if (deletionsOnly) {
    where.action = 'DELETE'
  }
  if (search) {
    where.OR = [
      { details: { contains: search } },
      { user: { contains: search } },
      { entity: { contains: search } },
    ]
  }

  const skip = (page - 1) * limit

  const [logs, total] = await Promise.all([
    db.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    db.auditLog.count({ where }),
  ])

  // Estatísticas rápidas
  const [totalDeletions, totalByUser] = await Promise.all([
    db.auditLog.count({ where: { action: 'DELETE' } }),
    db.auditLog.groupBy({
      by: ['user'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    }),
  ])

  return NextResponse.json({
    logs,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
    stats: {
      totalDeletions,
      topUsers: totalByUser.map(u => ({ user: u.user, count: u._count.id })),
    },
  })
}