import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/contracts
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')

  const where: Record<string, unknown> = {}
  if (status && status !== 'Todos') where.status = status

  const contracts = await db.contract.findMany({
    where,
    include: { client: true, process: true, template: true },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(contracts)
}

// POST /api/contracts - criar contrato a partir de template
export async function POST(req: NextRequest) {
  const body = await req.json()

  let content = ''
  if (body.templateId) {
    const tpl = await db.contractTemplate.findUnique({ where: { id: body.templateId } })
    if (tpl) {
      content = tpl.content
      // Substituir variáveis fornecidas
      if (body.variables) {
        for (const [key, value] of Object.entries(body.variables)) {
          content = content.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), String(value))
        }
      }
    }
  } else {
    content = body.content || ''
  }

  const contract = await db.contract.create({
    data: {
      title: body.title,
      templateId: body.templateId || null,
      clientId: body.clientId,
      processId: body.processId || null,
      content,
      status: body.status || 'Rascunho',
    },
  })

  await db.auditLog.create({
    data: {
      user: 'Sistema',
      action: 'CREATE',
      entity: 'Contract',
      entityId: contract.id,
      details: `Contrato criado: ${contract.title}`,
    },
  })

  return NextResponse.json(contract, { status: 201 })
}

// PATCH /api/contracts?id=xxx
export async function PATCH(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const body = await req.json()

  // Se for assinatura eletrônica
  if (body.acao === 'assinar') {
    const assinantes = body.assinantes || 'Signatário'
    const contract = await db.contract.update({
      where: { id },
      data: {
        status: 'Assinado',
        signedBy: assinantes,
        signedAt: new Date(),
      },
    })

    await db.auditLog.create({
      data: {
        user: 'Sistema',
        action: 'SIGN',
        entity: 'Contract',
        entityId: id,
        details: `Contrato assinado eletronicamente por: ${assinantes}`,
      },
    })

    return NextResponse.json(contract)
  }

  const updated = await db.contract.update({
    where: { id },
    data: { ...body, acao: undefined, assinantes: undefined },
  })
  return NextResponse.json(updated)
}
