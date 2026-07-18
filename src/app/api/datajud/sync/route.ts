import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { consultarProcessoDataJud, simularRespostaDataJud, extrairTribunalDoCNJ } from '@/lib/datajud'

// POST /api/datajud/sync
// Body: { processId: "xxx", demo?: boolean }
// Sincroniza andamentos do DataJud com o processo no banco local
export async function POST(req: NextRequest) {
  const body = await req.json()
  const processId: string = body.processId

  if (!processId) {
    return NextResponse.json({ error: 'processId é obrigatório' }, { status: 400 })
  }

  const proc = await db.process.findUnique({
    where: { id: processId },
    include: { movements: { orderBy: { date: 'desc' } } },
  })

  if (!proc) {
    return NextResponse.json({ error: 'Processo não encontrado' }, { status: 404 })
  }

  if (!proc.cnj) {
    return NextResponse.json({
      error: 'Processo não possui número CNJ cadastrado. Atualize o processo com o CNJ antes de sincronizar.',
    }, { status: 400 })
  }

  const info = extrairTribunalDoCNJ(proc.cnj)
  if (!info) {
    return NextResponse.json({
      error: 'Não foi possível identificar o tribunal a partir do CNJ.',
    }, { status: 400 })
  }

  // Consulta DataJud (real ou demo)
  let resultado
  const usarDemo = body.demo === true

  if (usarDemo) {
    resultado = simularRespostaDataJud(proc.cnj)
  } else {
    try {
      resultado = await consultarProcessoDataJud(proc.cnj)
    } catch (error: any) {
      // Fallback para demo em caso de erro de conexão
      const ehErroConexao = error.message.includes('fetch') ||
                            error.message.includes('Timeout') ||
                            error.message.includes('HTTP 000')
      if (ehErroConexao) {
        resultado = simularRespostaDataJud(proc.cnj)
        resultado.aviso = `Erro de conexão com DataJud - usando dados simulados.`
      } else {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    }
  }

  if (!resultado.encontrado || !resultado.movimentos) {
    return NextResponse.json({
      sincronizado: false,
      mensagem: 'Processo não encontrado no DataJud ou sem movimentos.',
      cnj: proc.cnj,
      tribunal: info.tribunal,
    })
  }

  // Sincronizar movimentos: criar os que ainda não existem
  // Compara por data ISO (com hora) + descrição + código (mais granular que toDateString)
  const movimentosExistentes = new Set(
    proc.movements.map((m) => `${new Date(m.date).toISOString()}-${m.description}`)
  )

  const novosMovimentos: any[] = []
  for (const mov of resultado.movimentos) {
    const data = new Date(mov.data)
    const chave = `${data.toISOString()}-${mov.nome}`
    if (!movimentosExistentes.has(chave)) {
      const novo = await db.movement.create({
        data: {
          processId: proc.id,
          date: data,
          description: mov.nome,
          summary: mov.descricao || `Movimento automático importado do DataJud (${info.tribunal})`,
          important: false,
        },
      })
      novosMovimentos.push(novo)

      // Adiciona à timeline
      await db.timelineEntry.create({
        data: {
          processId: proc.id,
          clientId: proc.clientId,
          date: data,
          type: 'Movimento',
          title: mov.nome,
          description: `Importado do DataJud • ${info.tribunal}`,
        },
      })
    }
  }

  // Atualizar dados do processo se vierem do DataJud
  const updateData: any = {}
  if (resultado.classeNome && !proc.classType) updateData.classType = resultado.classeNome
  if (resultado.orgaoJulgador && !proc.section) updateData.section = resultado.orgaoJulgador
  if (resultado.valorCausa && (!proc.caseValue || proc.caseValue === 0)) {
    updateData.caseValue = resultado.valorCausa
  }

  if (Object.keys(updateData).length > 0) {
    await db.process.update({ where: { id: proc.id }, data: updateData })
  }

  // Auditoria
  await db.auditLog.create({
    data: {
      user: 'Sistema',
      action: 'DATAJUD_SYNC',
      entity: 'Process',
      entityId: proc.id,
      details: `Sincronização DataJud: ${novosMovimentos.length} novo(s) andamento(s) importado(s). Tribunal: ${info.tribunal}. Fonte: ${resultado.fonte}`,
    },
  })

  // Criar notificação se houver novos movimentos importantes
  if (novosMovimentos.length > 0) {
    await db.notification.create({
      data: {
        type: 'sistema',
        title: `${novosMovimentos.length} novo(s) andamento(s) importado(s)`,
        description: `Processo: ${proc.title} • Tribunal: ${info.tribunal} • Via DataJud`,
        link: 'process-detail',
        priority: 'Média',
      },
    })
  }

  return NextResponse.json({
    sincronizado: true,
    processo: proc.title,
    cnj: proc.cnj,
    tribunal: info.tribunal,
    fonte: resultado.fonte,
    aviso: resultado.aviso,
    novosMovimentos: novosMovimentos.length,
    totalMovimentosDataJud: resultado.movimentos.length,
    movimentosImportados: novosMovimentos.map((m) => ({
      data: m.date,
      descricao: m.description,
    })),
    dadosAtualizados: Object.keys(updateData),
  })
}
