import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withRetryAndTimeout } from '@/lib/utils/prisma-retry'

export async function GET() {
  try {
    // Test database connection with retry and timeout
    await withRetryAndTimeout(
      () => prisma.user.count(),
      { maxRetries: 2, delay: 500 },
      3000
    )
    
    return NextResponse.json({
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString(),
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    })
  } catch (error: any) {
    // لا نحاول إعادة الاتصال هنا لتجنب تعطل السيرفر
    console.error('Health check error:', error)
    
    return NextResponse.json(
      {
        status: 'error',
        database: 'disconnected',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Database connection failed',
        timestamp: new Date().toISOString(),
      },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    )
  }
}
