import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/firm-standards
export async function GET() {
  const standards = await db.firmStandard.findMany({
    where: { active: true },
    orderBy: { category: 'asc' },
  })
  return NextResponse.json(standards)
}

// POST /api/firm-standards
export async function POST(req: NextRequest) {
  const body = await req.json()
  const std = await db.firmStandard.create({
    data: {
      category: body.category,
      name: body.name,
      value: body.value,
      description: body.description || null,
    },
  })
  return NextResponse.json(std, { status: 201 })
}
