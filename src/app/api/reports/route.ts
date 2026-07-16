import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/reports?type=clientes|processos|financeiro|custas|honorarios|audiencias|produtividade|advogados|tribunal|area
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type') || 'processos'
  const inicio = searchParams.get('inicio')
  const fim = searchParams.get('fim')

  const hoje = new Date()
  const inicioDate = inicio ? new Date(inicio) : new Date(hoje.getFullYear(), hoje.getMonth(), 1)
  const fimDate = fim ? new Date(fim) : hoje

  let resultado: Record<string, unknown> = {}

  switch (type) {
    case 'clientes': {
      const porStatus = await db.client.groupBy({ by: ['status'], _count: { status: true } })
      const porTipo = await db.client.groupBy({ by: ['type'], _count: { type: true } })
      const novos = await db.client.count({
        where: { createdAt: { gte: inicioDate, lte: fimDate } },
      })
      const topClientes = await db.client.findMany({
        include: { _count: { select: { processes: true } } },
        orderBy: { processes: { _count: 'desc' } },
        take: 10,
      })
      resultado = {
        titulo: 'Relatório de Clientes',
        periodo: { inicio: inicioDate, fim: fimDate },
        porStatus: porStatus.map((s) => ({ status: s.status, total: s._count.status })),
        porTipo: porTipo.map((t) => ({ tipo: t.type, total: t._count.type })),
        novosNoPeriodo: novos,
        topClientes: topClientes.map((c) => ({
          nome: c.name,
          status: c.status,
          processos: c._count.processes,
        })),
      }
      break
    }

    case 'processos': {
      const porStatus = await db.process.groupBy({ by: ['status'], _count: { status: true } })
      const porArea = await db.process.groupBy({ by: ['area'], _count: { area: true } })
      const porRisco = await db.process.groupBy({ by: ['risk'], _count: { risk: true } })
      const porResponsavel = await db.process.groupBy({
        by: ['responsibleId'],
        _count: { responsibleId: true },
      })
      const valorTotal = await db.process.aggregate({ _sum: { caseValue: true } })
      resultado = {
        titulo: 'Relatório de Processos',
        porStatus: porStatus.map((s) => ({ status: s.status, total: s._count.status })),
        porArea: porArea.map((a) => ({ area: a.area, total: a._count.area })),
        porRisco: porRisco.map((r) => ({ risco: r.risk, total: r._count.risk })),
        porResponsavel: porResponsavel.map((r) => ({
          advogado: r.responsibleId,
          total: r._count.responsibleId,
        })),
        valorTotalCausas: valorTotal._sum.caseValue || 0,
      }
      break
    }

    case 'financeiro': {
      const receitas = await db.financial.aggregate({
        where: { type: 'Receita', status: 'Pago', paidDate: { gte: inicioDate, lte: fimDate } },
        _sum: { amount: true },
      })
      const despesas = await db.financial.aggregate({
        where: { type: 'Despesa', status: 'Pago', paidDate: { gte: inicioDate, lte: fimDate } },
        _sum: { amount: true },
      })
      const aReceber = await db.financial.aggregate({
        where: { type: 'Receita', status: { in: ['Pendente', 'Atrasado'] } },
        _sum: { amount: true },
      })
      const aPagar = await db.financial.aggregate({
        where: { type: 'Despesa', status: { in: ['Pendente', 'Atrasado'] } },
        _sum: { amount: true },
      })
      const porCategoria = await db.financial.groupBy({
        by: ['category', 'type'],
        _sum: { amount: true },
        where: { status: 'Pago', paidDate: { gte: inicioDate, lte: fimDate } },
      })
      resultado = {
        titulo: 'Relatório Financeiro',
        periodo: { inicio: inicioDate, fim: fimDate },
        recebido: receitas._sum.amount || 0,
        pago: despesas._sum.amount || 0,
        aReceber: aReceber._sum.amount || 0,
        aPagar: aPagar._sum.amount || 0,
        saldo: (receitas._sum.amount || 0) - (despesas._sum.amount || 0),
        porCategoria: porCategoria.map((c) => ({
          categoria: c.category,
          tipo: c.type,
          total: c._sum.amount,
        })),
      }
      break
    }

    case 'honorarios': {
      const honorarios = await db.financial.findMany({
        where: { category: 'Honorários' },
        include: { client: true, process: true },
        orderBy: { dueDate: 'desc' },
      })
      const porStatus = await db.financial.groupBy({
        by: ['status'],
        _count: { status: true },
        _sum: { amount: true },
        where: { category: 'Honorários' },
      })
      resultado = {
        titulo: 'Relatório de Honorários',
        porStatus: porStatus.map((s) => ({
          status: s.status,
          quantidade: s._count.status,
          total: s._sum.amount,
        })),
        totalGeral: honorarios.reduce((s, h) => s + h.amount, 0),
        itens: honorarios.map((h) => ({
          descricao: h.description,
          cliente: h.client?.name,
          valor: h.amount,
          vencimento: h.dueDate,
          status: h.status,
        })),
      }
      break
    }

    case 'produtividade': {
      const horas = await db.timeEntry.findMany({
        where: { date: { gte: inicioDate, lte: fimDate } },
        include: { user: true, process: true, client: true },
      })
      const porUsuario: Record<string, { horas: number; billable: number }> = {}
      for (const h of horas) {
        if (!porUsuario[h.user]) porUsuario[h.user] = { horas: 0, billable: 0 }
        porUsuario[h.user].horas += h.duration
        if (h.billable) porUsuario[h.user].billable += h.duration
      }
      const tarefasConcluidas = await db.task.count({
        where: { status: 'Concluída', updatedAt: { gte: inicioDate, lte: fimDate } },
      })
      resultado = {
        titulo: 'Relatório de Produtividade',
        periodo: { inicio: inicioDate, fim: fimDate },
        totalHoras: horas.reduce((s, h) => s + h.duration, 0),
        horasFaturaveis: horas.filter((h) => h.billable).reduce((s, h) => s + h.duration, 0),
        tarefasConcluidas,
        porUsuario: Object.entries(porUsuario).map(([u, d]) => ({
          usuario: u,
          horas: d.horas,
          faturaveis: d.billable,
        })),
      }
      break
    }

    case 'advogados': {
      const advogados = await db.process.groupBy({
        by: ['responsibleId'],
        _count: { _all: true },
        _sum: { caseValue: true },
      })
      resultado = {
        titulo: 'Relatório por Advogado',
        advogados: advogados.map((a) => ({
          advogado: a.responsibleId,
          processos: a._count._all,
          valorCausas: a._sum.caseValue || 0,
        })),
      }
      break
    }

    case 'tribunal': {
      const porTribunal = await db.process.groupBy({
        by: ['court'],
        _count: { court: true },
      })
      resultado = {
        titulo: 'Processos por Tribunal',
        tribunais: porTribunal.map((t) => ({
          tribunal: t.court,
          total: t._count.court,
        })),
      }
      break
    }

    case 'area': {
      const porArea = await db.process.groupBy({
        by: ['area'],
        _count: { area: true },
        _sum: { caseValue: true },
      })
      resultado = {
        titulo: 'Processos por Área',
        areas: porArea.map((a) => ({
          area: a.area,
          total: a._count.area,
          valorCausas: a._sum.caseValue || 0,
        })),
      }
      break
    }

    default:
      resultado = { error: 'Tipo de relatório inválido' }
  }

  return NextResponse.json(resultado)
}
