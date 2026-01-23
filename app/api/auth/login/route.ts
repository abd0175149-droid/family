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

    // محاولة تسجيل الدخول مباشرة بدون فحص الاتصال المسبق
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

    console.error('Login error:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
    })
    
    // إرجاع رسالة خطأ واضحة
    const errorMessage = error.message?.includes('خطأ في التحقق')
      ? error.message
      : 'حدث خطأ أثناء تسجيل الدخول. يرجى المحاولة مرة أخرى.'
    
    return NextResponse.json(
      { 
        error: errorMessage,
        ...(process.env.NODE_ENV === 'development' && {
          details: error.message,
          type: error.name,
        }),
      },
      { status: 500 }
    )
  }
}
