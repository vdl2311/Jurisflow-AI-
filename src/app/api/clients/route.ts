import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest, logAuditSync } from '@/lib/audit'

// GET /api/clients - lista com filtros opcionais
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') || ''
  const status = searchParams.get('status') || ''

  const where: Record<string, unknown> = {}
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { document: { contains: search } },
      { email: { contains: search } },
    ]
  }
  if (status && status !== 'Todos') where.status = status

  const clients = await db.client.findMany({
    where,
    include: {
      _count: {
        select: { processes: true, tasks: true, financials: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(clients)
}

// POST /api/clients - criar
export async function POST(req: NextRequest) {
  const user = getUserFromRequest(req)
  const body = await req.json()

  const client = await db.client.create({
    data: {
      name: body.name,
      type: body.type || 'PF',
      document: body.document,
      email: body.email,
      phone: body.phone,
      mobile: body.mobile,
      address: body.address,
      city: body.city,
      state: body.state,
      zipCode: body.zipCode,
      status: body.status || 'Prospect',
      tags: body.tags,
      notes: body.notes,
    },
  })

  logAuditSync({
    userName: user.name,
    userEmail: user.email,
    userRole: user.role,
    action: 'CREATE',
    entity: 'Client',
    entityId: client.id,
    details: `Cliente criado: ${client.name} (${client.type}) | Doc: ${client.document || 'N/A'} | Status: ${client.status}`,
    newValues: JSON.stringify({ name: client.name, type: client.type, document: client.document, status: client.status }),
  })

  return NextResponse.json(client, { status: 201 })
}

// PATCH /api/clients?id=xxx - atualizar
export async function PATCH(req: NextRequest) {
  const user = getUserFromRequest(req)
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const old = await db.client.findUnique({ where: { id } })
  if (!old) return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 })

  const body = await req.json()
  const updated = await db.client.update({
    where: { id },
    data: body,
  })

  const changes: string[] = []
  if (body.name && body.name !== old.name) changes.push(`nome: ${old.name} → ${body.name}`)
  if (body.status && body.status !== old.status) changes.push(`status: ${old.status} → ${body.status}`)
  if (body.email && body.email !== old.email) changes.push('e-mail alterado')

  logAuditSync({
    userName: user.name,
    userEmail: user.email,
    userRole: user.role,
    action: 'UPDATE',
    entity: 'Client',
    entityId: id,
    details: `Cliente atualizado: ${old.name} | Alterações: ${changes.join(', ') || 'dados gerais'}`,
    oldValues: JSON.stringify({ name: old.name, status: old.status, email: old.email }),
    newValues: JSON.stringify(body),
  })

  return NextResponse.json(updated)
}

// DELETE /api/clients?id=xxx
export async function DELETE(req: NextRequest) {
  const user = getUserFromRequest(req)
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const client = await db.client.findUnique({
    where: { id },
    include: { _count: { select: { processes: true, financials: true, tasks: true } } },
  })
  if (!client) return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 })

  await db.client.delete({ where: { id } })

  logAuditSync({
    userName: user.name,
    userEmail: user.email,
    userRole: user.role,
    action: 'DELETE',
    entity: 'Client',
    entityId: id,
    details: `CLIENTE EXCLUÍDO: ${client.name} (${client.type}) | Doc: ${client.document || 'N/A'} | Cidade: ${client.city || 'N/A'} | Processos vinculados: ${client._count.processes} | Lançamentos financeiros: ${client._count.financials} | Tarefas: ${client._count.tasks}`,
    oldValues: JSON.stringify(client),
  })

  return NextResponse.json({ success: true })
}