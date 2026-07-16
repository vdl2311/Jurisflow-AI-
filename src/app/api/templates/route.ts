import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/templates
export async function GET() {
  const templates = await db.contractTemplate.findMany({
    include: { _count: { select: { contracts: true } } },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(
    templates.map((t) => ({
      ...t,
      variables: t.variables ? JSON.parse(t.variables) : [],
    }))
  )
}

// POST /api/templates
export async function POST(req: NextRequest) {
  const body = await req.json()
  const tpl = await db.contractTemplate.create({
    data: {
      name: body.name,
      category: body.category || 'Geral',
      content: body.content,
      variables: JSON.stringify(body.variables || []),
    },
  })
  return NextResponse.json(tpl, { status: 201 })
}
