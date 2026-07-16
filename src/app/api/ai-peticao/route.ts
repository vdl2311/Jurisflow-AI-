import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generateContentWithRetry } from '@/lib/gemini'

// POST /api/ai-peticao - Geração de petições com IA
export async function POST(req: NextRequest) {
  const body = await req.json()
  const tipo = body.tipo || 'inicial' // inicial, contestacao, replica, alegacoes_finais, recursal
  const processoId = body.processoId
  const descricao = body.descricao || ''
  const fatos = body.fatos || ''
  const pedidos = body.pedidos || ''

  let contextoProcesso = ''
  if (processoId) {
    const proc = await db.process.findUnique({
      where: { id: processoId },
      include: {
        client: true,
        movements: { orderBy: { date: 'desc' }, take: 10 },
      },
    })
    if (proc) {
      contextoProcesso = `
DADOS DO PROCESSO:
- Título: ${proc.title}
- CNJ: ${proc.cnj || 'novo'}
- Tribunal: ${proc.court || '-'}
- Vara: ${proc.section || '-'}
- Classe: ${proc.classType || '-'}
- Área: ${proc.area}
- Valor da causa: R$ ${(proc.caseValue || 0).toFixed(2)}
- Partes: ${proc.parties || '-'}
- Cliente: ${proc.client.name} (${proc.client.type === 'PF' ? 'CPF' : 'CNPJ'}: ${proc.client.document || '-'})
- Responsável: ${proc.responsibleId}

ANDAMENTOS RECENTES:
${proc.movements.map((m) => `- ${new Date(m.date).toLocaleDateString('pt-BR')}: ${m.description} - ${m.summary || ''}`).join('\n')}
`
    }
  }

  const tiposPeticao: Record<string, string> = {
    inicial: 'PETIÇÃO INICIAL',
    contestacao: 'CONTESTAÇÃO',
    replica: 'RÉPLICA',
    alegacoes_finais: 'ALEGAÇÕES FINAIS',
    recursal: 'RECURSO DE APELAÇÃO',
  }

  const prompt = `Você é um advogado brasileiro experiente. Gere uma ${tiposPeticao[tipo] || 'PETIÇÃO'} completa e bem estruturada, em português jurídico formal.

${contextoProcesso}

INFORMAÇÕES ADICIONAIS FORNECIDAS:
- Descrição do caso: ${descricao}
- Fatos: ${fatos}
- Pedidos: ${pedidos}

ESTRUTURA OBRIGATÓRIA da peça:
1. ENDEREÇAMENTO (ao juiz/tribunal competente)
2. QUALIFICAÇÃO das partes (use dados do cliente quando disponível)
3. DOS FATOS (narrativa clara e ordenada)
4. DO DIREITO (fundamentação jurídica com artigos de lei)
5. DOS PEDIDOS (enumerados, com valores quando aplicável)
6. REQUERIMENTOS (provas, perícia, testemunhas)
7. VALOR DA CAUSA
8. FECHAMENTO (local, data, assinatura do advogado)

Use linguagem jurídica formal, citações legais apropriadas ao tipo de ação, e seja específico.
NÃO invente números de processos ou dados que não estejam no contexto.
Se faltarem dados essenciais, use placeholders entre colchetes [como este] para o advogado preencher.`

  try {
    const peticao = await generateContentWithRetry({
      contents: `Gere a ${tiposPeticao[tipo]} agora.`,
      systemInstruction: prompt,
      temperature: 0.5,
    })

    await db.auditLog.create({
      data: {
        user: 'Sistema',
        action: 'AI_PETICAO',
        entity: 'Process',
        entityId: processoId || null,
        details: `Petição "${tiposPeticao[tipo]}" gerada por IA`,
      },
    })

    return NextResponse.json({
      tipo: tiposPeticao[tipo],
      conteudo: peticao,
      geradoEm: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Erro IA petição:', error)
    return NextResponse.json(
      { error: 'Erro ao gerar petição', conteudo: '' },
      { status: 500 }
    )
  }
}
