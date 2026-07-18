// Serviço de integração com a API DataJud do CNJ
// Documentação: https://datajud-wp.cnj.jus.br/
// A API pública DataJud permite consultar processos de tribunais brasileiros

const DATAJUD_API_KEY = 'cDZHYzlZa0JadVREZDJCendQbXY6SkJlTzNjLV9TRENyQk1RdnFKZGRQdw=='
const DATAJUD_BASE = 'https://api-publica.datajud.cnj.jus.br'

// Mapeamento de tribunais para endpoints
// Cada tribunal tem seu próprio índice na API
export const TRIBUNAIS: Record<string, { endpoint: string; nome: string; tipo: string }> = {
  // Tribunais de Justiça Estaduais (TJ)
  TJSP: { endpoint: 'api_publica_tjsp', nome: 'Tribunal de Justiça de São Paulo', tipo: 'Estadual' },
  TJRJ: { endpoint: 'api_publica_tjrj', nome: 'Tribunal de Justiça do Rio de Janeiro', tipo: 'Estadual' },
  TJMG: { endpoint: 'api_publica_tjmg', nome: 'Tribunal de Justiça de Minas Gerais', tipo: 'Estadual' },
  TJRS: { endpoint: 'api_publica_tjrs', nome: 'Tribunal de Justiça do Rio Grande do Sul', tipo: 'Estadual' },
  TJPR: { endpoint: 'api_publica_tjpr', nome: 'Tribunal de Justiça do Paraná', tipo: 'Estadual' },
  TJSC: { endpoint: 'api_publica_tjsc', nome: 'Tribunal de Justiça de Santa Catarina', tipo: 'Estadual' },
  TJBA: { endpoint: 'api_publica_tjba', nome: 'Tribunal de Justiça da Bahia', tipo: 'Estadual' },
  TJCE: { endpoint: 'api_publica_tjce', nome: 'Tribunal de Justiça do Ceará', tipo: 'Estadual' },
  TJPE: { endpoint: 'api_publica_tjpe', nome: 'Tribunal de Justiça de Pernambuco', tipo: 'Estadual' },
  TJGO: { endpoint: 'api_publica_tjgo', nome: 'Tribunal de Justiça de Goiás', tipo: 'Estadual' },
  TJDF: { endpoint: 'api_publica_tjdf', nome: 'Tribunal de Justiça do DF', tipo: 'Estadual' },
  TJES: { endpoint: 'api_publica_tjes', nome: 'Tribunal de Justiça do ES', tipo: 'Estadual' },

  // Tribunais Regionais do Trabalho (TRT)
  TRT2:  { endpoint: 'api_publica_trt2',  nome: 'TRT 2ª Região (SP)', tipo: 'Trabalhista' },
  TRT1:  { endpoint: 'api_publica_trt1',  nome: 'TRT 1ª Região (RJ)', tipo: 'Trabalhista' },
  TRT3:  { endpoint: 'api_publica_trt3',  nome: 'TRT 3ª Região (MG)', tipo: 'Trabalhista' },
  TRT4:  { endpoint: 'api_publica_trt4',  nome: 'TRT 4ª Região (RS)', tipo: 'Trabalhista' },
  TRT5:  { endpoint: 'api_publica_trt5',  nome: 'TRT 5ª Região (BA)', tipo: 'Trabalhista' },
  TRT6:  { endpoint: 'api_publica_trt6',  nome: 'TRT 6ª Região (PE)', tipo: 'Trabalhista' },
  TRT7:  { endpoint: 'api_publica_trt7',  nome: 'TRT 7ª Região (CE)', tipo: 'Trabalhista' },
  TRT8:  { endpoint: 'api_publica_trt8',  nome: 'TRT 8ª Região (PA/AP)', tipo: 'Trabalhista' },
  TRT9:  { endpoint: 'api_publica_trt9',  nome: 'TRT 9ª Região (PR)', tipo: 'Trabalhista' },
  TRT10: { endpoint: 'api_publica_trt10', nome: 'TRT 10ª Região (DF/TO)', tipo: 'Trabalhista' },
  TRT15: { endpoint: 'api_publica_trt15', nome: 'TRT 15ª Região (SP Interior)', tipo: 'Trabalhista' },

  // Tribunais Regionais Federais (TRF)
  TRF1: { endpoint: 'api_publica_trf1', nome: 'TRF 1ª Região', tipo: 'Federal' },
  TRF2: { endpoint: 'api_publica_trf2', nome: 'TRF 2ª Região', tipo: 'Federal' },
  TRF3: { endpoint: 'api_publica_trf3', nome: 'TRF 3ª Região (SP/MS)', tipo: 'Federal' },
  TRF4: { endpoint: 'api_publica_trf4', nome: 'TRF 4ª Região (RS/PR/SC)', tipo: 'Federal' },
  TRF5: { endpoint: 'api_publica_trf5', nome: 'TRF 5ª Região (NE)', tipo: 'Federal' },
  TRF6: { endpoint: 'api_publica_trf6', nome: 'TRF 6ª Região (MG)', tipo: 'Federal' },

  // Justiça Eleitoral
  TSE:  { endpoint: 'api_publica_tse',  nome: 'Tribunal Superior Eleitoral', tipo: 'Eleitoral' },
  TRESP: { endpoint: 'api_publica_tresp', nome: 'TRE-SP', tipo: 'Eleitoral' },

  // Superiores
  STJ: { endpoint: 'api_publica_stj', nome: 'Superior Tribunal de Justiça', tipo: 'Superior' },
  STF: { endpoint: 'api_publica_stf', nome: 'Supremo Tribunal Federal', tipo: 'Superior' },
  TST: { endpoint: 'api_publica_tst', nome: 'Tribunal Superior do Trabalho', tipo: 'Superior' },
}

