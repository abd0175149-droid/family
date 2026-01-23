import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  prismaConnectionPromise: Promise<void> | undefined
}

// إعدادات Prisma Client محسّنة للاستقرار ومنع التعطل
const createPrismaClient = () => {
  // إعدادات الاتصال مع connection pooling
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is not set')
  }

  // إضافة connection pool parameters إلى DATABASE_URL
  const urlWithPool = databaseUrl.includes('?')
    ? `${databaseUrl}&connection_limit=5&pool_timeout=20`
    : `${databaseUrl}?connection_limit=5&pool_timeout=20`

  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    errorFormat: 'minimal',
    datasources: {
      db: {
        url: urlWithPool,
      },
    },
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

    // إزالة الـ listeners القديمة قبل إضافة جديدة
    process.removeAllListeners('SIGINT')
    process.removeAllListeners('SIGTERM')
    process.removeAllListeners('beforeExit')

    process.once('SIGINT', gracefulShutdown)
    process.once('SIGTERM', gracefulShutdown)
    process.once('beforeExit', gracefulShutdown)
  }

  return client
}

// إنشاء Prisma Client مرة واحدة فقط
export const prisma = globalForPrisma.prisma ?? createPrismaClient()

// حفظ Prisma Client في global في كل البيئات (development و production)
// هذا مهم لمنع إنشاء multiple instances
if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = prisma
}

// Helper function للاتصال مع retry logic
async function connectWithRetry(maxRetries = 3, delay = 1000): Promise<void> {
  if (globalForPrisma.prismaConnectionPromise) {
    return globalForPrisma.prismaConnectionPromise
  }

  const connectPromise = (async () => {
    for (let i = 0; i < maxRetries; i++) {
      try {
        await prisma.$connect()
        console.log('Prisma connected successfully')
        return
      } catch (error: any) {
        console.error(`Prisma connection attempt ${i + 1} failed:`, error.message)
        if (i < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, delay * (i + 1)))
        } else {
          throw error
        }
      }
    }
  })()

  globalForPrisma.prismaConnectionPromise = connectPromise
  return connectPromise
}

// الاتصال عند بدء التطبيق (lazy connection)
if (typeof window === 'undefined' && process.env.NODE_ENV === 'production') {
  // في production، نربط الاتصال بشكل lazy عند أول استخدام
  // لكن لا نربطه هنا مباشرة لتجنب مشاكل في Next.js
}

// Export helper للاستخدام في API routes إذا لزم الأمر
export { connectWithRetry }
