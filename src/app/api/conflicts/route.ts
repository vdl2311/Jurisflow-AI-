import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/conflicts - verifica conflito de interesse
export async function POST(req: NextRequest) {
  const body = await req.json()
  const searchText: string = (body.searchText || '').toLowerCase().trim()
  const clientName = body.clientName || ''

  if (!searchText) {
    return NextResponse.json({ error: 'Texto de busca necessário' }, { status: 400 })
  }

  // Buscar em clientes, processos e partes
  const [clientes, processos] = await Promise.all([
    db.client.findMany({
      where: {
        OR: [
          { name: { contains: searchText } },
          { document: { contains: searchText } },
        ],
      },
      take: 20,
    }),
    db.process.findMany({
      where: {
        OR: [
          { title: { contains: searchText } },
          { parties: { contains: searchText } },
          { cnj: { contains: searchText } },
        ],
      },
      include: { client: true },
      take: 20,
    }),
  ])

  const matches: { tipo: string; descricao: string }[] = []

  for (const c of clientes) {
    matches.push({
      tipo: 'Cliente existente',
      descricao: `${c.name} (${c.document || 'sem documento'}) - Status: ${c.status}`,
    })
  }

  for (const p of processos) {
    const partes = p.parties || ''
    // Se o nome pesquisado aparece nas partes contrárias
    if (partes.toLowerCase().includes(searchText)) {
      matches.push({
        tipo: 'Parte em processo existente',
        descricao: `Processo: ${p.title} | Cliente: ${p.client.name} | Partes: ${partes}`,
      })
    } else {
      matches.push({
        tipo: 'Processo relacionado',
        descricao: `${p.title} (CNJ: ${p.cnj || '-'}) - Cliente: ${p.client.name}`,
      })
    }
  }

  const found = matches.length > 0

  // Registrar verificação
  const check = await db.conflictCheck.create({
    data: {
      clientName,
      searchText,
      found,
      matches: JSON.stringify(matches),
    },
  })

  await db.auditLog.create({
    data: {
      user: 'Sistema',
      action: 'CONFLICT_CHECK',
      entity: 'ConflictCheck',
      entityId: check.id,
      details: `Verificação de conflito: "${searchText}" - ${found ? 'CONFLITO ENCONTRADO' : 'Sem conflitos'}`,
    },
  })

  return NextResponse.json({
    found,
    totalMatches: matches.length,
    matches,
    checkedAt: check.checkedAt,
  })
}

// GET /api/conflicts - histórico
export async function GET() {
  const checks = await db.conflictCheck.findMany({ orderBy: { checkedAt: 'desc' }, take: 30 })
  return NextResponse.json(
    checks.map((c) => ({ ...c, matches: c.matches ? JSON.parse(c.matches) : [] }))
  )
}
