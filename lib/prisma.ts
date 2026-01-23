import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// إعدادات Prisma Client محسّنة للاستقرار
const createPrismaClient = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    errorFormat: 'minimal',
  })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

// في development فقط، نحفظ Prisma Client في global
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
