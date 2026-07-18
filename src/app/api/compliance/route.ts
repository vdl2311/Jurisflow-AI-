import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import ZAI from 'z-ai-web-dev-sdk'

// GET /api/compliance - lista regras de conformidade
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category')

  const where: any = {}
  if (category && category !== 'Todas') where.category = category

  const rules = await db.complianceRule.findMany({
    where,
    include: { _count: { select: { checks: true } } },
    orderBy: { createdAt: 'desc' },
  })

  // Buscar verificações recentes
  const recentChecks = await db.complianceCheck.findMany({
    include: { rule: true },
    orderBy: { checkedAt: 'desc' },
    take: 20,
  })

  return NextResponse.json({
    rules: rules.map((r) => ({
      ...r,
      checksCount: r._count.checks,
    })),
    recentChecks,
  })
}

// POST /api/compliance - criar regra
export async function POST(req: NextRequest) {
  const body = await req.json()
  const rule = await db.complianceRule.create({
    data: {
      name: body.name,
      category: body.category || 'LGPD',
      description: body.description,
      rule: body.rule,
      severity: body.severity || 'Média',
      actionType: body.actionType || 'Aviso',
      enabled: body.enabled !== false,
    },
  })
  return NextResponse.json(rule, { status: 201 })
}

// POST /api/compliance/check - verifica conformidade de uma entidade contra todas as regras
// Body: { entityType, entityId, entityName, content, type? }
export async function PUT(req: NextRequest) {
  const body = await req.json()
  const { entityType, entityId, entityName, content, type } = body

  if (!content || !entityType) {
    return NextResponse.json({ error: 'entityType e content são obrigatórios' }, { status: 400 })
  }

  // Filtra regras por categoria se type fornecido
  const where: any = { enabled: true }
  if (type) where.category = type

  const rules = await db.complianceRule.findMany({ where })

  // Usa IA para verificar conformidade de cada regra
  const zai = await ZAI.create()
  const resultados: any[] = []

  for (const rule of rules) {
    const prompt = `Você é um auditor de conformidade. Verifique se o conteúdo abaixo viola a seguinte regra:

**REGRA:** ${rule.name}
**DESCRIÇÃO:** ${rule.description}
**CRITÉRIO:** ${rule.rule}
**CATEGORIA:** ${rule.category}
**SEVERIDADE:** ${rule.severity}

**CONTEÚDO A VERIFICAR:**
---
${content}
---

Responda em JSON estrito:
{
  "passed": true/false,
  "violations": ["descrição da violação 1", ...],
  "notes": "observações técnicas"
}

Se não houver violação: {"passed": true, "violations": [], "notes": "Conforme."}`

    try {
      const completion = await zai.chat.completions.create({
        messages: [
          { role: 'assistant', content: prompt },
          { role: 'user', content: 'Verifique conformidade.' },
        ],
        thinking: { type: 'disabled' },
        temperature: 0.2,
        max_tokens: 600,
      })

      const responseText = completion.choices[0]?.message?.content || ''
      // Extrair JSON
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      let parsed = { passed: true, violations: [], notes: 'Não foi possível analisar.' }
      if (jsonMatch) {
        try { parsed = JSON.parse(jsonMatch[0]) } catch {}
      }

      // Registrar verificação
      const check = await db.complianceCheck.create({
        data: {
          ruleId: rule.id,
          entityType,
          entityId: entityId || null,
          entityName: entityName || null,
          passed: parsed.passed,
          notes: JSON.stringify({ violations: parsed.violations, notes: parsed.notes, response: responseText }),
        },
      })

      resultados.push({
        rule: rule.name,
        category: rule.category,
        severity: rule.severity,
        passed: parsed.passed,
        violations: parsed.violations || [],
        notes: parsed.notes || '',
        checkId: check.id,
      })
    } catch (error: any) {
      resultados.push({
        rule: rule.name,
        category: rule.category,
        severity: rule.severity,
        passed: false,
        violations: ['Erro ao verificar: ' + error.message],
        notes: '',
      })
    }
  }

  // Auditoria
  await db.auditLog.create({
    data: {
      user: 'Sistema',
      action: 'COMPLIANCE_CHECK',
      entity: entityType,
      entityId: entityId,
      details: `Verificação de conformidade em ${entityName || entityType}. ${resultados.filter((r) => r.passed).length}/${resultados.length} regras aprovadas.`,
    },
  })

  return NextResponse.json({
    entityType,
    entityId,
    entityName,
    totalRules: rules.length,
    passed: resultados.filter((r) => r.passed).length,
    failed: resultados.filter((r) => !r.passed).length,
    resultados,
    checkedAt: new Date().toISOString(),
  })
}
