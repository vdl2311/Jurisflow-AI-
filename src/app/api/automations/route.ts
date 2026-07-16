import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/automations
export async function GET() {
  const autos = await db.automation.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json(
    autos.map((a) => ({ ...a, actions: JSON.parse(a.actions) }))
  )
}

// POST /api/automations
export async function POST(req: NextRequest) {
  const body = await req.json()
  const auto = await db.automation.create({
    data: {
      name: body.name,
      trigger: body.trigger,
      actions: JSON.stringify(body.actions || []),
      enabled: body.enabled !== false,
    },
  })
  return NextResponse.json({ ...auto, actions: JSON.parse(auto.actions) }, { status: 201 })
}

// PATCH /api/automations?id=xxx
export async function PATCH(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const body = await req.json()
  const allowedFields: Record<string, unknown> = {}
  for (const f of ['name', 'trigger', 'enabled']) {
    if (body[f] !== undefined) allowedFields[f] = body[f]
  }
  if (body.actions) allowedFields.actions = JSON.stringify(body.actions)

  const updated = await db.automation.update({
    where: { id },
    data: allowedFields,
  })
  return NextResponse.json({ ...updated, actions: JSON.parse(updated.actions) })
}

// POST /api/automations?id=xxx/executar - simula execução de automação
export async function PUT(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const auto = await db.automation.findUnique({ where: { id } })
  if (!auto) return NextResponse.json({ error: 'não encontrada' }, { status: 404 })

  const actions = JSON.parse(auto.actions)
  const resultados: string[] = []

  for (const a of actions) {
    switch (a.type) {
      case 'enviar_email':
        resultados.push(`📧 E-mail "${a.template}" enviado para ${a.to}`)
        break
      case 'enviar_whatsapp':
        resultados.push(`💬 WhatsApp "${a.template}" enviado para ${a.to}`)
        break
      case 'criar_tarefa':
        resultados.push(`✓ Tarefa criada: "${a.title}" (Prioridade: ${a.priority})`)
        break
      case 'gerar_pix':
        resultados.push(`💳 PIX gerado no valor automático`)
        break
      case 'notificar_advogado':
        resultados.push(`🔔 Advogado notificado: ${a.message}`)
        break
      case 'resumir_ia':
        resultados.push(`🤖 IA processando resumo de ${a.target}`)
        break
      case 'verificar_prazo':
        resultados.push(`⏰ Verificação de prazo de ${a.days} dias executada`)
        break
      default:
        resultados.push(`⚙️ Ação executada: ${a.type}`)
    }
  }

  await db.auditLog.create({
    data: {
      user: 'Sistema',
      action: 'AUTOMATION',
      entity: 'Automation',
      entityId: id,
      details: `Automação "${auto.name}" executada: ${resultados.length} ações`,
    },
  })

  return NextResponse.json({
    automacao: auto.name,
    acoesExecutadas: resultados.length,
    resultados,
  })
}
