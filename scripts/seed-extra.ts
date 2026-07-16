// Seed expandido: usuários, contratos, automações, notificações, planos
import { db } from '../src/lib/db'

async function main() {
  console.log('🧹 Limpando dados antigos...')
  await db.subscription.deleteMany()
  await db.plan.deleteMany()
  await db.conflictCheck.deleteMany()
  await db.timeEntry.deleteMany()
  await db.notification.deleteMany()
  await db.automation.deleteMany()
  await db.contract.deleteMany()
  await db.contractTemplate.deleteMany()
  await db.user.deleteMany()

  console.log('👥 Criando usuários da equipe...')
  await db.user.createMany({
    data: [
      { email: 'patricia@jusflow.com', password: '$2a$10$hashdemo', name: 'Dra. Patrícia Almeida', role: 'Sócio', oab: 'OAB/SP 123.456', permissions: 'all', twoFactorEnabled: true },
      { email: 'roberto@jusflow.com', password: '$2a$10$hashdemo', name: 'Dr. Roberto Lima', role: 'Advogado', oab: 'OAB/SP 234.567', permissions: 'processes,clients,deadlines,tasks' },
      { email: 'pedro@jusflow.com', password: '$2a$10$hashdemo', name: 'Pedro Souza', role: 'Estagiário', oab: null, permissions: 'tasks,documents' },
      { email: 'ana@jusflow.com', password: '$2a$10$hashdemo', name: 'Ana Costa', role: 'Secretária', permissions: 'clients,schedule' },
      { email: 'admin@jusflow.com', password: '$2a$10$hashdemo', name: 'Administrador', role: 'Administrador', permissions: 'all', twoFactorEnabled: true },
    ],
  })

  console.log('📋 Criando templates de contratos...')
  const tplHonorarios = await db.contractTemplate.create({
    data: {
      name: 'Contrato de Honorários Advocatícios',
      category: 'Honorários',
      content: `CONTRATO DE HONORÁRIOS ADVOCATÍCIOS

Pelo presente instrumento particular, de um lado:
CONTRATANTE: {{cliente_nome}}, {{cliente_documento}}, residente em {{cliente_endereco}},
e de outro lado:
CONTRATADO: Escritório de Advocacia JusFlow, inscrito na OAB/SP sob nº 123.456,

Têm entre si justo e contratado o que se segue:

CLÁUSULA 1ª - DO OBJETO
O CONTRATADO prestará serviços advocatícios ao CONTRATANTE, consistentes em:
{{objeto}}

CLÁUSULA 2ª - DOS HONORÁRIOS
Pelos serviços prestados, o CONTRATANTE pagará ao CONTRATADO honorários no valor de R$ {{valor}} ({{valor_extenso}}), pagos da seguinte forma:
{{forma_pagamento}}

CLÁUSULA 3ª - DAS OBRIGAÇÕES
{{obrigacoes}}

CLÁUSULA 4ª - DA RESCISÃO
{{rescisao}}

CLÁUSULA 5ª - DO FORO
Fica eleito o foro da Comarca de {{comarca}} para dirimir quaisquer controvérsias.

São Paulo, {{data}}.

_______________________________
{{cliente_nome}} - CONTRATANTE

_______________________________
Dra. Patrícia Almeida - OAB/SP 123.456
Escritório JusFlow - CONTRATADO`,
      variables: JSON.stringify(['cliente_nome', 'cliente_documento', 'cliente_endereco', 'objeto', 'valor', 'valor_extenso', 'forma_pagamento', 'obrigacoes', 'rescisao', 'comarca', 'data']),
    },
  })

  const tplProcuracao = await db.contractTemplate.create({
    data: {
      name: 'Procuração Ad Judicia',
      category: 'Procuração',
      content: `PROCURAÇÃO AD JUDICIA ET EXTRA

OUTORGANTE: {{cliente_nome}}, {{cliente_documento}}, residente e domiciliado em {{cliente_endereco}}.

OUTORGADOS: Dr. Roberto Lima - OAB/SP 234.567, Dra. Patrícia Almeida - OAB/SP 123.456.

PODERES: Pela presente procuração, o outorgante nomeia e constitui seus bastante procuradores os advogados acima qualificados, conferindo-lhes os poderes da cláusula "ad judicia et extra" e mais os especiais a seguir discriminados, podendo agir em juízo ou fora dele, receber citação, confessar, reconhecer a procedência do pedido, transigir, desistir, renunciar ao direito sobre o qual se funda a ação, receber, dar quitação, firmar compromissos e substabelecer, com ou sem reservas de poderes, agindo em conjunto ou separadamente.

São Paulo, {{data}}.

_______________________________
{{cliente_nome}}`,
      variables: JSON.stringify(['cliente_nome', 'cliente_documento', 'cliente_endereco', 'data']),
    },
  })

  await db.contractTemplate.create({
    data: {
      name: 'Acordo de Confidencialidade (NDA)',
      category: 'Confidencialidade',
      content: `ACORDO DE CONFIDENCIALIDADE

PARTES:
{{parte1}} e {{parte2}}

CLÁUSULA 1ª - DO OBJETO
As partes comprometem-se a manter em sigilo todas as informações confidenciais trocadas durante a relação profissional.

CLÁUSULA 2ª - DAS OBRIGAÇÕES
{{obrigacoes}}

CLÁUSULA 3ª - DA VIGÊNCIA
O presente acordo vigorará por {{prazo}} meses.

{{data}}.`,
      variables: JSON.stringify(['parte1', 'parte2', 'obrigacoes', 'prazo', 'data']),
    },
  })

  await db.contractTemplate.create({
    data: {
      name: 'Termo de Acordo',
      category: 'Acordo',
      content: `TERMO DE ACORDO

PARTES: {{parte1}} e {{parte2}}

CONDIÇÕES:
{{condicoes}}

VALOR DO ACORDO: R$ {{valor}}

FORMA DE PAGAMENTO: {{pagamento}}

{{data}}.`,
      variables: JSON.stringify(['parte1', 'parte2', 'condicoes', 'valor', 'pagamento', 'data']),
    },
  })

  console.log('📑 Criando contratos de exemplo...')
  const clientes = await db.client.findMany({ take: 3 })
  if (clientes.length > 0) {
    await db.contract.create({
      data: {
        title: 'Contrato de Honorários - Construtora Horizonte',
        templateId: tplHonorarios.id,
        clientId: clientes[0].id,
        content: tplHonorarios.content
          .replace('{{cliente_nome}}', 'Construtora Horizonte Ltda')
          .replace('{{cliente_documento}}', 'CNPJ: 12.345.678/0001-90')
          .replace('{{cliente_endereco}}', 'Av. Paulista, 1500 - São Paulo/SP')
          .replace('{{objeto}}', 'Acompanhamento mensal de processos trabalhistas')
          .replace('{{valor}}', '8.500,00')
          .replace('{{valor_extenso}}', 'oito mil e quinhentos reais')
          .replace('{{forma_pagamento}}', 'Mensalidade fixa até o dia 05 de cada mês')
          .replace('{{obrigacoes}}', 'O CONTRATADO compromete-se a zelar pelos interesses do CONTRATANTE com diligência e zelo.')
          .replace('{{rescisao}}', 'O contrato pode ser rescindido por qualquer das partes com aviso prévio de 30 dias.')
          .replace('{{comarca}}', 'São Paulo')
          .replace('{{data}}', new Date().toLocaleDateString('pt-BR')),
        status: 'Assinado',
        signedBy: 'Construtora Horizonte Ltda, Dra. Patrícia Almeida',
        signedAt: new Date(Date.now() - 10 * 86400000),
      },
    })

    await db.contract.create({
      data: {
        title: 'Procuração - Maria Aparecida Silva',
        templateId: tplProcuracao.id,
        clientId: clientes[1].id,
        content: tplProcuracao.content
          .replace('{{cliente_nome}}', 'Maria Aparecida Silva')
          .replace('{{cliente_documento}}', 'CPF: 123.456.789-00')
          .replace('{{cliente_endereco}}', 'Rua das Flores, 123 - São Paulo/SP')
          .replace('{{data}}', new Date().toLocaleDateString('pt-BR')),
        status: 'Enviado',
      },
    })
  }

  console.log('🤖 Criando automações...')
  await db.automation.createMany({
    data: [
      {
        name: 'Novo processo: criar pasta + tarefas padrão',
        trigger: 'novo_processo',
        actions: JSON.stringify([
          { type: 'criar_tarefa', title: 'Reunir documentos iniciais', priority: 'Alta' },
          { type: 'criar_tarefa', title: 'Gerar contrato de honorários', priority: 'Média' },
          { type: 'criar_tarefa', title: 'Agendar reunião com cliente', priority: 'Baixa' },
          { type: 'enviar_email', to: 'cliente', template: 'boas_vindas' },
        ]),
        enabled: true,
      },
      {
        name: 'Audiência marcada: avisos automáticos',
        trigger: 'nova_audiencia',
        actions: JSON.stringify([
          { type: 'enviar_email', to: 'cliente', template: 'audiencia_marcada' },
          { type: 'enviar_whatsapp', to: 'cliente', template: 'lembrete_audiencia' },
          { type: 'criar_tarefa', title: 'Preparar audiência (48h antes)', priority: 'Crítica' },
        ]),
        enabled: true,
      },
      {
        name: 'Honorário vencido: cobrança automática',
        trigger: 'honorario_vencido',
        actions: JSON.stringify([
          { type: 'enviar_email', to: 'cliente', template: 'cobranca_honorarios' },
          { type: 'enviar_whatsapp', to: 'cliente', template: 'cobranca_pix' },
          { type: 'gerar_pix', amount: 'auto' },
          { type: 'notificar_advogado', message: 'Honorário vencido - cobrança enviada' },
        ]),
        enabled: true,
      },
      {
        name: 'Novo andamento: resumir com IA + notificar',
        trigger: 'novo_andamento',
        actions: JSON.stringify([
          { type: 'resumir_ia', target: 'andamento' },
          { type: 'notificar_advogado', message: 'Novo andamento em processo' },
          { type: 'verificar_prazo', days: 15 },
        ]),
        enabled: true,
      },
    ],
  })

  console.log('🔔 Criando notificações...')
  await db.notification.createMany({
    data: [
      {
        type: 'prazo',
        title: 'Audiência inicial amanhã',
        description: 'Reclamação Trabalhista - João Santos vs Construtora Horizonte. 1ª Vara do Trabalho, 14h.',
        link: 'process-detail',
        priority: 'Crítica',
        read: false,
      },
      {
        type: 'honorario',
        title: 'Honorário em atraso',
        description: 'Construtora Horizonte - R$ 8.500,00 vencido há 10 dias.',
        link: 'financial',
        priority: 'Alta',
        read: false,
      },
      {
        type: 'tarefa',
        title: 'Tarefa crítica pendente',
        description: 'Reunir documentos fiscais - Distribuidora Norte (vence hoje).',
        link: 'tasks',
        priority: 'Crítica',
        read: false,
      },
      {
        type: 'sistema',
        title: 'Backup automático concluído',
        description: 'Backup diário realizado com sucesso às 03:00.',
        priority: 'Baixa',
        read: true,
        createdAt: new Date(Date.now() - 86400000),
      },
      {
        type: 'sistema',
        title: 'Novo recurso: Copiloto Jurídico com IA',
        description: 'Converse com o sistema e gere petições automaticamente.',
        link: 'copilot',
        priority: 'Média',
        read: false,
      },
    ],
  })

  console.log('⏱️ Criando registros de horas...')
  const procs = await db.process.findMany({ take: 4 })
  const horas: { description: string; duration: number; user: string; date: Date; processId?: string }[] = [
    { description: 'Revisão de petição inicial', duration: 2.5, user: 'Dra. Patrícia Almeida', date: new Date(Date.now() - 1 * 86400000) },
    { description: 'Audiência trabalhista', duration: 4.0, user: 'Dra. Patrícia Almeida', date: new Date(Date.now() - 3 * 86400000) },
    { description: 'Pesquisa jurisprudencial', duration: 3.0, user: 'Dr. Roberto Lima', date: new Date(Date.now() - 2 * 86400000) },
    { description: 'Redação de contestação', duration: 5.5, user: 'Dr. Roberto Lima', date: new Date(Date.now() - 5 * 86400000) },
    { description: 'Coleta de documentos', duration: 2.0, user: 'Pedro Souza', date: new Date(Date.now() - 1 * 86400000) },
    { description: 'Atendimento ao cliente', duration: 1.5, user: 'Ana Costa', date: new Date(Date.now() - 4 * 86400000) },
    { description: 'Análise de MS Tributário', duration: 6.0, user: 'Dra. Patrícia Almeida', date: new Date(Date.now() - 7 * 86400000) },
    { description: 'Reunião estratégica', duration: 1.0, user: 'Dr. Roberto Lima', date: new Date(Date.now() - 6 * 86400000) },
  ]
  for (let i = 0; i < horas.length; i++) {
    const h = horas[i]
    await db.timeEntry.create({
      data: {
        ...h,
        processId: procs[i % procs.length]?.id,
        clientId: procs[i % procs.length]?.clientId,
      },
    })
  }

  console.log('⚠️ Criando verificações de conflito de interesse...')
  await db.conflictCheck.createMany({
    data: [
      {
        clientName: 'João Santos',
        searchText: 'João Santos Construtora Horizonte',
        found: true,
        matches: JSON.stringify([
          { tipo: 'Parte contrária em processo existente', processo: 'Reclamação Trabalhista - João Santos vs Construtora Horizonte', clientId: procs[0]?.clientId || null },
        ]),
        checkedAt: new Date(Date.now() - 60 * 60000),
      },
      {
        clientName: 'Tech Solutions Brasil',
        searchText: 'Tech Solutions Brasil S.A.',
        found: false,
        checkedAt: new Date(Date.now() - 30 * 60000),
      },
    ],
  })

  console.log('💎 Criando planos SaaS...')
  const planStarter = await db.plan.create({
    data: {
      name: 'Starter',
      price: 199.0,
      maxUsers: 3,
      maxStorage: 5000,
      features: JSON.stringify(['processes', 'clients', 'deadlines', 'tasks', 'financial']),
      active: true,
    },
  })
  const planPro = await db.plan.create({
    data: {
      name: 'Pro',
      price: 499.0,
      maxUsers: 10,
      maxStorage: 50000,
      features: JSON.stringify(['processes', 'clients', 'deadlines', 'tasks', 'financial', 'copilot_ia', 'contracts', 'automations', 'portal_cliente']),
      active: true,
    },
  })
  await db.plan.create({
    data: {
      name: 'Enterprise',
      price: 999.0,
      maxUsers: 50,
      maxStorage: 500000,
      features: JSON.stringify(['processes', 'clients', 'deadlines', 'tasks', 'financial', 'copilot_ia', 'contracts', 'automations', 'portal_cliente', 'api_publica', 'multitenancy', 'sla_premium']),
      active: true,
    },
  })

  console.log('📅 Criando assinatura trial...')
  await db.subscription.create({
    data: {
      planId: planPro.id,
      status: 'Trial',
      startDate: new Date(Date.now() - 14 * 86400000),
      endDate: new Date(Date.now() + 14 * 86400000),
    },
  })

  console.log('✅ Seed expandido concluído!')
  console.log('   - 5 usuários da equipe')
  console.log('   - 4 templates de contrato')
  console.log('   - 2 contratos gerados')
  console.log('   - 4 automações')
  console.log('   - 5 notificações')
  console.log('   - 8 registros de horas')
  console.log('   - 2 verificações de conflito')
  console.log('   - 3 planos SaaS + 1 assinatura trial')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
