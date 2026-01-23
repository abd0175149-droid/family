import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // إعدادات الاتصال لتحسين الاستقرار
  errorFormat: 'minimal',
})

// في production، لا نحفظ Prisma Client في global لتجنب مشاكل الذاكرة
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// معالجة إغلاق الاتصال بشكل صحيح
if (typeof process !== 'undefined') {
  process.on('beforeExit', async () => {
    await prisma.$disconnect()
  })
}
