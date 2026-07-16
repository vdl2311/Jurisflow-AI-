// Seed com dados realistas de um escritório de advocacia
import { db } from '../src/lib/db'

async function main() {
  // Limpar dados existentes
  await db.auditLog.deleteMany()
  await db.timelineEntry.deleteMany()
  await db.document.deleteMany()
  await db.financial.deleteMany()
  await db.task.deleteMany()
  await db.deadline.deleteMany()
  await db.movement.deleteMany()
  await db.process.deleteMany()
  await db.client.deleteMany()

  // ============ CLIENTES ============
  const clientes = await Promise.all([
    db.client.create({
      data: {
        name: 'Construtora Horizonte Ltda',
        type: 'PF',
        document: '12.345.678/0001-90',
        email: 'juridico@horizonte.com.br',
        phone: '(11) 3322-1100',
        mobile: '(11) 98765-4321',
        address: 'Av. Paulista, 1500 - 10º andar',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01310-100',
        status: 'Ativo',
        tags: 'Construtora,Recorrente,PJ',
        notes: 'Cliente desde 2020. Volume alto de processos trabalhistas.',
      },
    }),
    db.client.create({
      data: {
        name: 'Maria Aparecida Silva',
        type: 'PF',
        document: '123.456.789-00',
        email: 'maria.silva@email.com',
        phone: '(11) 3456-7890',
        mobile: '(11) 99876-5432',
        address: 'Rua das Flores, 123 - Apto 45',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '02030-000',
        status: 'Ativo',
        tags: 'Trabalhista,Indenização',
        notes: 'Ação trabalhista contra ex-empregador.',
      },
    }),
    db.client.create({
      data: {
        name: 'Tech Solutions Brasil S.A.',
        type: 'PJ',
        document: '98.765.432/0001-10',
        email: 'legal@techsolutions.com.br',
        phone: '(11) 3000-2000',
        mobile: '(11) 91234-5678',
        address: 'Rua Vergueiro, 2000',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '04101-000',
        status: 'Ativo',
        tags: 'Tecnologia,Contratos,Recorrente',
        notes: 'Consultoria mensal + contratos comerciais.',
      },
    }),
    db.client.create({
      data: {
        name: 'João Pedro Mendes',
        type: 'PF',
        document: '987.654.321-00',
        email: 'joao.mendes@email.com',
        phone: '(21) 2345-6789',
        mobile: '(21) 98888-7777',
        address: 'Av. Atlântica, 500 - Apto 101',
        city: 'Rio de Janeiro',
        state: 'RJ',
        zipCode: '22021-000',
        status: 'Prospect',
        tags: 'Família,Sucessão',
        notes: 'Inventário do pai. Aguardando documentos.',
      },
    }),
    db.client.create({
      data: {
        name: 'Distribuidora Norte Ltda',
        type: 'PJ',
        document: '45.678.901/0001-23',
        email: 'contato@norte.com.br',
        phone: '(11) 4000-5000',
        mobile: '(11) 95555-4444',
        address: 'Rod. Anhanguera, km 25',
        city: 'Jundiaí',
        state: 'SP',
        zipCode: '13213-000',
        status: 'Ativo',
        tags: 'Logística,Tributário',
        notes: 'Defesa em auto de infração fiscal.',
      },
    }),
    db.client.create({
      data: {
        name: 'Carolina Ferreira Souza',
        type: 'PF',
        document: '456.789.123-00',
        email: 'carol.ferreira@email.com',
        phone: '(11) 3222-9000',
        mobile: '(11) 97777-6666',
        address: 'Rua dos Pinheiros, 800',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '05422-000',
        status: 'Inativo',
        tags: 'Consumidor',
        notes: 'Caso encerrado em 2024. Possível reabertura.',
      },
    }),
  ])

  // ============ PROCESSOS ============
  const hoje = new Date()
  const diasAtras = (d: number) => new Date(hoje.getTime() - d * 86400000)
  const diasFrente = (d: number) => new Date(hoje.getTime() + d * 86400000)

  const processos = await Promise.all([
    db.process.create({
      data: {
        cnj: '0012345-67.2023.5.02.0001',
        title: 'Reclamação Trabalhista - João Santos vs Construtora Horizonte',
        court: 'TRT-2',
        section: '1ª Vara do Trabalho - São Paulo',
        classType: 'Reclamação Trabalhista',
        subject: 'Verbas rescisórias e horas extras',
        caseValue: 85000.0,
        parties: 'Reclamante: João Santos | Reclamada: Construtora Horizonte Ltda',
        status: 'Ativo',
        area: 'Trabalhista',
        responsibleId: 'Dra. Patrícia Almeida',
        risk: 'Médio',
        clientId: clientes[0].id,
      },
    }),
    db.process.create({
      data: {
        cnj: '0023456-78.2024.8.26.0100',
        title: 'Indenização por Danos Morais - Maria Aparecida vs Banco XYZ',
        court: 'TJSP',
        section: '3ª Vara Cível - São Paulo',
        classType: 'Procedimento Comum Cível',
        subject: 'Indenização por inscrição indevida em órgãos de proteção',
        caseValue: 50000.0,
        parties: 'Autora: Maria Aparecida Silva | Réu: Banco XYZ',
        status: 'Ativo',
        area: 'Cível',
        responsibleId: 'Dr. Roberto Lima',
        risk: 'Baixo',
        clientId: clientes[1].id,
      },
    }),
    db.process.create({
      data: {
        cnj: '0034567-89.2024.1.00.0000',
        title: 'Mandado de Segurança - Tech Solutions vs Receita Federal',
        court: 'TRF-3',
        section: '10ª Vara Federal Cível - SP',
        classType: 'Mandado de Segurança',
        subject: 'Crédito-prêmio IPI',
        caseValue: 1200000.0,
        parties: 'Impetrante: Tech Solutions Brasil S.A. | Autoridade: Receita Federal',
        status: 'Ativo',
        area: 'Tributário',
        responsibleId: 'Dra. Patrícia Almeida',
        risk: 'Alto',
        clientId: clientes[2].id,
      },
    }),
    db.process.create({
      data: {
        cnj: '0045678-90.2025.8.26.0224',
        title: 'Ação de Cobrança - Distribuidora Norte vs Mercado Sul',
        court: 'TJSP',
        section: '2ª Vara Cível - Guarulhos',
        classType: 'Procedimento Comum Cível',
        subject: 'Cobrança de duplicatas não pagas',
        caseValue: 230000.0,
        parties: 'Autora: Distribuidora Norte Ltda | Réu: Mercado Sul Ltda',
        status: 'Ativo',
        area: 'Cível',
        responsibleId: 'Dr. Roberto Lima',
        risk: 'Médio',
        clientId: clientes[4].id,
      },
    }),
    db.process.create({
      data: {
        cnj: '0056789-01.2023.8.26.0100',
        title: 'Ação de Indenização - Carolina vs Loja ABC',
        court: 'TJSP',
        section: '5ª Vara Cível - São Paulo',
        classType: 'Procedimento Comum Cível',
        subject: 'Vício em produto',
        caseValue: 15000.0,
        parties: 'Autora: Carolina Ferreira Souza | Réu: Loja ABC',
        status: 'Encerrado',
        area: 'Consumidor',
        responsibleId: 'Dr. Roberto Lima',
        risk: 'Baixo',
        clientId: clientes[5].id,
      },
    }),
    db.process.create({
      data: {
        cnj: '0067890-12.2025.8.26.0100',
        title: 'Defesa em Auto de Infração - Distribuidora Norte',
        court: 'TJSP',
        section: '3ª Vara da Fazenda Pública - SP',
        classType: 'Ação Anulatória',
        subject: 'Anulação de auto de infração fiscal - ICMS',
        caseValue: 180000.0,
        parties: 'Autora: Distribuidora Norte Ltda | Réu: Fazenda do Estado de SP',
        status: 'Ativo',
        area: 'Tributário',
        responsibleId: 'Dra. Patrícia Almeida',
        risk: 'Alto',
        clientId: clientes[4].id,
      },
    }),
  ])

  // ============ ANDAMENTOS ============
  await Promise.all([
    db.movement.create({
      data: {
        processId: processos[0].id,
        date: diasAtras(45),
        description: 'Distribuído por sorteio',
        summary: 'Processo distribuído para a 1ª Vara do Trabalho de São Paulo.',
        important: false,
      },
    }),
    db.movement.create({
      data: {
        processId: processos[0].id,
        date: diasAtras(40),
        description: 'Juntada de petição inicial',
        summary: 'Petição inicial juntada aos autos pelo advogado do reclamante.',
        important: false,
      },
    }),
    db.movement.create({
      data: {
        processId: processos[0].id,
        date: diasAtras(35),
        description: 'Despacho: designada audiência inicial',
        summary: 'Juiz designa audiência inicial (conciliação, instrução e julgamento) para data futura.',
        important: true,
      },
    }),
    db.movement.create({
      data: {
        processId: processos[0].id,
        date: diasAtras(10),
        description: 'Notificação da reclamada',
        summary: 'Reclamada notificada para comparecer à audiência e apresentar defesa.',
        important: true,
      },
    }),
    db.movement.create({
      data: {
        processId: processos[1].id,
        date: diasAtras(30),
        description: 'Distribuído por sorteio',
        summary: 'Processo distribuído à 3ª Vara Cível de São Paulo.',
        important: false,
      },
    }),
    db.movement.create({
      data: {
        processId: processos[1].id,
        date: diasAtras(20),
        description: 'Citação do réu',
        summary: 'Réu citado. Prazo de 15 dias para contestação.',
        important: true,
      },
    }),
    db.movement.create({
      data: {
        processId: processos[1].id,
        date: diasAtras(5),
        description: 'Juntada da contestação',
        summary: 'Banco XYZ apresenta contestação alegando prescrição e legalidade da inscrição.',
        important: true,
      },
    }),
    db.movement.create({
      data: {
        processId: processos[2].id,
        date: diasAtras(60),
        description: 'Concessão de liminar',
        summary: 'Juiz concede segurança para suspender exigência do tributo.',
        important: true,
      },
    }),
    db.movement.create({
      data: {
        processId: processos[2].id,
        date: diasAtras(15),
        description: 'Informações da autoridade coatora',
        summary: 'Receita Federal presta informações em 30 dias.',
        important: false,
      },
    }),
    db.movement.create({
      data: {
        processId: processos[3].id,
        date: diasAtras(90),
        description: 'Distribuído por sorteio',
        summary: 'Processo distribuído à 2ª Vara Cível de Guarulhos.',
        important: false,
      },
    }),
    db.movement.create({
      data: {
        processId: processos[3].id,
        date: diasAtras(85),
        description: 'Citação do réu',
        summary: 'Réu citado em 12/03.',
        important: false,
      },
    }),
    db.movement.create({
      data: {
        processId: processos[5].id,
        date: diasAtras(25),
        description: 'Distribuído por sorteio',
        summary: 'Processo distribuído à 3ª Vara da Fazenda Pública.',
        important: false,
      },
    }),
  ])

  // ============ PRAZOS ============
  await Promise.all([
    db.deadline.create({
      data: {
        processId: processos[0].id,
        title: 'Audiência inicial (conciliação, instrução e julgamento)',
        dueDate: diasFrente(2),
        type: 'Fatal',
        priority: 'Crítica',
        responsible: 'Dra. Patrícia Almeida',
        done: false,
        notes: 'Audiência na 1ª Vara do Trabalho. Preparar testemunhas.',
      },
    }),
    db.deadline.create({
      data: {
        processId: processos[1].id,
        title: 'Réplica à contestação',
        dueDate: diasFrente(5),
        type: 'Fatal',
        priority: 'Alta',
        responsible: 'Dr. Roberto Lima',
        done: false,
        notes: 'Prazo fatal de 15 dias. Contestação juntada há 5 dias.',
      },
    }),
    db.deadline.create({
      data: {
        processId: processos[2].id,
        title: 'Alegações finais',
        dueDate: diasFrente(10),
        type: 'Fatal',
        priority: 'Alta',
        responsible: 'Dra. Patrícia Almeida',
        done: false,
      },
    }),
    db.deadline.create({
      data: {
        processId: processos[3].id,
        title: 'Requisição de perícia contábil',
        dueDate: diasFrente(7),
        type: 'Interno',
        priority: 'Média',
        responsible: 'Dr. Roberto Lima',
        done: false,
      },
    }),
    db.deadline.create({
      data: {
        processId: processos[5].id,
        title: 'Juntada de documentos fiscais',
        dueDate: diasFrente(1),
        type: 'Fatal',
        priority: 'Crítica',
        responsible: 'Dra. Patrícia Almeida',
        done: false,
        notes: 'Última oportunidade antes da sentença.',
      },
    }),
    db.deadline.create({
      data: {
        processId: processos[0].id,
        title: 'Preparar memoriais',
        dueDate: diasFrente(20),
        type: 'Interno',
        priority: 'Média',
        responsible: 'Estagiário Pedro',
        done: false,
      },
    }),
    db.deadline.create({
      data: {
        processId: processos[1].id,
        title: 'Coletar jurisprudência',
        dueDate: diasFrente(3),
        type: 'Interno',
        priority: 'Média',
        responsible: 'Estagiário Pedro',
        done: false,
      },
    }),
  ])

  // ============ TAREFAS ============
  await Promise.all([
    db.task.create({
      data: {
        title: 'Redigir réplica do processo Maria Aparecida vs Banco XYZ',
        description: 'Atacar preliminar de prescrição e reforçar pedido de indenização.',
        status: 'A Fazer',
        priority: 'Alta',
        dueDate: diasFrente(4),
        assignee: 'Dr. Roberto Lima',
        processId: processos[1].id,
        clientId: clientes[1].id,
      },
    }),
    db.task.create({
      data: {
        title: 'Preparar memoriais - Construtora Horizonte',
        description: 'Síntese da prova produzida em audiência.',
        status: 'Em Andamento',
        priority: 'Média',
        dueDate: diasFrente(15),
        assignee: 'Estagiário Pedro',
        processId: processos[0].id,
        clientId: clientes[0].id,
      },
    }),
    db.task.create({
      data: {
        title: 'Revisar contrato de prestação de serviços - Tech Solutions',
        description: 'Cliente solicitou revisão de cláusulas de SLA.',
        status: 'Em Revisão',
        priority: 'Alta',
        dueDate: diasFrente(2),
        assignee: 'Dra. Patrícia Almeida',
        clientId: clientes[2].id,
      },
    }),
    db.task.create({
      data: {
        title: 'Reunir documentos fiscais - Distribuidora Norte',
        description: 'Coletar notas fiscais dos últimos 5 anos.',
        status: 'A Fazer',
        priority: 'Crítica',
        dueDate: diasFrente(1),
        assignee: 'Estagiário Pedro',
        processId: processos[5].id,
        clientId: clientes[4].id,
      },
    }),
    db.task.create({
      data: {
        title: 'Ligar para cliente João Pedro Mendes',
        description: 'Confirmar recebimento de documentos para inventário.',
        status: 'A Fazer',
        priority: 'Baixa',
        dueDate: diasFrente(3),
        assignee: 'Secretária Ana',
        clientId: clientes[3].id,
      },
    }),
    db.task.create({
      data: {
        title: 'Emitir cobrança - honorários Construtora',
        description: 'Honorários do mês vencidos há 10 dias.',
        status: 'Em Andamento',
        priority: 'Alta',
        dueDate: diasFrente(1),
        assignee: 'Secretária Ana',
        processId: processos[0].id,
        clientId: clientes[0].id,
      },
    }),
    db.task.create({
      data: {
        title: 'Atualizar planilha de prazos',
        description: 'Revisão semanal de todos os prazos.',
        status: 'Concluída',
        priority: 'Baixa',
        assignee: 'Secretária Ana',
      },
    }),
    db.task.create({
      data: {
        title: 'Estudar tese sobre crédito-prêmio IPI',
        description: 'Pesquisar STJ sobre o tema para o caso Tech Solutions.',
        status: 'Concluída',
        priority: 'Média',
        assignee: 'Estagiário Pedro',
        processId: processos[2].id,
      },
    }),
  ])

  // ============ FINANCEIRO ============
  await Promise.all([
    db.financial.create({
      data: {
        type: 'Receita',
        category: 'Honorários',
        description: 'Honorários contratuais - Construtora Horizonte (Jul/26)',
        amount: 8500.0,
        dueDate: diasAtras(10),
        status: 'Atrasado',
        processId: processos[0].id,
        clientId: clientes[0].id,
      },
    }),
    db.financial.create({
      data: {
        type: 'Receita',
        category: 'Honorários',
        description: 'Honorários contratuais - Tech Solutions (Jul/26)',
        amount: 12000.0,
        dueDate: diasFrente(5),
        status: 'Pendente',
        clientId: clientes[2].id,
      },
    }),
    db.financial.create({
      data: {
        type: 'Receita',
        category: 'Honorários',
        description: 'Honorários contratuais - Distribuidora Norte (Jul/26)',
        amount: 6500.0,
        dueDate: diasFrente(8),
        status: 'Pendente',
        processId: processos[3].id,
        clientId: clientes[4].id,
      },
    }),
    db.financial.create({
      data: {
        type: 'Receita',
        category: 'Honorários',
        description: 'Honorários de sucumba - Carolina vs Loja ABC',
        amount: 5000.0,
        dueDate: diasAtras(30),
        paidDate: diasAtras(25),
        status: 'Pago',
        processId: processos[4].id,
        clientId: clientes[5].id,
      },
    }),
    db.financial.create({
      data: {
        type: 'Receita',
        category: 'Honorários',
        description: 'Honorários contratuais - Maria Aparecida (entrada)',
        amount: 5000.0,
        dueDate: diasAtras(30),
        paidDate: diasAtras(28),
        status: 'Pago',
        processId: processos[1].id,
        clientId: clientes[1].id,
      },
    }),
    db.financial.create({
      data: {
        type: 'Despesa',
        category: 'Custas',
        description: 'Custas processuais - Distribuidora Norte',
        amount: 1850.0,
        dueDate: diasFrente(3),
        status: 'Pendente',
        processId: processos[3].id,
        clientId: clientes[4].id,
      },
    }),
    db.financial.create({
      data: {
        type: 'Despesa',
        category: 'Custas',
        description: 'Custas - Tech Solutions MS',
        amount: 1200.0,
        dueDate: diasAtras(20),
        paidDate: diasAtras(18),
        status: 'Pago',
        processId: processos[2].id,
        clientId: clientes[2].id,
      },
    }),
    db.financial.create({
      data: {
        type: 'Despesa',
        category: 'Salários',
        description: 'Folha de pagamento - Jul/26',
        amount: 22000.0,
        dueDate: diasFrente(5),
        status: 'Pendente',
      },
    }),
    db.financial.create({
      data: {
        type: 'Despesa',
        category: 'Operacional',
        description: 'Aluguel do escritório - Jul/26',
        amount: 6500.0,
        dueDate: diasFrente(10),
        status: 'Pendente',
      },
    }),
    db.financial.create({
      data: {
        type: 'Despesa',
        category: 'Operacional',
        description: 'Software jurídico - assinatura mensal',
        amount: 480.0,
        dueDate: diasAtras(5),
        paidDate: diasAtras(5),
        status: 'Pago',
      },
    }),
    db.financial.create({
      data: {
        type: 'Despesa',
        category: 'Operacional',
        description: 'Internet + telefone - Jun/26',
        amount: 380.0,
        dueDate: diasAtras(15),
        paidDate: diasAtras(13),
        status: 'Pago',
      },
    }),
  ])

  // ============ DOCUMENTOS ============
  await Promise.all([
    db.document.create({
      data: {
        name: 'Petição Inicial - João Santos.pdf',
        type: 'PDF',
        size: '1.2 MB',
        tags: 'Petição,Inicial',
        processId: processos[0].id,
        clientId: clientes[0].id,
      },
    }),
    db.document.create({
      data: {
        name: 'Contrato de Honorários - Construtora Horizonte.pdf',
        type: 'PDF',
        size: '420 KB',
        tags: 'Contrato',
        processId: processos[0].id,
        clientId: clientes[0].id,
      },
    }),
    db.document.create({
      data: {
        name: 'Ata de Audiência - 15_06.pdf',
        type: 'PDF',
        size: '350 KB',
        tags: 'Audiência',
        processId: processos[0].id,
        clientId: clientes[0].id,
      },
    }),
    db.document.create({
      data: {
        name: 'Contestação - Banco XYZ.pdf',
        type: 'PDF',
        size: '850 KB',
        tags: 'Contestação',
        processId: processos[1].id,
        clientId: clientes[1].id,
      },
    }),
    db.document.create({
      data: {
        name: 'Mandado de Segurança - Tech Solutions.pdf',
        type: 'PDF',
        size: '950 KB',
        tags: 'Petição,MS',
        processId: processos[2].id,
        clientId: clientes[2].id,
      },
    }),
    db.document.create({
      data: {
        name: 'Contrato de Prestação - Tech Solutions.docx',
        type: 'Word',
        size: '180 KB',
        tags: 'Contrato',
        clientId: clientes[2].id,
      },
    }),
  ])

  // ============ TIMELINE ENTRIES ============
  for (const p of processos) {
    const movs = await db.movement.findMany({ where: { processId: p.id }, orderBy: { date: 'desc' } })
    for (const m of movs) {
      await db.timelineEntry.create({
        data: {
          processId: p.id,
          clientId: p.clientId,
          date: m.date,
          type: 'Movimento',
          title: m.description,
          description: m.summary,
        },
      })
    }
    const prazos = await db.deadline.findMany({ where: { processId: p.id } })
    for (const d of prazos) {
      await db.timelineEntry.create({
        data: {
          processId: p.id,
          clientId: p.clientId,
          date: d.dueDate,
          type: 'Prazo',
          title: `Prazo: ${d.title}`,
          description: `Prioridade: ${d.priority} | Tipo: ${d.type} | Resp: ${d.responsible || '-'}`,
        },
      })
    }
    const fins = await db.financial.findMany({ where: { processId: p.id } })
    for (const f of fins) {
      await db.timelineEntry.create({
        data: {
          processId: p.id,
          clientId: p.clientId,
          date: f.dueDate,
          type: 'Financeiro',
          title: `${f.type}: ${f.description}`,
          description: `R$ ${f.amount.toFixed(2)} - ${f.status}`,
        },
      })
    }
  }

  // ============ AUDITORIA ============
  await db.auditLog.create({
    data: {
      user: 'Dra. Patrícia Almeida',
      action: 'CREATE',
      entity: 'System',
      details: 'Inicialização do sistema com dados de demonstração',
    },
  })

  console.log('Seed concluído com sucesso!')
  console.log(`- ${clientes.length} clientes`)
  console.log(`- ${processos.length} processos`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
