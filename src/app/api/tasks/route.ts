import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest, logAuditSync } from '@/lib/audit'

// GET /api/tasks
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const assignee = searchParams.get('assignee')

  const where: Record<string, unknown> = {}
  if (status && status !== 'Todas') where.status = status
  if (assignee && assignee !== 'Todos') where.assignee = assignee

  const tasks = await db.task.findMany({
    where,
    include: { process: true, client: true },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(tasks)
}

// POST /api/tasks
export async function POST(req: NextRequest) {
  const user = getUserFromRequest(req)
  const body = await req.json()

  const task = await db.task.create({
    data: {
      title: body.title,
      description: body.description,
      status: body.status || 'A Fazer',
      priority: body.priority || 'Média',
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      assignee: body.assignee,
      processId: body.processId || null,
      clientId: body.clientId || null,
    },
  })

  logAuditSync({
    userName: user.name,
    userEmail: user.email,
    userRole: user.role,
    action: 'CREATE',
    entity: 'Task',
    entityId: task.id,
    details: `Tarefa criada: ${task.title} | Prioridade: ${task.priority} | Responsável: ${task.assignee || 'N/A'}`,
    newValues: JSON.stringify({ title: task.title, priority: task.priority, assignee: task.assignee }),
  })

  return NextResponse.json(task, { status: 201 })
}

// PATCH /api/tasks?id=xxx
export async function PATCH(req: NextRequest) {
  const user = getUserFromRequest(req)
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const old = await db.task.findUnique({ where: { id } })
  if (!old) return NextResponse.json({ error: 'Tarefa não encontrada' }, { status: 404 })

  const body = await req.json()
  const updated = await db.task.update({
    where: { id },
    data: {
      ...body,
      dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
    },
  })

  const changes: string[] = []
  if (body.status && body.status !== old.status) changes.push(`status: ${old.status} → ${body.status}`)
  if (body.priority && body.priority !== old.priority) changes.push(`prioridade: ${old.priority} → ${body.priority}`)
  if (body.title && body.title !== old.title) changes.push('título alterado')
  if (body.assignee && body.assignee !== old.assignee) changes.push(`responsável: ${old.assignee || 'N/A'} → ${body.assignee}`)

  logAuditSync({
    userName: user.name,
    userEmail: user.email,
    userRole: user.role,
    action: 'UPDATE',
    entity: 'Task',
    entityId: id,
    details: `Tarefa atualizada: ${old.title} | Alterações: ${changes.join(', ') || 'dados gerais'}`,
    oldValues: JSON.stringify({ title: old.title, status: old.status, priority: old.priority }),
    newValues: JSON.stringify(body),
  })

  return NextResponse.json(updated)
}

// DELETE /api/tasks?id=xxx
export async function DELETE(req: NextRequest) {
  const user = getUserFromRequest(req)
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const task = await db.task.findUnique({
    where: { id },
    include: { process: true, client: true },
  })
  if (!task) return NextResponse.json({ error: 'Tarefa não encontrada' }, { status: 404 })

  await db.task.delete({ where: { id } })

  logAuditSync({
    userName: user.name,
    userEmail: user.email,
    userRole: user.role,
    action: 'DELETE',
    entity: 'Task',
    entityId: id,
    details: `TAREFA EXCLUÍDA: ${task.title} | Status: ${task.status} | Prioridade: ${task.priority} | Responsável: ${task.assignee || 'N/A'} | Processo: ${task.process?.title || 'N/A'} | Cliente: ${task.client?.name || 'N/A'}`,
    oldValues: JSON.stringify({ title: task.title, status: task.status, priority: task.priority, assignee: task.assignee }),
  })

  return NextResponse.json({ ok: true })
}