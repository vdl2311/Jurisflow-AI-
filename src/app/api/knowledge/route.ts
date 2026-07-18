import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import ZAI from 'z-ai-web-dev-sdk'

// GET /api/knowledge - lista artigos com busca
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') || ''
  const category = searchParams.get('category') || ''
  const area = searchParams.get('area') || ''

  const where: any = {}
  if (search) {
    where.OR = [
      { title: { contains: search } },
      { content: { contains: search } },
      { summary: { contains: search } },
      { tags: { contains: search } },
    ]
  }
  if (category && category !== 'Todas') where.category = category
  if (area && area !== 'Todas') where.area = area

  const articles = await db.knowledgeArticle.findMany({
    where,
    orderBy: { updatedAt: 'desc' },
  })

  return NextResponse.json(articles)
}

// POST /api/knowledge - criar artigo
export async function POST(req: NextRequest) {
  const body = await req.json()
  const article = await db.knowledgeArticle.create({
    data: {
      title: body.title,
      content: body.content,
      summary: body.summary || null,
      category: body.category || 'Doutrina',
      area: body.area || null,
      tags: body.tags || null,
      source: body.source || 'Caso Próprio',
      sourceUrl: body.sourceUrl || null,
      author: body.author || 'Sistema',
      confidence: body.confidence || 80,
      verified: body.verified || false,
      processId: body.processId || null,
    },
  })

  await db.auditLog.create({
    data: {
      user: 'Sistema',
      action: 'CREATE',
      entity: 'KnowledgeArticle',
      entityId: article.id,
      details: `Artigo de conhecimento criado: ${article.title}`,
    },
  })

  return NextResponse.json(article, { status: 201 })
}

// POST /api/knowledge/summarize - gera resumo com IA
export async function PUT(req: NextRequest) {
  const body = await req.json()
  const { articleId } = body

  const article = await db.knowledgeArticle.findUnique({ where: { id: articleId } })
  if (!article) return NextResponse.json({ error: 'Artigo não encontrado' }, { status: 404 })

  try {
    const zai = await ZAI.create()
    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'assistant',
          content: `Você é um especialista jurídico. Resuma o seguinte artigo em no máximo 200 caracteres, destacando os pontos principais e a tese central. Seja direto e técnico.\n\nARTIGO:\n${article.content}`,
        },
        { role: 'user', content: 'Gere o resumo.' },
      ],
      thinking: { type: 'disabled' },
      temperature: 0.3,
      max_tokens: 200,
    })

    const summary = completion.choices[0]?.message?.content || ''

    const updated = await db.knowledgeArticle.update({
      where: { id: articleId },
      data: { summary },
    })

    return NextResponse.json({ ...updated, summary })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
