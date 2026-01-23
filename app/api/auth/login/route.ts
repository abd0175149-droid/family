import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { UserService } from '@/lib/services/UserService'
import { generateToken, setAuthCookie } from '@/lib/middleware/auth'
import { rateLimit } from '@/lib/middleware/rate-limit'
import { prisma } from '@/lib/prisma'

const loginSchema = z.object({
  email: z.string().email('البريد الإلكتروني غير صحيح'),
  password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
})

export async function POST(request: NextRequest) {
  // Rate limiting - معطل مؤقتاً للاختبار
  // const rateLimitResponse = rateLimit(5, 15 * 60 * 1000)(request)
  // if (rateLimitResponse) {
  //   return rateLimitResponse
  // }

  try {
    const body = await request.json()
    const { email, password } = loginSchema.parse(body)

    console.log('Login attempt for:', email)

    // التحقق من الاتصال بقاعدة البيانات أولاً (مع timeout)
    try {
      await Promise.race([
        prisma.$queryRaw`SELECT 1`,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Database connection timeout')), 5000)
        )
      ])
    } catch (dbError: any) {
      console.error('Database connection error:', dbError)
      // إعادة محاولة الاتصال مرة واحدة
      try {
        await prisma.$disconnect()
        await prisma.$connect()
      } catch (retryError) {
        console.error('Retry connection failed:', retryError)
      }
      return NextResponse.json(
        { 
          error: 'خطأ في الاتصال بقاعدة البيانات',
          details: process.env.NODE_ENV === 'development' ? dbError.message : undefined
        },
        { status: 500 }
      )
    }

    const user = await UserService.verifyPassword(email, password)
    if (!user) {
      console.log('Login failed: Invalid credentials')
      return NextResponse.json(
        { error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' },
        { status: 401 }
      )
    }

    if (user.status !== 'active') {
      console.log('Login failed: User suspended')
      return NextResponse.json(
        { error: 'حسابك معطل' },
        { status: 403 }
      )
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
      status: user.status,
    })

    console.log('Login success for:', email)

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
      },
    })

    setAuthCookie(response, token)

    return response
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Login error:', error)
    console.error('Error stack:', error.stack)
    console.error('Error name:', error.name)
    console.error('Error message:', error.message)
    
    // إرجاع تفاصيل الخطأ مؤقتاً للتصحيح
    return NextResponse.json(
      { 
        error: 'حدث خطأ أثناء تسجيل الدخول',
        details: error.message || 'Unknown error',
        type: error.name || 'Error',
      },
      { status: 500 }
    )
  }
}
