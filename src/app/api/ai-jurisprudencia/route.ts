import { NextRequest, NextResponse } from 'next/server'
import { generateContentWithRetry } from '@/lib/gemini'

// POST /api/ai-jurisprudencia - Sugestão de jurisprudência
export async function POST(req: NextRequest) {
  const body = await req.json()
  const tema: string = (body.tema || '').trim()
  const area = body.area || 'Geral'

  if (!tema) {
    return NextResponse.json({ error: 'Tema é obrigatório' }, { status: 400 })
  }

  const prompt = `Você é um advogado brasileiro especialista em pesquisa jurisprudencial. Para o tema "${tema}" na área ${area}, forneça:

1. **TESSES JURISPRUDENCIAIS RELEVANTES** (pelo menos 3 teses principais)
2. **SÚMULAS APLICÁVEIS** (STJ, STF, TST quando relevantes)
3. **PRECEDENTES IMPORTANTES** (cite casos paradigmáticos, sem inventar números)
4. **POSICIONAMENTO ATUAL** dos tribunais superiores sobre o tema
5. **ARGUMENTOS FAVORÁVEIS** que podem ser usados em petições
6. **ARGUMENTOS CONTRÁRIOS** (para antecipar a contestação da parte contrária)
7. **RECOMENDAÇÕES** de como usar essa jurisprudência na petição

⚠️ IMPORTANTE: Não invente números de recursos ou datas específicas. Use expressões como "Tema X do STJ", "Súmula Y", "Jurisprudência consolidada do STJ", "Posicionamento do TST", etc. Indique que o advogado deve validar em fontes oficiais (STJ, JusBrasil, TST).

Responda em português brasileiro, formato Markdown.`

  try {
    const jurisprudencia = await generateContentWithRetry({
      contents: `Forneça sugestões de jurisprudência para: ${tema}`,
      systemInstruction: prompt,
      temperature: 0.4,
    })

    return NextResponse.json({
      tema,
      area,
      jurisprudencia,
      geradoEm: new Date().toISOString(),
      aviso: 'Sempre valide as teses em fontes oficiais (STJ, STF, TST) antes de usar em petições.',
    })
  } catch (error) {
    console.error('Erro IA jurisprudência:', error)
    return NextResponse.json(
      { error: 'Erro ao sugerir jurisprudência', jurisprudencia: '' },
      { status: 500 }
    )
  }
}
