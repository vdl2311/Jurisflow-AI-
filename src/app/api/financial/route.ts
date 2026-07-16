import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest, logAuditSync } from '@/lib/audit'

// GET /api/financial
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type') // Receita, Despesa
  const status = searchParams.get('status')

  const where: Record<string, unknown> = {}
  if (type && type !== 'Todos') where.type = type
  if (status && status !== 'Todos') where.status = status

  const items = await db.financial.findMany({
    where,
    include: { client: true, process: true },
    orderBy: { dueDate: 'desc' },
  })

  return NextResponse.json(items)
}

// POST /api/financial
export async function POST(req: NextRequest) {
  const user = getUserFromRequest(req)
  const body = await req.json()

  const fin = await db.financial.create({
    data: {
      type: body.type,
      category: body.category,
      description: body.description,
      amount: Number(body.amount),
      dueDate: new Date(body.dueDate),
      paidDate: body.paidDate ? new Date(body.paidDate) : null,
      status: body.status || 'Pendente',
      processId: body.processId || null,
      clientId: body.clientId || null,
    },
  })

  logAuditSync({
    userName: user.name,
    userEmail: user.email,
    userRole: user.role,
    action: 'CREATE',
    entity: 'Financial',
    entityId: fin.id,
    details: `Lançamento financeiro: ${body.type} - ${body.description} - R$ ${Number(body.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} [${body.category}] Status: ${body.status || 'Pendente'}`,
    newValues: JSON.stringify(body),
  })

  return NextResponse.json(fin, { status: 201 })
}

// PATCH /api/financial?id=xxx
export async function PATCH(req: NextRequest) {
  const user = getUserFromRequest(req)
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  // Buscar valores antigos antes de atualizar
  const old = await db.financial.findUnique({ where: { id } })
  if (!old) return NextResponse.json({ error: 'Lançamento não encontrado' }, { status: 404 })

  const body = await req.json()
  const updated = await db.financial.update({
    where: { id },
    data: {
      ...body,
      amount: body.amount !== undefined ? Number(body.amount) : undefined,
      dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
      paidDate: body.paidDate ? new Date(body.paidDate) : body.paidDate === null ? null : undefined,
    },
  })

  const changes: string[] = []
  if (body.status && body.status !== old.status) changes.push(`status: ${old.status} → ${body.status}`)
  if (body.amount !== undefined && Number(body.amount) !== old.amount) changes.push(`valor: R$ ${old.amount.toFixed(2)} → R$ ${Number(body.amount).toFixed(2)}`)
  if (body.description && body.description !== old.description) changes.push('descrição alterada')

  logAuditSync({
    userName: user.name,
    userEmail: user.email,
    userRole: user.role,
    action: 'UPDATE',
    entity: 'Financial',
    entityId: id,
    details: `Lançamento atualizado: ${old.description} | Alterações: ${changes.join(', ') || 'sem mudanças'}`,
    oldValues: JSON.stringify({ status: old.status, amount: old.amount, description: old.description }),
    newValues: JSON.stringify(body),
  })

  return NextResponse.json(updated)
}

// DELETE /api/financial?id=xxx
export async function DELETE(req: NextRequest) {
  const user = getUserFromRequest(req)
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  // Buscar antes de excluir para registrar nos logs
  const item = await db.financial.findUnique({
    where: { id },
    include: { client: true, process: true },
  })
  if (!item) return NextResponse.json({ error: 'Lançamento não encontrado' }, { status: 404 })

  await db.financial.delete({ where: { id } })

  logAuditSync({
    userName: user.name,
    userEmail: user.email,
    userRole: user.role,
    action: 'DELETE',
    entity: 'Financial',
    entityId: id,
    details: `LANÇAMENTO EXCLUÍDO: ${item.type} - ${item.description} - R$ ${item.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} | Categoria: ${item.category} | Status: ${item.status} | Cliente: ${item.client?.name || 'N/A'} | Processo: ${item.process?.title || 'N/A'}`,
    oldValues: JSON.stringify(item),
  })

  return NextResponse.json({ success: true })
}