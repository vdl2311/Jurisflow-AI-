import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/notifications
export async function GET() {
  const notifs = await db.notification.findMany({ orderBy: { createdAt: 'desc' }, take: 50 })
  return NextResponse.json(notifs)
}

// PATCH /api/notifications?id=xxx (marcar como lida)
export async function PATCH(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  const all = searchParams.get('all')

  if (all === 'true') {
    await db.notification.updateMany({ data: { read: true } })
    return NextResponse.json({ ok: true, updated: 'all' })
  }

  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const updated = await db.notification.update({
    where: { id },
    data: { read: true },
  })
  return NextResponse.json(updated)
}

// POST /api/notifications (criar manualmente)
export async function POST(req: NextRequest) {
  const body = await req.json()
  const n = await db.notification.create({
    data: {
      type: body.type || 'sistema',
      title: body.title,
      description: body.description,
      link: body.link,
      priority: body.priority || 'Média',
    },
  })
  return NextResponse.json(n, { status: 201 })
}
