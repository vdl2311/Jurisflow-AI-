import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/documents - lista documentos com filtros
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const clienteId = searchParams.get('clienteId')
  const processoId = searchParams.get('processoId')

  const where: Record<string, unknown> = {}
  if (clienteId) where.clientId = clienteId
  if (processoId) where.processId = processoId

  const docs = await db.document.findMany({
    where,
    include: { client: true, process: true },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(docs)
}

// POST /api/documents - registrar upload de documento (simulado)
export async function POST(req: NextRequest) {
  const body = await req.json()
  const doc = await db.document.create({
    data: {
      name: body.name,
      type: body.type || 'PDF',
      size: body.size || '0 KB',
      tags: body.tags,
      content: body.content,
      processId: body.processId || null,
      clientId: body.clientId || null,
    },
  })

  if (body.processId) {
    await db.timelineEntry.create({
      data: {
        processId: body.processId,
        clientId: body.clientId,
        date: new Date(),
        type: 'Documento',
        title: `Documento adicionado: ${body.name}`,
        description: body.tags || '',
      },
    })
  }

  await db.auditLog.create({
    data: {
      user: 'Sistema',
      action: 'CREATE',
      entity: 'Document',
      entityId: doc.id,
      details: `Documento enviado: ${doc.name}`,
    },
  })

  return NextResponse.json(doc, { status: 201 })
}
