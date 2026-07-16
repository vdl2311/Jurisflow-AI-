import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { logAuditSync } from '@/lib/audit'

// POST /api/auth/login - Login simples (simulação)
export async function POST(req: NextRequest) {
  const { email, password, twoFactorCode } = await req.json()

  const user = await db.user.findUnique({ where: { email } })
  if (!user) {
    return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 })
  }

  if (password !== 'demo123' && password !== user.password) {
    logAuditSync({
      userName: email,
      userEmail: email,
      userRole: 'N/A',
      action: 'LOGIN',
      entity: 'User',
      entityId: user.id,
      details: `TENTATIVA DE LOGIN FRACASSADA: e-mail ${email} - senha incorreta`,
    })
    return NextResponse.json({ error: 'Senha incorreta' }, { status: 401 })
  }

  if (user.twoFactorEnabled && twoFactorCode !== '123456') {
    return NextResponse.json({
      requires2FA: true,
      message: 'Código 2FA enviado para seu e-mail. Use 123456 para demo.',
    }, { status: 200 })
  }

  await db.user.update({
    where: { id: user.id },
    data: { lastLogin: new Date() },
  })

  logAuditSync({
    userName: user.name,
    userEmail: user.email,
    userRole: user.role,
    action: 'LOGIN',
    entity: 'User',
    entityId: user.id,
    details: `Login realizado com sucesso | Cargo: ${user.role} | 2FA: ${user.twoFactorEnabled ? 'Sim' : 'Não'}`,
  })

  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      oab: user.oab,
      permissions: user.permissions,
      twoFactorEnabled: user.twoFactorEnabled,
    },
  })
}