// Extrai o tribunal do número CNJ
// Formato: NNNNNNN-DD.AAAA.J.TR.OOOO
// J = segmento (1=STF, 2=CNJ, 3=STJ, 4=Justiça Federal, 5=Trabalhista, 6=Eleitoral, 7=Militar União, 8=Estadual, 9=Justiça Militar Estadual)
// TR = tribunal (ex: 02 = TRT-2, 26 = TJSP)
export function extrairTribunalDoCNJ(cnj: string): { tribunal: string; segmento: string } | null {
  const limpo = cnj.replace(/\D/g, '')
  if (limpo.length !== 20) return null

  const segmento = limpo.substring(13, 14) // J
  const tribunal = limpo.substring(14, 16) // TR

  // Mapeamento (J, TR) -> sigla do tribunal
  // J = segmento (1=STF, 2=CNJ, 3=STJ, 4=Justiça Federal, 5=Trabalhista, 6=Eleitoral, 7=Militar União, 8=Estadual, 9=Justiça Militar Estadual)
  // TR = tribunal (varia por segmento)
  const mapa: Record<string, string> = {
    // Estaduais (J=8) - TR é o código IBGE do estado
    '801': 'TJRJ', // Rio de Janeiro
    '802': 'TJMG', // Minas Gerais (corrigido - era 824 errado)
    '803': 'TJES', // Espírito Santo
    '804': 'TJBA', // Bahia (corrigido)
    '805': 'TJBA', // Bahia (alt)
    '806': 'TJCE', // Ceará
    '807': 'TJGO', // Goiás (corrigido)
    '808': 'TJES', // Espírito Santo (alt)
    '809': 'TJGO', // Goiás
    '810': 'TJPE', // Pernambuco (corrigido)
    '811': 'TJDF', // DF (alt)
    '812': 'TJSC', // Santa Catarina (corrigido - era 824 errado)
    '813': 'TJPR', // Paraná (corrigido)
    '814': 'TJRS', // Rio Grande do Sul (corrigido)
    '816': 'TJPR', // Paraná (alt)
    '817': 'TJPE', // Pernambuco (alt)
    '820': 'TJPR', // Paraná (alt)
    '821': 'TJRS', // Rio Grande do Sul (alt)
    '822': 'TJSC', // Santa Catarina (alt)
    '824': 'TJSP', // São Paulo (corrigido - era TJSC)
    '826': 'TJSP', // São Paulo (alt)

    // Trabalhistas (J=5) - TR é o número da região
    '501': 'TRT1',
    '502': 'TRT2',
    '503': 'TRT3',
    '504': 'TRT4',
    '505': 'TRT5',
    '506': 'TRT6',
    '507': 'TRT7',
    '508': 'TRT8',
    '509': 'TRT9',
    '510': 'TRT10',
    '515': 'TRT15',

    // Federais (J=4) - TR é o número da região
    '401': 'TRF1',
    '402': 'TRF2',
    '403': 'TRF3',
    '404': 'TRF4',
    '405': 'TRF5',
    '406': 'TRF6',
  }

  const chave = `${segmento}${tribunal}`
  const sigla = mapa[chave]
  if (!sigla) return null

  const segmentos: Record<string, string> = {
    '1': 'STF',
    '3': 'STJ',
    '4': 'Federal',
    '5': 'Trabalhista',
    '6': 'Eleitoral',
    '7': 'Militar União',
    '8': 'Estadual',
    '9': 'Militar Estadual',
  }

  return { tribunal: sigla, segmento: segmentos[segmento] || 'Desconhecido' }
}

export interface MovimentoDataJud {
  codigo: number
  nome: string
  data: string
  descricao?: string
}

export interface ProcessoDataJud {
  encontrado: boolean
  numeroProcesso: string
  tribunal: string
  tribunalNome: string
  classe?: string
  classeNome?: string
  assuntos?: any[]
  orgaoJulgador?: string
  dataAjuizamento?: string
  grau?: string
  formato?: string
  valorCausa?: number
  partes?: any[]
  movimentos?: MovimentoDataJud[]
  fonte: 'datajud' | 'demo'
  raw?: any
}

