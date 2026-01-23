import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// هذا endpoint مؤقت لإعداد قاعدة البيانات
// استخدمه مرة واحدة فقط ثم احذفه أو عطله

export async function POST(request: NextRequest) {
  try {
    // التحقق من secret token (أضف token قوي في production)
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')
    const expectedToken = process.env.SETUP_SECRET || 'setup-secret-change-me'

    if (token !== expectedToken) {
      return NextResponse.json(
        { error: 'غير مصرح' },
        { status: 401 }
      )
    }

    // تنفيذ db:push يدوياً
    const { PrismaClient } = await import('@prisma/client')
    const client = new PrismaClient()

    // قراءة schema وتنفيذ migrations
    // ملاحظة: هذا تنفيذ مبسط - في production استخدم prisma migrate
    const result = await client.$executeRawUnsafe(`
      -- إنشاء الجداول الأساسية
      -- هذا مثال مبسط - Prisma سينفذ schema.prisma تلقائياً
    `)

    // اختبار الاتصال
    await client.$connect()
    const testQuery = await client.$queryRaw`SELECT 1 as test`
    
    await client.$disconnect()

    return NextResponse.json({
      message: 'تم الاتصال بقاعدة البيانات بنجاح',
      test: testQuery,
      note: 'استخدم Prisma Studio أو db:push محلياً لإنشاء الجداول'
    })
  } catch (error: any) {
    console.error('Setup error:', error)
    return NextResponse.json(
      { 
        error: 'حدث خطأ أثناء الإعداد',
        details: error.message 
      },
      { status: 500 }
    )
  }
}
