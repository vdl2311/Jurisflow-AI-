import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest, logAuditSync } from '@/lib/audit'

// GET /api/processes - lista de processos com filtros
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') || ''
  const status = searchParams.get('status') || ''
  const area = searchParams.get('area') || ''

  const where: Record<string, unknown> = {}
  if (search) {
    where.OR = [
      { title: { contains: search } },
      { cnj: { contains: search } },
      { parties: { contains: search } },
    ]
  }
  if (status && status !== 'Todos') where.status = status
  if (area && area !== 'Todos') where.area = area

  const processes = await db.process.findMany({
    where,
    include: {
      client: true,
      _count: {
        select: { movements: true, deadlines: true, tasks: true, documents: true },
      },
    },
    orderBy: { updatedAt: 'desc' },
  })

  return NextResponse.json(processes)
}

// POST /api/processes - criar novo processo
export async function POST(req: NextRequest) {
  const user = getUserFromRequest(req)
  const body = await req.json()

  const proc = await db.process.create({
    data: {
      cnj: body.cnj,
      title: body.title,
      court: body.court,
      section: body.section,
      classType: body.classType,
      subject: body.subject,
      caseValue: body.caseValue || 0,
      parties: body.parties,
      status: body.status || 'Ativo',
      area: body.area,
      responsibleId: body.responsibleId,
      risk: body.risk || 'Médio',
      clientId: body.clientId,
    },
  })

  // Adiciona movimento inicial automática
  await db.movement.create({
    data: {
      processId: proc.id,
      date: new Date(),
      description: 'Cadastro do processo no sistema',
      summary: 'Processo cadastrado. Aguardando distribuição ou primeiro andamento.',
      important: false,
    },
  })

  // Cria timeline entry
  await db.timelineEntry.create({
    data: {
      processId: proc.id,
      clientId: proc.clientId,
      date: new Date(),
      type: 'Movimento',
      title: 'Cadastro do processo',
      description: 'Processo cadastrado no sistema.',
    },
  })

  logAuditSync({
    userName: user.name,
    userEmail: user.email,
    userRole: user.role,
    action: 'CREATE',
    entity: 'Process',
    entityId: proc.id,
    details: `Processo criado: ${proc.title} | CNJ: ${proc.cnj || 'N/A'} | Área: ${proc.area || 'N/A'} | Cliente: ${body.clientId || 'N/A'}`,
    newValues: JSON.stringify(body),
  })

  return NextResponse.json(proc, { status: 201 })
}