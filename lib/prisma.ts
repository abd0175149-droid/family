import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// إعدادات Prisma Client محسّنة للاستقرار ومنع التعطل
const createPrismaClient = () => {
  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    errorFormat: 'minimal',
    // إعدادات الاتصال لتحسين الاستقرار
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  })

  // معالجة الأخطاء لمنع تعطل السيرفر
  client.$on('error' as never, (e: any) => {
    console.error('Prisma error:', e)
  })

  // إغلاق الاتصال عند الخروج
  if (typeof process !== 'undefined') {
    const gracefulShutdown = async () => {
      try {
        await client.$disconnect()
      } catch (error) {
        console.error('Error disconnecting Prisma:', error)
      }
    }

    process.on('SIGINT', gracefulShutdown)
    process.on('SIGTERM', gracefulShutdown)
    process.on('beforeExit', gracefulShutdown)
  }

  return client
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

// في development فقط، نحفظ Prisma Client في global
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
