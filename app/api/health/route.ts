import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Test database connection with timeout
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout')), 5000)
      )
    ])
    
    return NextResponse.json({
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    // محاولة إعادة الاتصال
    try {
      await prisma.$disconnect().catch(() => {})
      await prisma.$connect().catch(() => {})
    } catch (retryError) {
      // تجاهل أخطاء إعادة الاتصال
    }
    
    return NextResponse.json(
      {
        status: 'error',
        database: 'disconnected',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Database connection failed',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}
