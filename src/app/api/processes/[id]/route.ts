import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest, logAuditSync } from '@/lib/audit'

// GET /api/processes/[id] - detalhe completo com timeline
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const proc = await db.process.findUnique({
    where: { id },
    include: {
      client: true,
      movements: { orderBy: { date: 'desc' } },
      deadlines: { orderBy: { dueDate: 'asc' } },
      tasks: { orderBy: { createdAt: 'desc' } },
      financials: { orderBy: { dueDate: 'asc' } },
      documents: { orderBy: { createdAt: 'desc' } },
    },
  })

  if (!proc) return NextResponse.json({ error: 'Processo não encontrado' }, { status: 404 })

  // Timeline unificada
  const timeline: {
    date: Date
    type: string
    title: string
    description: string | null
    color: string
  }[] = []

  for (const m of proc.movements) {
    timeline.push({
      date: m.date,
      type: 'Movimento',
      title: m.description,
      description: m.summary,
      color: m.important ? 'red' : 'slate',
    })
  }
  for (const d of proc.deadlines) {
    timeline.push({
      date: d.dueDate,
      type: 'Prazo',
      title: d.title,
      description: `${d.type} | ${d.priority}${d.responsible ? ' | ' + d.responsible : ''}`,
      color: d.priority === 'Crítica' ? 'red' : d.priority === 'Alta' ? 'orange' : 'blue',
    })
  }
  for (const t of proc.tasks) {
    timeline.push({
      date: t.createdAt,
      type: 'Tarefa',
      title: t.title,
      description: t.description,
      color: 'purple',
    })
  }
  for (const f of proc.financials) {
    timeline.push({
      date: f.dueDate,
      type: f.type,
      title: `${f.type}: ${f.description}`,
      description: `R$ ${f.amount.toFixed(2)} - ${f.status}`,
      color: f.type === 'Receita' ? 'green' : 'red',
    })
  }

  timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return NextResponse.json({ ...proc, timeline })
}

// PATCH /api/processes/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = getUserFromRequest(req)
  const { id } = await params
  const body = await req.json()

  // Buscar antes de atualizar
  const old = await db.process.findUnique({ where: { id }, include: { client: true } })
  if (!old) return NextResponse.json({ error: 'Processo não encontrado' }, { status: 404 })

  // Mapear apenas campos permitidos
  const allowedFields: Record<string, unknown> = {}
  const fieldMap = [
    'cnj', 'title', 'court', 'section', 'classType', 'subject', 'parties',
    'status', 'area', 'responsibleId', 'risk',
  ]
  for (const f of fieldMap) {
    if (body[f] !== undefined) allowedFields[f] = body[f]
  }
  if (body.caseValue !== undefined) allowedFields.caseValue = Number(body.caseValue)

  const proc = await db.process.update({
    where: { id },
    data: allowedFields,
  })

  const changes: string[] = []
  if (body.status && body.status !== old.status) changes.push(`status: ${old.status} → ${body.status}`)
  if (body.title && body.title !== old.title) changes.push('título alterado')
  if (body.area && body.area !== old.area) changes.push(`área: ${old.area} → ${body.area}`)
  if (body.risk && body.risk !== old.risk) changes.push(`risco: ${old.risk} → ${body.risk}`)

  logAuditSync({
    userName: user.name,
    userEmail: user.email,
    userRole: user.role,
    action: 'UPDATE',
    entity: 'Process',
    entityId: id,
    details: `Processo atualizado: ${old.title} | Alterações: ${changes.join(', ') || 'dados gerais'}`,
    oldValues: JSON.stringify({ title: old.title, status: old.status, area: old.area, risk: old.risk }),
    newValues: JSON.stringify(body),
  })

  return NextResponse.json(proc)
}

// POST removido - use /api/processes/[id]/movements para adicionar andamentos