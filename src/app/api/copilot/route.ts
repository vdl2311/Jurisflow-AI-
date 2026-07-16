import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generateContentWithRetry } from '@/lib/gemini'

// POST /api/copilot
// Copiloto Jurídico - chat com IA que consulta os dados do escritório (RAG básico)
export async function POST(req: NextRequest) {
  const body = await req.json()
  const pergunta: string = (body.pergunta || '').trim()
  const historico: { role: string; content: string }[] = body.historico || []

  if (!pergunta) {
    return NextResponse.json({ error: 'Pergunta é obrigatória' }, { status: 400 })
  }

  // Coletar dados relevantes do escritório para o contexto (RAG simples)
  const hoje = new Date()
  const inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())
  const proximos30 = new Date(hoje.getTime() + 30 * 86400000)

  const [
    processos,
    prazosProximos,
    tarefasPendentes,
    honorariosAtrasados,
    clientes,
    financeiroPendente,
  ] = await Promise.all([
    db.process.findMany({
      include: { client: true, _count: { select: { movements: true } } },
      take: 50,
    }),
    db.deadline.findMany({
      where: { done: false, dueDate: { gte: inicioHoje, lte: proximos30 } },
      include: { process: true },
      orderBy: { dueDate: 'asc' },
    }),
    db.task.findMany({
      where: { status: { not: 'Concluída' } },
      include: { process: true, client: true },
      orderBy: { dueDate: 'asc' },
      take: 20,
    }),
    db.financial.findMany({
      where: { type: 'Receita', status: 'Atrasado' },
      include: { client: true },
    }),
    db.client.findMany({ take: 50 }),
    db.financial.findMany({
      where: { status: { in: ['Pendente', 'Atrasado'] } },
      include: { client: true },
      orderBy: { dueDate: 'asc' },
    }),
  ])

  // Constrói contexto estruturado para o modelo
  const contexto = `
CONTEXTO DO ESCRITÓRIO DE ADVOCACIA (JusFlow - dados em tempo real):

== CLIENTES (${clientes.length}) ==
${clientes.map((c) => `- ${c.name} | ${c.type === 'PF' ? 'CPF' : 'CNPJ'}: ${c.document || '-'} | Status: ${c.status} | Tags: ${c.tags || '-'}`).join('\n')}

== PROCESSOS (${processos.length}) ==
${processos.map((p) => `- [${p.cnj || 'sem CNJ'}] ${p.title} | Cliente: ${p.client?.name} | Área: ${p.area} | Status: ${p.status} | Risco: ${p.risk} | Responsável: ${p.responsibleId} | Valor: R$ ${(p.caseValue || 0).toFixed(2)}`).join('\n')}

== PRAZOS PRÓXIMOS (30 dias) (${prazosProximos.length}) ==
${prazosProximos.map((d) => `- ${new Date(d.dueDate).toLocaleDateString('pt-BR')} | ${d.priority} | ${d.type} | ${d.title} | Processo: ${d.process?.title} | Resp: ${d.responsible || '-'}`).join('\n')}

== TAREFAS PENDENTES (${tarefasPendentes.length}) ==
${tarefasPendentes.map((t) => `- [${t.priority}] ${t.title} | Status: ${t.status} | Resp: ${t.assignee || '-'}${t.dueDate ? ' | Até: ' + new Date(t.dueDate).toLocaleDateString('pt-BR') : ''}`).join('\n')}

== HONORÁRIOS ATRASADOS (${honorariosAtrasados.length}) ==
${honorariosAtrasados.map((h) => `- ${h.description} | R$ ${h.amount.toFixed(2)} | Cliente: ${h.client?.name} | Venc.: ${new Date(h.dueDate).toLocaleDateString('pt-BR')}`).join('\n')}

== FINANCEIRO PENDENTE (${financeiroPendente.length}) ==
${financeiroPendente.map((f) => `- ${f.type} | ${f.description} | R$ ${f.amount.toFixed(2)} | Venc.: ${new Date(f.dueDate).toLocaleDateString('pt-BR')} | Status: ${f.status} | Cliente: ${f.client?.name || '-'}`).join('\n')}
`

  const systemPrompt = `Você é o Copiloto Jurídico do JusFlow, um assistente de IA para advogados brasileiros.
Sua função é ajudar o advogado respondendo perguntas com base nos dados do escritório (contexto fornecido), além de sugerir ações.

Diretrizes:
1. Responda SEMPRE em português brasileiro.
2. Use SOMENTE os dados fornecidos no contexto. Se faltar informação, diga que não há dados suficientes.
3. Seja objetivo, claro e direto. Use listas quando apropriado.
4. Quando o advogado perguntar sobre prazos, audiências, tarefas, clientes ou financeiro, forneça informações concretas com nomes, datas e valores.
5. Quando relevante, sugira próximas ações (ex.: "Sugiro ligar para X", "Priorize o prazo Y").
6. Para pedidos de geração de petições ou peças jurídicas, use os dados do processo do contexto e estruture em formato de peça processual (cabeçalho, qualificação, fatos, fundamentos, pedidos).
7. Não invente dados que não estejam no contexto.
8. Em perguntas sobre jurisprudência, indique que é uma pesquisa que deve ser feita em fontes oficiais (STJ, TST, TJ), mas sugira teses comuns quando aplicável.

${contexto}`

  try {
    const contents = [
      ...historico.slice(-6).map((m) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }],
      })),
      { role: 'user', parts: [{ text: pergunta }] },
    ]

    const resposta = await generateContentWithRetry({
      contents,
      systemInstruction: systemPrompt,
      temperature: 0.4,
    })

    // Log de auditoria
    await db.auditLog.create({
      data: {
        user: 'Copiloto',
        action: 'QUERY',
        entity: 'Copilot',
        details: `Pergunta: ${pergunta.substring(0, 200)}`,
      },
    })

    return NextResponse.json({
      resposta,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Erro no copiloto:', error)
    return NextResponse.json(
      {
        error: 'Erro ao processar pergunta',
        resposta:
          'Desculpe, ocorreu um erro ao consultar o Copiloto. Tente novamente em instantes.',
      },
      { status: 500 }
    )
  }
}
