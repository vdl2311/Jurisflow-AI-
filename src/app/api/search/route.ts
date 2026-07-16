import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/search?q=...
// Busca global: clientes, processos, tarefas, prazos, documentos, financeiro
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q = (searchParams.get('q') || '').trim().toLowerCase()
  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] })
  }

  const [clients, processes, tasks, deadlines, financials, documents] = await Promise.all([
    db.client.findMany({
      where: {
        OR: [
          { name: { contains: q } },
          { document: { contains: q } },
          { email: { contains: q } },
          { tags: { contains: q } },
        ],
      },
      take: 5,
    }),
    db.process.findMany({
      where: {
        OR: [
          { title: { contains: q } },
          { cnj: { contains: q } },
          { parties: { contains: q } },
          { subject: { contains: q } },
        ],
      },
      include: { client: true },
      take: 5,
    }),
    db.task.findMany({
      where: {
        OR: [{ title: { contains: q } }, { description: { contains: q } }],
      },
      take: 5,
    }),
    db.deadline.findMany({
      where: {
        OR: [{ title: { contains: q } }, { notes: { contains: q } }],
      },
      include: { process: true },
      take: 5,
    }),
    db.financial.findMany({
      where: {
        OR: [{ description: { contains: q } }, { category: { contains: q } }],
      },
      take: 5,
    }),
    db.document.findMany({
      where: {
        OR: [{ name: { contains: q } }, { tags: { contains: q } }],
      },
      take: 5,
    }),
  ])

  const results = [
    ...clients.map((c) => ({
      tipo: 'Cliente',
      id: c.id,
      titulo: c.name,
      subtitulo: c.document || '',
      info: c.email || c.phone || '',
    })),
    ...processes.map((p) => ({
      tipo: 'Processo',
      id: p.id,
      titulo: p.title,
      subtitulo: p.cnj || '',
      info: p.client?.name || p.area || '',
    })),
    ...tasks.map((t) => ({
      tipo: 'Tarefa',
      id: t.id,
      titulo: t.title,
      subtitulo: t.status,
      info: t.assignee || '',
    })),
    ...deadlines.map((d) => ({
      tipo: 'Prazo',
      id: d.id,
      titulo: d.title,
      subtitulo: new Date(d.dueDate).toLocaleDateString('pt-BR'),
      info: d.process?.title || '',
    })),
    ...financials.map((f) => ({
      tipo: f.type,
      id: f.id,
      titulo: f.description,
      subtitulo: `R$ ${f.amount.toFixed(2)}`,
      info: f.status,
    })),
    ...documents.map((d) => ({
      tipo: 'Documento',
      id: d.id,
      titulo: d.name,
      subtitulo: d.type,
      info: d.tags || '',
    })),
  ]

  return NextResponse.json({ results, total: results.length })
}
