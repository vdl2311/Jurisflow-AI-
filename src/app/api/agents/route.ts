import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import ZAI from 'z-ai-web-dev-sdk'

// GET /api/agents - lista todos os agentes
export async function GET() {
  const agents = await db.agent.findMany({
    include: {
      _count: { select: { runs: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  // Estatísticas de execução
  const agentsWithStats = await Promise.all(
    agents.map(async (a) => {
      const runs = await db.agentRun.findMany({
        where: { agentId: a.id },
        select: { supervisionPassed: true, duration: true, tokensUsed: true },
      })
      const successRuns = runs.filter((r) => r.supervisionPassed).length
      return {
        ...a,
        capabilities: a.capabilities ? JSON.parse(a.capabilities) : [],
        tools: a.tools ? JSON.parse(a.tools) : [],
        stats: {
          totalRuns: a._count.runs,
          successRate: runs.length > 0 ? Math.round((successRuns / runs.length) * 100) : 0,
          avgDuration: runs.length > 0 ? Math.round(runs.reduce((s, r) => s + (r.duration || 0), 0) / runs.length) : 0,
          totalTokens: runs.reduce((s, r) => s + (r.tokensUsed || 0), 0),
        },
      }
    })
  )

  return NextResponse.json(agentsWithStats)
}

// POST /api/agents - criar novo agente
export async function POST(req: NextRequest) {
  const body = await req.json()
  const agent = await db.agent.create({
    data: {
      name: body.name,
      description: body.description,
      category: body.category || 'Geral',
      capabilities: JSON.stringify(body.capabilities || []),
      systemPrompt: body.systemPrompt,
      tools: JSON.stringify(body.tools || []),
      supervisionEnabled: body.supervisionEnabled !== false,
      status: body.status || 'Ativo',
      icon: body.icon || 'Bot',
      color: body.color || 'blue',
    },
  })
  await db.auditLog.create({
    data: {
      user: 'Sistema',
      action: 'CREATE',
      entity: 'Agent',
      entityId: agent.id,
      details: `Agente criado: ${agent.name}`,
    },
  })
  return NextResponse.json(agent, { status: 201 })
}
