import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { consultarProcessoDataJud, simularRespostaDataJud, extrairTribunalDoCNJ, TRIBUNAIS } from '@/lib/datajud'

// POST /api/datajud/search
// Body: { cnj: "0000000-00.0000.0.00.0000", demo?: boolean }
// Consulta processo no DataJud do CNJ
export async function POST(req: NextRequest) {
  const body = await req.json()
  const cnj: string = (body.cnj || '').trim()

  if (!cnj) {
    return NextResponse.json({ error: 'CNJ é obrigatório' }, { status: 400 })
  }

  const info = extrairTribunalDoCNJ(cnj)
  if (!info) {
    return NextResponse.json({
      error: 'Não foi possível identificar o tribunal a partir do CNJ. Verifique o número.'
    }, { status: 400 })
  }

  const tribunalInfo = TRIBUNAIS[info.tribunal]

  // Modo demo (sandbox sem acesso ao CNJ) ou força demo
  const usarDemo = body.demo === true

  if (usarDemo) {
    const resultado = simularRespostaDataJud(cnj)
    return NextResponse.json({
      ...resultado,
      aviso: 'Modo demonstração - dados simulados. Em ambiente com acesso ao CNJ, retornará dados reais do DataJud.',
    })
  }

  try {
    const resultado = await consultarProcessoDataJud(cnj)

    // Registrar auditoria
    await db.auditLog.create({
      data: {
        user: 'Sistema',
        action: 'DATAJUD_SEARCH',
        entity: 'Process',
        details: `Consulta DataJud: CNJ ${cnj} (${info.tribunal}) - ${resultado.encontrado ? 'Encontrado' : 'Não encontrado'}`,
      },
    })

    return NextResponse.json(resultado)
  } catch (error: any) {
    console.error('Erro DataJud:', error.message)

    // Se for erro de conexão, oferece modo demo
    const ehErroConexao = error.message.includes('fetch') ||
                          error.message.includes('Timeout') ||
                          error.message.includes('HTTP 000')

    if (ehErroConexao) {
      const demo = simularRespostaDataJud(cnj)
      return NextResponse.json({
        ...demo,
        aviso: `⚠️ Não foi possível conectar à API do DataJud (${error.message}). Retornando dados de demonstração. Em produção, isto traria dados reais do tribunal.`,
        erroConexao: true,
      })
    }

    return NextResponse.json(
      {
        error: error.message,
        tribunal: info.tribunal,
        tribunalNome: tribunalInfo?.nome,
      },
      { status: 500 }
    )
  }
}

// GET /api/datajud/tribunais - lista de tribunais suportados
export async function GET() {
  return NextResponse.json(
    Object.entries(TRIBUNAIS).map(([sigla, info]) => ({
      sigla,
      nome: info.nome,
      tipo: info.tipo,
      endpoint: info.endpoint,
    }))
  )
}
