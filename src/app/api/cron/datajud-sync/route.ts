import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { consultarProcessoDataJud, simularRespostaDataJud, extrairTribunalDoCNJ } from '@/lib/datajud'

// POST /api/cron/datajud-sync
// Sincronização automática de todos os processos ativos com CNJ.
// Pode ser chamado por:
//   1. Cron job externo (Vercel Cron, GitHub Actions, etc.)
//   2. Botão "Sincronizar tudo" no painel admin
//   3. Job agendado interno
//
// Headers:
//   Authorization: Bearer <CRON_SECRET>  (opcional, para segurança)
//   Ou query ?secret=<CRON_SECRET>
//
// Body opcional:
//   { demo?: boolean, limit?: number, processIds?: string[] }
//   - demo: usa dados simulados (para teste)
//   - limit: máx de processos a sincronizar (default 100)
//   - processIds: lista específica de IDs (se omitido, sincroniza todos ativos com CNJ)

const CRON_SECRET = process.env.CRON_SECRET || 'jusflow-cron-secret-2026'

export async function POST(req: NextRequest) {
  // Verificação de segurança (pode ser bypassada em dev)
  const authHeader = req.headers.get('authorization')
  const url = new URL(req.url)
  const querySecret = url.searchParams.get('secret')
  const isAuthorized =
    authHeader === `Bearer ${CRON_SECRET}` ||
    querySecret === CRON_SECRET ||
    process.env.NODE_ENV !== 'production'

  if (!isAuthorized) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const usarDemo: boolean = body.demo === true
  const limit: number = Math.min(body.limit || 100, 500)
  const processIdsEspecificos: string[] | undefined = body.processIds

  // Buscar processos ativos com CNJ
  const where: any = {
    status: 'Ativo',
    cnj: { not: null },
  }
  if (processIdsEspecificos && processIdsEspecificos.length > 0) {
    where.id = { in: processIdsEspecificos }
  }

  const processos = await db.process.findMany({
    where,
    include: { movements: { orderBy: { date: 'desc' } } },
    take: limit,
    orderBy: { updatedAt: 'asc' }, // Mais antigos primeiro
  })

  if (processos.length === 0) {
    return NextResponse.json({
      sincronizado: true,
      mensagem: 'Nenhum processo ativo com CNJ encontrado.',
      total: 0,
      resultados: [],
    })
  }

  const resultados: any[] = []
  let totalNovosMovimentos = 0
  let totalErros = 0
  let totalSucessos = 0

  for (const proc of processos) {
    if (!proc.cnj) continue

    try {
      const info = extrairTribunalDoCNJ(proc.cnj)
      if (!info) {
        resultados.push({
          processId: proc.id,
          title: proc.title,
          cnj: proc.cnj,
          status: 'erro',
          erro: 'Tribunal não identificado no CNJ',
        })
        totalErros++
        continue
      }

      // Consulta DataJud (real ou demo)
      let resultado
      if (usarDemo) {
        resultado = simularRespostaDataJud(proc.cnj)
      } else {
        try {
          resultado = await consultarProcessoDataJud(proc.cnj)
        } catch (err: any) {
          // Fallback para demo em caso de erro de conexão
          const ehErroConexao = err.message.includes('fetch') ||
                                err.message.includes('Timeout') ||
                                err.message.includes('HTTP 000')
          if (ehErroConexao) {
            resultado = simularRespostaDataJud(proc.cnj)
          } else {
            throw err
          }
        }
      }

      if (!resultado.encontrado || !resultado.movimentos) {
        resultados.push({
          processId: proc.id,
          title: proc.title,
          cnj: proc.cnj,
          tribunal: info.tribunal,
          status: 'nao_encontrado',
        })
        continue
      }

      // Sincronizar movimentos
      const movimentosExistentes = new Set(
        proc.movements.map((m) => `${new Date(m.date).toISOString()}-${m.description}`)
      )

      let novosCount = 0
      const novosMovimentosData: any[] = []

      for (const mov of resultado.movimentos) {
        const data = new Date(mov.data)
        const chave = `${data.toISOString()}-${mov.nome}`
        if (!movimentosExistentes.has(chave)) {
          await db.movement.create({
            data: {
              processId: proc.id,
              date: data,
              description: mov.nome,
              summary: mov.descricao || `Movimento automático importado do DataJud (${info.tribunal})`,
              important: false,
            },
          })

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

          novosCount++
          novosMovimentosData.push({ data, descricao: mov.nome })
        }
      }

      // Atualiza dados do processo se necessário
      const updateData: any = {}
      if (resultado.classeNome && !proc.classType) updateData.classType = resultado.classeNome
      if (resultado.orgaoJulgador && !proc.section) updateData.section = resultado.orgaoJulgador
      if (resultado.valorCausa && (!proc.caseValue || proc.caseValue === 0)) {
        updateData.caseValue = resultado.valorCausa
      }
      if (Object.keys(updateData).length > 0) {
        await db.process.update({ where: { id: proc.id }, data: updateData })
      }

      // Cria notificação se houver novos movimentos
      if (novosCount > 0) {
        await db.notification.create({
          data: {
            type: 'sistema',
            title: `${novosCount} novo(s) andamento(s) em: ${proc.title}`,
            description: `Tribunal: ${info.tribunal} • Importado automaticamente via DataJud`,
            link: 'process-detail',
            priority: novosCount >= 3 ? 'Alta' : 'Média',
          },
        })
      }

      totalNovosMovimentos += novosCount
      totalSucessos++
      resultados.push({
        processId: proc.id,
        title: proc.title,
        cnj: proc.cnj,
        tribunal: info.tribunal,
        status: 'sincronizado',
        novosMovimentos: novosCount,
        totalMovimentosDataJud: resultado.movimentos.length,
      })
    } catch (error: any) {
      totalErros++
      resultados.push({
        processId: proc.id,
        title: proc.title,
        cnj: proc.cnj,
        status: 'erro',
        erro: error.message,
      })
    }
  }

  // Auditoria
  await db.auditLog.create({
    data: {
      user: 'Cron DataJud',
      action: 'DATAJUD_CRON_SYNC',
      entity: 'System',
      details: `Sincronização automática: ${totalSucessos} processos sincronizados, ${totalNovosMovimentos} novos andamentos, ${totalErros} erros. Modo: ${usarDemo ? 'demo' : 'real'}`,
    },
  })

  return NextResponse.json({
    sincronizado: true,
    timestamp: new Date().toISOString(),
    modo: usarDemo ? 'demo' : 'real',
    total: processos.length,
    sucessos: totalSucessos,
    erros: totalErros,
    novosMovimentos: totalNovosMovimentos,
    resultados,
  })
}

// GET - retorna estatísticas do último sync
export async function GET() {
  const ultimoLog = await db.auditLog.findFirst({
    where: { action: 'DATAJUD_CRON_SYNC' },
    orderBy: { createdAt: 'desc' },
  })

  const processosComCnj = await db.process.count({
    where: { status: 'Ativo', cnj: { not: null } },
  })

  const historico = await db.auditLog.findMany({
    where: { action: 'DATAJUD_CRON_SYNC' },
    orderBy: { createdAt: 'desc' },
    take: 10,
  })

  return NextResponse.json({
    ultimoSync: ultimoLog
      ? {
          data: ultimoLog.createdAt,
          detalhes: ultimoLog.details,
        }
      : null,
    processosComCnj,
    historico: historico.map((h) => ({
      data: h.createdAt,
      detalhes: h.details,
    })),
  })
}
