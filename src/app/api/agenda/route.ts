import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/agenda - agenda jurídica (combina prazos + audiências + tarefas)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const inicio = searchParams.get('inicio')
  const fim = searchParams.get('fim')

  const hoje = new Date()
  const inicioDate = inicio ? new Date(inicio) : new Date(hoje.getFullYear(), hoje.getMonth(), 1)
  const fimDate = fim ? new Date(fim) : new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0)
  fimDate.setHours(23, 59, 59)

  const [prazos, tarefas] = await Promise.all([
    db.deadline.findMany({
      where: {
        done: false,
        dueDate: { gte: inicioDate, lte: fimDate },
      },
      include: { process: { include: { client: true } } },
    }),
    db.task.findMany({
      where: {
        dueDate: { gte: inicioDate, lte: fimDate },
        status: { not: 'Concluída' },
      },
      include: { process: true, client: true },
    }),
  ])

  const eventos = [
    ...prazos.map((p) => ({
      id: p.id,
      tipo: p.title.toLowerCase().includes('audiência') ? 'audiencia' : 'prazo',
      titulo: p.title,
      data: p.dueDate,
      prioridade: p.priority,
      responsavel: p.responsible,
      processo: p.process?.title,
      cliente: p.process?.client?.name,
      processId: p.processId,
      allDay: true,
    })),
    ...tarefas.map((t) => ({
      id: t.id,
      tipo: 'tarefa',
      titulo: t.title,
      data: t.dueDate!,
      prioridade: t.priority,
      responsavel: t.assignee,
      processo: t.process?.title,
      cliente: t.client?.name,
      processId: t.processId,
      allDay: true,
    })),
  ]

  return NextResponse.json({ eventos, inicio: inicioDate, fim: fimDate })
}
