// Máscaras de input para formatos brasileiros
// Aplica formatação visual enquanto o usuário digita

/**
 * Remove todos os caracteres não numéricos
 */
export function onlyDigits(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return ''
  return String(value).replace(/\D/g, '')
}

/**
 * Máscara de CPF: 000.000.000-00
 */
export function maskCPF(value: string): string {
  const d = onlyDigits(value).slice(0, 11)
  if (d.length <= 3) return d
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`
}

/**
 * Máscara de CNPJ: 00.000.000/0000-00
 */
export function maskCNPJ(value: string): string {
  const d = onlyDigits(value).slice(0, 14)
  if (d.length <= 2) return d
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`
  if (d.length <= 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`
}

/**
 * Máscara de CPF ou CNPJ (detecta automaticamente pela quantidade de dígitos)
 * CPF = 11 dígitos, CNPJ = 14 dígitos
 */
export function maskCPForCNPJ(value: string): string {
  const d = onlyDigits(value)
  if (d.length <= 11) return maskCPF(d)
  return maskCNPJ(d)
}

/**
 * Máscara de telefone: (00) 0000-0000 ou (00) 00000-0000 (celular)
 */
export function maskPhone(value: string): string {
  const d = onlyDigits(value).slice(0, 11)
  if (d.length <= 2) return d
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

/**
 * Máscara de CEP: 00000-000
 */
export function maskCEP(value: string): string {
  const d = onlyDigits(value).slice(0, 8)
  if (d.length <= 5) return d
  return `${d.slice(0, 5)}-${d.slice(5)}`
}

/**
 * Máscara de número CNJ: NNNNNNN-DD.AAAA.J.TR.OOOO (20 dígitos)
 */
export function maskCNJ(value: string): string {
  const d = onlyDigits(value).slice(0, 20)
  if (d.length <= 7) return d
  if (d.length <= 9) return `${d.slice(0, 7)}-${d.slice(7)}`
  if (d.length <= 13) return `${d.slice(0, 7)}-${d.slice(7, 9)}.${d.slice(9)}`
  if (d.length <= 14) return `${d.slice(0, 7)}-${d.slice(7, 9)}.${d.slice(9, 13)}.${d.slice(13)}`
  if (d.length <= 16) return `${d.slice(0, 7)}-${d.slice(7, 9)}.${d.slice(9, 13)}.${d.slice(13, 14)}.${d.slice(14)}`
  return `${d.slice(0, 7)}-${d.slice(7, 9)}.${d.slice(9, 13)}.${d.slice(13, 14)}.${d.slice(14, 16)}.${d.slice(16)}`
}

/**
 * Máscara de moeda BRL: 1.234,56
 * Permite digitar apenas números e formata com separadores
 */
export function maskCurrency(value: string | number): string {
  if (value === null || value === undefined || value === '') return ''
  // Se vier número, converte
  if (typeof value === 'number') {
    return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }
  // Remove tudo que não é dígito
  const d = value.replace(/\D/g, '')
  if (!d) return ''
  // Converte para número (tratando os centavos)
  const num = parseInt(d, 10) / 100
  return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

/**
 * Converte string formatada de moeda para número float
 * "1.234,56" -> 1234.56
 */
export function parseCurrency(value: string): number {
  if (!value) return 0
  const d = onlyDigits(value)
  if (!d) return 0
  return parseInt(d, 10) / 100
}

/**
 * Máscara de OAB: OAB/SP 123.456
 * Aceita UF (2 letras) + número (até 8 dígitos)
 */
export function maskOAB(value: string): string {
  // Permite letras no início (OAB/SP) + dígitos
  const cleaned = value.toUpperCase().replace(/[^A-Z0-9/]/g, '')
  // Formato esperado: OAB/SP 123.456 ou só 123456
  const match = cleaned.match(/^(OAB\/[A-Z]{2})?\s*(\d{0,8})$/)
  if (!match) return value
  const prefix = match[1] || ''
  const num = match[2] || ''
  let formattedNum = num
  if (num.length > 3) {
    formattedNum = `${num.slice(0, -3)}.${num.slice(-3)}`
  }
  return prefix ? `${prefix} ${formattedNum}`.trim() : formattedNum
}

/**
 * Máscara de data: DD/MM/AAAA
 */
export function maskDate(value: string): string {
  const d = onlyDigits(value).slice(0, 8)
  if (d.length <= 2) return d
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`
}

/**
 * Validações
 */
export function isValidCPF(cpf: string): boolean {
  const d = onlyDigits(cpf)
  if (d.length !== 11) return false
  if (/^(\d)\1{10}$/.test(d)) return false // todos iguais
  let sum = 0
  for (let i = 0; i < 9; i++) sum += parseInt(d[i]) * (10 - i)
  let rev = 11 - (sum % 11)
  if (rev >= 10) rev = 0
  if (rev !== parseInt(d[9])) return false
  sum = 0
  for (let i = 0; i < 10; i++) sum += parseInt(d[i]) * (11 - i)
  rev = 11 - (sum % 11)
  if (rev >= 10) rev = 0
  return rev === parseInt(d[10])
}

export function isValidCNPJ(cnpj: string): boolean {
  const d = onlyDigits(cnpj)
  if (d.length !== 14) return false
  if (/^(\d)\1{13}$/.test(d)) return false
  let size = d.length - 2
  let nums = d.substring(0, size)
  const digits = d.substring(size)
  let sum = 0
  let pos = size - 7
  for (let i = size; i >= 1; i--) {
    sum += parseInt(nums[size - i]) * pos--
    if (pos < 2) pos = 9
  }
  let rev = sum % 11 < 2 ? 0 : 11 - (sum % 11)
  if (rev !== parseInt(digits[0])) return false
  size += 1
  nums = d.substring(0, size)
  sum = 0
  pos = size - 7
  for (let i = size; i >= 1; i--) {
    sum += parseInt(nums[size - i]) * pos--
    if (pos < 2) pos = 9
  }
  rev = sum % 11 < 2 ? 0 : 11 - (sum % 11)
  return rev === parseInt(digits[1])
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function isValidCEP(cep: string): boolean {
  return onlyDigits(cep).length === 8
}

export function isValidCNJ(cnj: string): boolean {
  return onlyDigits(cnj).length === 20
}

/**
 * Componente React: Input com máscara automática
 * Uso: <MaskedInput mask="cpf" value={...} onChange={...} />
 */
export type MaskType = 'cpf' | 'cnpj' | 'cpfCnpj' | 'phone' | 'cep' | 'cnj' | 'currency' | 'oab' | 'date'

export function applyMask(type: MaskType, value: string): string {
  switch (type) {
    case 'cpf': return maskCPF(value)
    case 'cnpj': return maskCNPJ(value)
    case 'cpfCnpj': return maskCPForCNPJ(value)
    case 'phone': return maskPhone(value)
    case 'cep': return maskCEP(value)
    case 'cnj': return maskCNJ(value)
    case 'currency': return maskCurrency(value)
    case 'oab': return maskOAB(value)
    case 'date': return maskDate(value)
    default: return value
  }
}

export function getRawValue(type: MaskType, value: string): string | number {
  if (type === 'currency') return parseCurrency(value)
  return onlyDigits(value)
}
