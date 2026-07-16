import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Sempre cria nova instância se a global não tiver os modelos novos
function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV !== 'production' ? ['error', 'warn'] : ['error'],
  })
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

// Verifica se tem os modelos novos; se não, recria
if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = db
}
