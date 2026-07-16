import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/processes/[id]/movements - adicionar andamento
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await req.json()

  // Verifica se o processo existe
  const proc = await db.process.findUnique({
    where: { id },
    select: { id: true, clientId: true, title: true },
  })

  if (!proc) {
    return NextResponse.json({ error: 'Processo não encontrado' }, { status: 404 })
  }

  if (!body.description || !body.description.trim()) {
    return NextResponse.json({ error: 'Descrição é obrigatória' }, { status: 400 })
  }

  const mov = await db.movement.create({
    data: {
      processId: id,
      date: body.date ? new Date(body.date) : new Date(),
      description: body.description.trim(),
      summary: body.summary || null,
      important: body.important === true,
    },
  })

  // Adiciona à timeline unificada
  await db.timelineEntry.create({
    data: {
      processId: id,
      clientId: proc.clientId, // Bug #13 fix: incluir clientId
      date: mov.date,
      type: 'Movimento',
      title: mov.description,
      description: mov.summary,
    },
  })

  // Auditoria
  await db.auditLog.create({
    data: {
      user: 'Sistema',
      action: 'CREATE',
      entity: 'Movement',
      entityId: mov.id,
      details: `Andamento adicionado ao processo "${proc.title}": ${mov.description}`,
    },
  })

  return NextResponse.json(mov, { status: 201 })
}