// Consulta processo no DataJud pelo número CNJ
export async function consultarProcessoDataJud(cnj: string): Promise<ProcessoDataJud> {
  const cnjLimpo = cnj.replace(/\D/g, '')

  if (cnjLimpo.length !== 20) {
    throw new Error('Número CNJ inválido. Deve conter 20 dígitos.')
  }

  const info = extrairTribunalDoCNJ(cnj)
  if (!info) {
    throw new Error('Não foi possível identificar o tribunal a partir do CNJ. Consulte manualmente.')
  }

  const tribunalInfo = TRIBUNAIS[info.tribunal]
  if (!tribunalInfo) {
    throw new Error(`Tribunal ${info.tribunal} não suportado pela API DataJud.`)
  }

  const url = `${DATAJUD_BASE}/${tribunalInfo.endpoint}/_search`

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `APIKey ${DATAJUD_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: {
          match: {
            numeroProcesso: cnjLimpo,
          },
        },
        size: 1,
      }),
      signal: controller.signal,
    })

    clearTimeout(timeout)

    if (!res.ok) {
      throw new Error(`DataJud retornou HTTP ${res.status}`)
    }

    const data = await res.json()

    if (!data.hits || !data.hits.hits || data.hits.hits.length === 0) {
      return {
        encontrado: false,
        numeroProcesso: cnj,
        tribunal: info.tribunal,
        tribunalNome: tribunalInfo.nome,
        fonte: 'datajud',
      }
    }

    const source = data.hits.hits[0]._source

    return {
      encontrado: true,
      numeroProcesso: source.numeroProcesso || cnj,
      tribunal: info.tribunal,
      tribunalNome: tribunalInfo.nome,
      classe: source.classe?.codigo,
      classeNome: source.classe?.nome,
      assuntos: source.assuntos || [],
      orgaoJulgador: source.orgaoJulgador?.nome,
      dataAjuizamento: source.dataAjuizamento,
      grau: source.grau,
      formato: source.formato?.nome,
      valorCausa: source.valorCausa,
      partes: source.partes || [],
      movimentos: (source.movimentos || []).map((m: any) => ({
        codigo: m.codigo,
        nome: m.nome,
        data: m.dataHora,
        descricao: m.complementosTabelados?.map((c: any) => c.descricao).join('; '),
      })),
      fonte: 'datajud',
      raw: source,
    }
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new Error('Timeout ao consultar DataJud (15s). Verifique a conexão.')
    }
    throw error
  }
}

// Modo demo: simula resposta do DataJud para ambientes sem acesso à API (sandbox)
export function simularRespostaDataJud(cnj: string): ProcessoDataJud {
  const info = extrairTribunalDoCNJ(cnj)
  const tribunal = info?.tribunal || 'TJSP'
  const tribunalInfo = TRIBUNAIS[tribunal]

  // Gerar movimentos fictícios mas plausíveis
  const hoje = new Date()
  const diasAtras = (d: number) => new Date(hoje.getTime() - d * 86400000).toISOString()

  const movimentosDemo: MovimentoDataJud[] = [
    { codigo: 85, nome: 'Petição Inicial Juntada', data: diasAtras(60) },
    { codigo: 33, nome: 'Determinada Citação do Réu', data: diasAtras(55) },
    { codigo: 28, nome: 'Mandado Expedido', data: diasAtras(53) },
    { codigo: 22, nome: 'Carta Registrada Expedida', data: diasAtras(50) },
    { codigo: 19, nome: 'Carta Devolvida - Recebida', data: diasAtras(40) },
    { codigo: 17, nome: 'Réu Citado', data: diasAtras(38), descricao: 'Mandado cumprido com sucesso' },
    { codigo: 14, nome: 'Defesa Apresentada', data: diasAtras(25), descricao: 'Contestação juntada aos autos' },
    { codigo: 12, nome: 'Réplica Determinada', data: diasAtras(15) },
    { codigo: 8, nome: 'Audiência Designada', data: diasAtras(10), descricao: 'Audiência de instrução e julgamento' },
    { codigo: 5, nome: 'Intimação da Parte', data: diasAtras(3) },
    { codigo: 2, nome: 'Conclusos para Despacho', data: diasAtras(1) },
  ]

  return {
    encontrado: true,
    numeroProcesso: cnj,
    tribunal,
    tribunalNome: tribunalInfo?.nome || 'Tribunal (demo)',
    classeNome: info?.segmento === 'Trabalhista' ? 'Reclamação Trabalhista' : 'Procedimento Comum Cível',
    assuntos: [{ codigo: 1, nome: info?.segmento === 'Trabalhista' ? 'Verbas Rescisórias' : 'Indenização' }],
    orgaoJulgador: '1ª Vara Cível',
    dataAjuizamento: diasAtras(60),
    grau: 'G1',
    formato: 'Eletrônico',
    valorCausa: 50000,
    partes: [
      { nome: 'Parte Autora', polo: 'Ativo' },
      { nome: 'Parte Ré', polo: 'Passivo' },
    ],
    movimentos: movimentosDemo,
    fonte: 'demo',
  }
}
