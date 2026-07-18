import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import ZAI from 'z-ai-web-dev-sdk'

// POST /api/agents/run
// Executa um agente com Supervisory AI (segunda IA que valida o output)
// Body: { agentId, task, input?, processId?, clientId? }
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { agentId, task, input, processId, clientId } = body

  if (!agentId || !task) {
    return NextResponse.json({ error: 'agentId e task são obrigatórios' }, { status: 400 })
  }

  const agent = await db.agent.findUnique({ where: { id: agentId } })
  if (!agent) {
    return NextResponse.json({ error: 'Agente não encontrado' }, { status: 404 })
  }

  if (agent.status !== 'Ativo') {
    return NextResponse.json({ error: `Agente ${agent.status}` }, { status: 400 })
  }

  // Criar registro de execução pendente
  const run = await db.agentRun.create({
    data: {
      agentId,
      task,
      input: input ? JSON.stringify(input) : null,
      processId: processId || null,
      clientId: clientId || null,
      status: 'Em Execução',
      output: '',
    },
  })

  const startTime = Date.now()

  try {
    // ===== FASE 1: Agente executa a tarefa =====
    const zai = await ZAI.create()

    // Constrói contexto com dados do processo/cliente se fornecidos
    let contextInfo = ''
    if (processId) {
      const proc = await db.process.findUnique({
        where: { id: processId },
        include: { client: true, movements: { orderBy: { date: 'desc' }, take: 5 } },
      })
      if (proc) {
        contextInfo = `\n\nDADOS DO PROCESSO:\n- Título: ${proc.title}\n- CNJ: ${proc.cnj || '-'}\n- Área: ${proc.area}\n- Cliente: ${proc.client.name}\n- Status: ${proc.status}\n- Últimos andamentos:\n${proc.movements.map((m) => `  • ${m.description}`).join('\n')}\n`
      }
    }

    const userMessage = `${task}${contextInfo}${input ? `\n\nPARÂMETROS ADICIONAIS:\n${JSON.stringify(input, null, 2)}` : ''}`

    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'assistant', content: agent.systemPrompt },
        { role: 'user', content: userMessage },
      ],
      thinking: { type: 'disabled' },
      temperature: 0.4,
      max_tokens: 3000,
    })

    const agentOutput = completion.choices[0]?.message?.content || 'Sem output.'
    const tokensUsed = completion.usage?.total_tokens || 0

    // Atualiza o output no banco
    await db.agentRun.update({
      where: { id: run.id },
      data: { output: agentOutput },
    })

    // ===== FASE 2: Supervisory AI (se habilitada) =====
    let supervision = null
    let supervisionPassed = false
    let supervisionNotes = null

    if (agent.supervisionEnabled) {
      const supervisionPrompt = `Você é a **Supervisory AI** - uma segunda IA que verifica o trabalho de outros agentes jurídicos. Sua função é crítica: você é a camada de qualidade.

Analise o seguinte output de um agente jurídico:

**AGENTE:** ${agent.name}
**TAREFA:** ${task}
**OUTPUT DO AGENTE:**
---
${agentOutput}
---

Verifique e responda:

1. **CORREÇÃO JURÍDICA** - O output cita leis/jurisprudência corretamente? Há erros materiais?
2. **COMPLETUDE** - Todos os pontos da tarefa foram atendidos?
3. **ALUCINAÇÃO** - Há dados inventados (números de processo, datas, valores)?
4. **RISCO PARA O CLIENTE** - Há recomendações que podem prejudicar o cliente?
5. **CONFORMIDADE** - Está conforme ética da OAB e LGPD?

**Formato da resposta:**

## Supervisory AI - Verificação

✅ **Pontos corretos:**
- ...

⚠️ **Observações/Pendências:**
- ...

❌ **Erros encontrados (se houver):**
- ...

**Status final:** APROVADO / REJEITADO / APROVADO COM OBSERVAÇÕES

**Notas técnicas:**
[observações para o advogado]`

      const supervisionCompletion = await zai.chat.completions.create({
        messages: [
          { role: 'assistant', content: supervisionPrompt },
          { role: 'user', content: 'Verifique o output do agente.' },
        ],
        thinking: { type: 'disabled' },
        temperature: 0.2,
        max_tokens: 1500,
      })

      supervision = supervisionCompletion.choices[0]?.message?.content || ''
      supervisionPassed = supervision.toUpperCase().includes('APROVADO') && !supervision.toUpperCase().includes('REJEITADO')
      supervisionNotes = supervisionPassed
        ? 'Output aprovado pela Supervisory AI.'
        : 'Output rejeitado ou com observações. Revisar antes de usar.'

      if (!supervisionPassed && supervision.toUpperCase().includes('REJEITADO')) {
        // Marca como rejeitado
        await db.agentRun.update({
          where: { id: run.id },
          data: {
            output: agentOutput,
            supervision,
            supervisionPassed: false,
            supervisionNotes,
            status: 'Rejeitado',
            duration: Date.now() - startTime,
            tokensUsed: tokensUsed + (supervisionCompletion.usage?.total_tokens || 0),
          },
        })

        await db.auditLog.create({
          data: {
            user: 'Agente ' + agent.name,
            action: 'AGENT_RUN_REJECTED',
            entity: 'AgentRun',
            entityId: run.id,
            details: `Agente rejeitado pela Supervisory AI: ${task.substring(0, 100)}`,
          },
        })

        return NextResponse.json({
          runId: run.id,
          status: 'Rejeitado',
          output: agentOutput,
          supervision,
          supervisionPassed: false,
          supervisionNotes,
          duration: Date.now() - startTime,
        })
      }
    }

    // ===== FASE 3: Finalizar execução =====
    const finalDuration = Date.now() - startTime
    await db.agentRun.update({
      where: { id: run.id },
      data: {
        output: agentOutput,
        supervision,
        supervisionPassed,
        supervisionNotes,
        status: 'Concluído',
        duration: finalDuration,
        tokensUsed,
      },
    })

    // Auditoria
    await db.auditLog.create({
      data: {
        user: 'Agente ' + agent.name,
        action: 'AGENT_RUN',
        entity: 'AgentRun',
        entityId: run.id,
        details: `Agente executou: ${task.substring(0, 100)}. Supervisão: ${supervisionPassed ? 'APROVADO' : 'N/A'}. Duração: ${finalDuration}ms`,
      },
    })

    return NextResponse.json({
      runId: run.id,
      status: 'Concluído',
      agent: agent.name,
      task,
      output: agentOutput,
      supervision,
      supervisionPassed,
      supervisionNotes,
      duration: finalDuration,
      tokensUsed,
    })
  } catch (error: any) {
    console.error('Erro ao executar agente:', error)
    await db.agentRun.update({
      where: { id: run.id },
      data: {
        status: 'Erro',
        output: `Erro: ${error.message}`,
        duration: Date.now() - startTime,
      },
    })
    return NextResponse.json(
      { error: error.message, runId: run.id, status: 'Erro' },
      { status: 500 }
    )
  }
}

// GET /api/agents/run - histórico de execuções
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const agentId = searchParams.get('agentId')
  const limit = parseInt(searchParams.get('limit') || '20')

  const where: any = {}
  if (agentId) where.agentId = agentId

  const runs = await db.agentRun.findMany({
    where,
    include: { agent: { select: { name: true, icon: true, color: true } } },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })

  return NextResponse.json(runs)
}
