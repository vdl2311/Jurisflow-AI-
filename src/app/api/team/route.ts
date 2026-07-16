import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/team
export async function GET() {
  const users = await db.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      oab: true,
      permissions: true,
      twoFactorEnabled: true,
      lastLogin: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(users)
}

// POST /api/team
export async function POST(req: NextRequest) {
  const body = await req.json()
  const user = await db.user.create({
    data: {
      email: body.email,
      password: '$2a$10$hashdemo',
      name: body.name,
      role: body.role || 'Advogado',
      oab: body.oab,
      permissions: body.permissions,
      twoFactorEnabled: body.twoFactorEnabled || false,
    },
  })
  await db.auditLog.create({
    data: {
      user: 'Sistema',
      action: 'CREATE',
      entity: 'User',
      entityId: user.id,
      details: `Usuário criado: ${user.name} (${user.role})`,
    },
  })
  return NextResponse.json(user, { status: 201 })
}

// PATCH /api/team?id=xxx
export async function PATCH(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const body = await req.json()
  const allowedFields: Record<string, unknown> = {}
  for (const f of ['name', 'email', 'role', 'oab', 'permissions']) {
    if (body[f] !== undefined) allowedFields[f] = body[f]
  }
  if (body.twoFactorEnabled !== undefined) {
    allowedFields.twoFactorEnabled = Boolean(body.twoFactorEnabled)
  }
  const updated = await db.user.update({
    where: { id },
    data: allowedFields,
  })
  return NextResponse.json(updated)
}

// DELETE /api/team?id=xxx
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  await db.user.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
