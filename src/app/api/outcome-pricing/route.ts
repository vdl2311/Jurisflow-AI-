import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/outcome-pricing
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const area = searchParams.get('area')

  const where: any = { active: true }
  if (area && area !== 'Todas') where.area = area

  const pricing = await db.outcomePricing.findMany({ where, orderBy: { area: 'asc' } })
  return NextResponse.json(pricing)
}

// POST /api/outcome-pricing
export async function POST(req: NextRequest) {
  const body = await req.json()
  const pricing = await db.outcomePricing.create({
    data: {
      name: body.name,
      description: body.description,
      basePrice: Number(body.basePrice),
      successPrice: Number(body.successPrice),
      successCriteria: body.successCriteria,
      area: body.area || 'Geral',
    },
  })
  return NextResponse.json(pricing, { status: 201 })
}
