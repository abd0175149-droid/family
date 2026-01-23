import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

// Endpoint لإنشاء الجداول عبر SQL مباشرة
// استخدمه مرة واحدة فقط

export async function POST(request: NextRequest) {
  try {
    // التحقق من secret token
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')
    const expectedToken = process.env.SETUP_SECRET || 'setup-secret-change-me'

    if (token !== expectedToken) {
      return NextResponse.json(
        { error: 'غير مصرح' },
        { status: 401 }
      )
    }

    const prisma = new PrismaClient()

    // اختبار الاتصال أولاً
    await prisma.$connect()
    
    // التحقق من وجود الجداول
    const tables = await prisma.$queryRaw<Array<{Tables_in_database: string}>>`
      SHOW TABLES
    `

    const tableNames = tables.map(t => Object.values(t)[0])
    
    await prisma.$disconnect()

    return NextResponse.json({
      message: 'الاتصال بقاعدة البيانات ناجح',
      existingTables: tableNames,
      note: tableNames.length === 0 
        ? 'لا توجد جداول. استخدم Prisma db:push محلياً لإنشاء الجداول'
        : `تم العثور على ${tableNames.length} جدول`
    })
  } catch (error: any) {
    console.error('Init DB error:', error)
    return NextResponse.json(
      { 
        error: 'حدث خطأ',
        details: error.message 
      },
      { status: 500 }
    )
  }
}
