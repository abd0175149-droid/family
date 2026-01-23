import { NextRequest, NextResponse } from 'next/server'
import { UserService } from '@/lib/services/UserService'
import { UserRole } from '@prisma/client'

// Endpoint مؤقت لإنشاء مستخدم أولي
// استخدمه مرة واحدة فقط ثم احذفه أو عطله

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

    const body = await request.json()
    const { email, password, fullName, role } = body

    if (!email || !password || !fullName) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني وكلمة المرور والاسم مطلوبة' },
        { status: 400 }
      )
    }

    // التحقق من وجود مستخدمين
    const existingUsers = await UserService.getUsers()
    if (existingUsers.length > 0) {
      return NextResponse.json(
        { error: 'يوجد مستخدمين بالفعل. استخدم API إدارة المستخدمين' },
        { status: 400 }
      )
    }

    // إنشاء المستخدم الأول
    const user = await UserService.createUser({
      email,
      password,
      fullName,
      role: (role as UserRole) || 'super_admin',
    })

    return NextResponse.json({
      message: 'تم إنشاء المستخدم الأول بنجاح',
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    })
  } catch (error: any) {
    console.error('Create first user error:', error)
    return NextResponse.json(
      {
        error: 'حدث خطأ أثناء إنشاء المستخدم',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    )
  }
}
