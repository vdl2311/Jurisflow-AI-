import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/admin - métricas do painel administrativo
export async function GET() {
  const [
    totalUsers,
    totalClients,
    totalProcesses,
    totalDocuments,
    totalFinancial,
    auditLogs,
    subscription,
    automations,
    plans,
  ] = await Promise.all([
    db.user.count(),
    db.client.count(),
    db.process.count(),
    db.document.count(),
    db.financial.aggregate({ _sum: { amount: true } }),
    db.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 50 }),
    db.subscription.findFirst({
      include: { plan: true },
      orderBy: { createdAt: 'desc' },
    }),
    db.automation.findMany(),
    db.plan.findMany({ include: { subscriptions: true } }),
  ])

  // Estatísticas de uso
  const storageUsed = await db.document.count()
  const storageMB = storageUsed * 1.5 // simulação ~1.5MB por doc

  // Métricas dos últimos 30 dias
  const trintaDiasAtras = new Date(Date.now() - 30 * 86400000)
  const [
    logins30d,
    processos30d,
    clientes30d,
    tarefasConcluidas30d,
    recebido30d,
  ] = await Promise.all([
    db.auditLog.count({
      where: { action: 'LOGIN', createdAt: { gte: trintaDiasAtras } },
    }),
    db.process.count({ where: { createdAt: { gte: trintaDiasAtras } } }),
    db.client.count({ where: { createdAt: { gte: trintaDiasAtras } } }),
    db.task.count({
      where: { status: 'Concluída', updatedAt: { gte: trintaDiasAtras } },
    }),
    db.financial.aggregate({
      where: {
        type: 'Receita',
        status: 'Pago',
        paidDate: { gte: trintaDiasAtras },
      },
      _sum: { amount: true },
    }),
  ])

  return NextResponse.json({
    resumo: {
      totalUsers,
      totalClients,
      totalProcesses,
      totalDocuments,
      totalFinanceiro: totalFinancial._sum.amount || 0,
      storageUsedMB: Math.round(storageMB),
      storageLimitMB: subscription?.plan.maxStorage || 5000,
      maxUsers: subscription?.plan.maxUsers || 3,
    },
    metricas30d: {
      logins: logins30d,
      novosProcessos: processos30d,
      novosClientes: clientes30d,
      tarefasConcluidas: tarefasConcluidas30d,
      recebido: recebido30d._sum.amount || 0,
    },
    subscription: subscription
      ? {
          plano: subscription.plan.name,
          status: subscription.status,
          startDate: subscription.startDate,
          endDate: subscription.endDate,
          price: subscription.plan.price,
          maxUsers: subscription.plan.maxUsers,
          maxStorage: subscription.plan.maxStorage,
          features: subscription.plan.features,
        }
      : null,
    plans: plans.map((p) => ({
      ...p,
      subscriptionsCount: p.subscriptions.length,
    })),
    automations: automations.map((a) => ({
      ...a,
      actions: JSON.parse(a.actions),
    })),
    auditLogs,
  })
}
