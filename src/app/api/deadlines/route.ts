import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest, logAuditSync } from '@/lib/audit'

// GET /api/deadlines - lista de prazos com filtros
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const periodo = searchParams.get('periodo') || 'todos'
  const done = searchParams.get('done')

  const hoje = new Date()
  const inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())
  const fimHoje = new Date(inicioHoje.getTime() + 86400000)

  const where: Record<string, unknown> = {}
  if (done === 'false') where.done = false
  if (done === 'true') where.done = true

  if (periodo === 'hoje') {
    where.dueDate = { gte: inicioHoje, lt: fimHoje }
  } else if (periodo === '7dias') {
    where.dueDate = {
      gte: inicioHoje,
      lte: new Date(hoje.getTime() + 7 * 86400000),
    }
  } else if (periodo === '30dias') {
    where.dueDate = {
      gte: inicioHoje,
      lte: new Date(hoje.getTime() + 30 * 86400000),
    }
  } else if (periodo === 'atrasados') {
    where.dueDate = { lt: inicioHoje }
    where.done = false
  }

  const deadlines = await db.deadline.findMany({
    where,
    include: { process: { include: { client: true } } },
    orderBy: { dueDate: 'asc' },
  })

  return NextResponse.json(deadlines)
}

// POST /api/deadlines
export async function POST(req: NextRequest) {
  const user = getUserFromRequest(req)
  const body = await req.json()

  const deadline = await db.deadline.create({
    data: {
      processId: body.processId,
      title: body.title,
      dueDate: new Date(body.dueDate),
      type: body.type || 'Interno',
      priority: body.priority || 'Média',
      responsible: body.responsible,
      notes: body.notes,
    },
  })

  await db.timelineEntry.create({
    data: {
      processId: body.processId,
      date: deadline.dueDate,
      type: 'Prazo',
      title: `Prazo: ${deadline.title}`,
      description: `${deadline.type} | ${deadline.priority}`,
    },
  })

  logAuditSync({
    userName: user.name,
    userEmail: user.email,
    userRole: user.role,
    action: 'CREATE',
    entity: 'Deadline',
    entityId: deadline.id,
    details: `Prazo criado: ${deadline.title} | Tipo: ${deadline.type} | Prioridade: ${deadline.priority} | Vencimento: ${deadline.dueDate.toLocaleDateString('pt-BR')} | Responsável: ${deadline.responsible || 'N/A'}`,
    newValues: JSON.stringify({ title: deadline.title, type: deadline.type, priority: deadline.priority, dueDate: body.dueDate }),
  })

  return NextResponse.json(deadline, { status: 201 })
}

// PATCH /api/deadlines?id=xxx
export async function PATCH(req: NextRequest) {
  const user = getUserFromRequest(req)
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const old = await db.deadline.findUnique({ where: { id }, include: { process: true } })
  if (!old) return NextResponse.json({ error: 'Prazo não encontrado' }, { status: 404 })

  const body = await req.json()
  const allowedFields: Record<string, unknown> = {}
  for (const f of ['title', 'type', 'priority', 'responsible', 'done', 'notes', 'processId']) {
    if (body[f] !== undefined) allowedFields[f] = body[f]
  }
  if (body.dueDate) allowedFields.dueDate = new Date(body.dueDate)

  const updated = await db.deadline.update({
    where: { id },
    data: allowedFields,
  })

  const changes: string[] = []
  if (body.done !== undefined && body.done !== old.done) changes.push(body.done ? 'marcado como concluído' : 'reaberto')
  if (body.priority && body.priority !== old.priority) changes.push(`prioridade: ${old.priority} → ${body.priority}`)

  logAuditSync({
    userName: user.name,
    userEmail: user.email,
    userRole: user.role,
    action: 'UPDATE',
    entity: 'Deadline',
    entityId: id,
    details: `Prazo atualizado: ${old.title} | Alterações: ${changes.join(', ') || 'dados gerais'} | Processo: ${old.process?.title || 'N/A'}`,
    oldValues: JSON.stringify({ title: old.title, done: old.done, priority: old.priority }),
    newValues: JSON.stringify(body),
  })

  return NextResponse.json(updated)
}

// DELETE /api/deadlines?id=xxx
export async function DELETE(req: NextRequest) {
  const user = getUserFromRequest(req)
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const deadline = await db.deadline.findUnique({
    where: { id },
    include: { process: true },
  })
  if (!deadline) return NextResponse.json({ error: 'Prazo não encontrado' }, { status: 404 })

  await db.deadline.delete({ where: { id } })

  logAuditSync({
    userName: user.name,
    userEmail: user.email,
    userRole: user.role,
    action: 'DELETE',
    entity: 'Deadline',
    entityId: id,
    details: `PRAZO EXCLUÍDO: ${deadline.title} | Tipo: ${deadline.type} | Prioridade: ${deadline.priority} | Vencimento: ${deadline.dueDate.toLocaleDateString('pt-BR')} | Responsável: ${deadline.responsible || 'N/A'} | Processo: ${deadline.process?.title || 'N/A'}`,
    oldValues: JSON.stringify(deadline),
  })

  return NextResponse.json({ ok: true })
}