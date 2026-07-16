import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/time
export async function GET() {
  const items = await db.timeEntry.findMany({
    include: { process: true, client: true },
    orderBy: { date: 'desc' },
  })
  return NextResponse.json(items)
}

// POST /api/time
export async function POST(req: NextRequest) {
  const body = await req.json()
  const item = await db.timeEntry.create({
    data: {
      description: body.description,
      duration: Number(body.duration),
      date: new Date(body.date),
      user: body.user,
      billable: body.billable !== false,
      processId: body.processId || null,
      clientId: body.clientId || null,
    },
  })
  return NextResponse.json(item, { status: 201 })
}
