import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/dashboard - Métricas agregadas para dashboard acionável
export async function GET() {
  const hoje = new Date()
  const inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())
  const fimHoje = new Date(inicioHoje.getTime() + 86400000)
  const proximos7 = new Date(hoje.getTime() + 7 * 86400000)
  const dias90Atras = new Date(hoje.getTime() - 90 * 86400000)

  const [
    processosAtivos,
    processosEncerrados,
    clientesAtivos,
    prazosHoje,
    prazos7Dias,
    prazosCriticos,
    audienciasHoje,
    tarefasAtrasadas,
    honorariosAtrasados,
    honorariosPendentes,
    recebidoMes,
    despesasMes,
    aReceberMes,
    aPagarMes,
    processosSemMovimento,
    tarefasPendentes,
  ] = await Promise.all([
    db.process.count({ where: { status: 'Ativo' } }),
    db.process.count({ where: { status: 'Encerrado' } }),
    db.client.count({ where: { status: 'Ativo' } }),
    db.deadline.findMany({
      where: { done: false, dueDate: { gte: inicioHoje, lt: fimHoje } },
      include: { process: true },
      orderBy: { dueDate: 'asc' },
    }),
    db.deadline.findMany({
      where: { done: false, dueDate: { gte: inicioHoje, lte: proximos7 } },
      include: { process: true },
      orderBy: { dueDate: 'asc' },
    }),
    db.deadline.count({
      where: { done: false, priority: 'Crítica' },
    }),
    db.deadline.findMany({
      where: {
        done: false,
        dueDate: { gte: inicioHoje, lt: fimHoje },
        title: { contains: 'Audiência' },
      },
      include: { process: true },
    }),
    db.task.count({
      where: {
        status: { not: 'Concluída' },
        dueDate: { lt: inicioHoje },
      },
    }),
    db.financial.findMany({
      where: { type: 'Receita', status: 'Atrasado' },
      include: { client: true, process: true },
    }),
    db.financial.findMany({
      where: {
        type: 'Receita',
        status: 'Pendente',
        dueDate: { gte: inicioHoje, lte: proximos7 },
      },
      include: { client: true, process: true },
    }),
    db.financial.aggregate({
      where: {
        type: 'Receita',
        status: 'Pago',
        paidDate: {
          gte: new Date(hoje.getFullYear(), hoje.getMonth(), 1),
          lt: new Date(hoje.getFullYear(), hoje.getMonth() + 1, 1),
        },
      },
      _sum: { amount: true },
    }),
    db.financial.aggregate({
      where: {
        type: 'Despesa',
        status: 'Pago',
        paidDate: {
          gte: new Date(hoje.getFullYear(), hoje.getMonth(), 1),
          lt: new Date(hoje.getFullYear(), hoje.getMonth() + 1, 1),
        },
      },
      _sum: { amount: true },
    }),
    db.financial.aggregate({
      where: {
        type: 'Receita',
        status: { in: ['Pendente', 'Atrasado'] },
      },
      _sum: { amount: true },
    }),
    db.financial.aggregate({
      where: {
        type: 'Despesa',
        status: { in: ['Pendente', 'Atrasado'] },
      },
      _sum: { amount: true },
    }),
    db.process.findMany({
      where: { status: 'Ativo' },
      include: { movements: { orderBy: { date: 'desc' }, take: 1 } },
    }),
    db.task.count({ where: { status: { not: 'Concluída' } } }),
  ])

  // Filtrar processos sem movimento há mais de 90 dias
  const processosParados = processosSemMovimento.filter((p) => {
    if (p.movements.length === 0) return true
    return new Date(p.movements[0].date) < dias90Atras
  })

  // Dados para gráficos: últimos 6 meses de receita vs despesa
  const mesesGrafico: { mes: string; receita: number; despesa: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const inicio = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1)
    const fim = new Date(hoje.getFullYear(), hoje.getMonth() - i + 1, 1)
    const [rec, desp] = await Promise.all([
      db.financial.aggregate({
        where: {
          type: 'Receita',
          status: 'Pago',
          paidDate: { gte: inicio, lt: fim },
        },
        _sum: { amount: true },
      }),
      db.financial.aggregate({
        where: {
          type: 'Despesa',
          status: 'Pago',
          paidDate: { gte: inicio, lt: fim },
        },
        _sum: { amount: true },
      }),
    ])
    mesesGrafico.push({
      mes: inicio.toLocaleDateString('pt-BR', { month: 'short' }),
      receita: rec._sum.amount || 0,
      despesa: desp._sum.amount || 0,
    })
  }

  // Distribuição por área
  const processosPorArea = await db.process.groupBy({
    by: ['area'],
    _count: { area: true },
    where: { status: 'Ativo' },
  })

  return NextResponse.json({
    hoje: inicioHoje.toISOString(),
    resumo: {
      processosAtivos,
      processosEncerrados,
      clientesAtivos,
      prazosHoje: prazosHoje.length,
      prazos7Dias: prazos7Dias.length,
      prazosCriticos,
      audienciasHoje: audienciasHoje.length,
      tarefasAtrasadas,
      tarefasPendentes,
      processosParados: processosParados.length,
      aReceber: aReceberMes._sum.amount || 0,
      aPagar: aPagarMes._sum.amount || 0,
      recebidoMes: recebidoMes._sum.amount || 0,
      despesasMes: despesasMes._sum.amount || 0,
    },
    prazosDeHoje: prazosHoje,
    proximosPrazos: prazos7Dias,
    audienciasHoje,
    honorariosAtrasados,
    honorariosPendentes,
    processosParados: processosParados.map((p) => ({
      id: p.id,
      title: p.title,
      cnj: p.cnj,
      ultimaMovimentacao: p.movements[0]?.date || null,
      diasParado: p.movements[0]
        ? Math.floor((hoje.getTime() - new Date(p.movements[0].date).getTime()) / 86400000)
        : 999,
    })),
    graficoMensal: mesesGrafico,
    processosPorArea: processosPorArea.map((p) => ({
      area: p.area || 'Não informado',
      total: p._count.area,
    })),
  })
}
