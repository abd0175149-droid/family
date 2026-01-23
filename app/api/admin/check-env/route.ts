import { NextRequest, NextResponse } from 'next/server'

// Endpoint مؤقت للتحقق من Environment Variables
// استخدمه للتصحيح فقط ثم احذفه

export async function GET(request: NextRequest) {
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

    const envVars = {
      DATABASE_URL: process.env.DATABASE_URL 
        ? `${process.env.DATABASE_URL.substring(0, 20)}...` // إخفاء جزء من الرابط
        : 'غير موجود',
      AUTH_SECRET: process.env.AUTH_SECRET 
        ? 'موجود' 
        : 'غير موجود',
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'غير موجود',
      CRON_SECRET: process.env.CRON_SECRET 
        ? 'موجود' 
        : 'غير موجود',
      NODE_ENV: process.env.NODE_ENV || 'غير موجود',
      PORT: process.env.PORT || 'غير موجود',
    }

    return NextResponse.json({
      message: 'Environment Variables Status',
      variables: envVars,
      note: 'DATABASE_URL يجب أن يكون موجوداً',
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'حدث خطأ',
        details: error.message,
      },
      { status: 500 }
    )
  }
}
