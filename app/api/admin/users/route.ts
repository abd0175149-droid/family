import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withPermission } from '@/lib/middleware/rbac'
import { PERMISSIONS } from '@/lib/constants/permissions'
import { UserService } from '@/lib/services/UserService'
import { UserRole, UserStatus } from '@prisma/client'
import { logAction } from '@/lib/middleware/audit'

const createUserSchema = z.object({
  fullName: z.string().min(1, 'الاسم مطلوب'),
  email: z.string().email('البريد الإلكتروني غير صحيح'),
  phone: z.string().optional(),
  password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
  role: z.nativeEnum(UserRole),
  personId: z.string().optional(),
})

const updateUserSchema = z.object({
  fullName: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  role: z.nativeEnum(UserRole).optional(),
  status: z.nativeEnum(UserStatus).optional(),
  personId: z.string().optional(),
})

export async function GET(request: NextRequest) {
  return withPermission(request, PERMISSIONS.USERS_READ, async () => {
    try {
      const { searchParams } = new URL(request.url)
      const role = searchParams.get('role') as UserRole | null
      const status = searchParams.get('status') as UserStatus | null

      const users = await UserService.getUsers(role || undefined, status || undefined)
      return NextResponse.json(users)
    } catch (error) {
      console.error('Error fetching users:', error)
      return NextResponse.json(
        { error: 'حدث خطأ أثناء جلب المستخدمين' },
        { status: 500 }
      )
    }
  })
}

export async function POST(request: NextRequest) {
  return withPermission(request, PERMISSIONS.USERS_CREATE, async (user) => {
    try {
      const body = await request.json()
      const data = createUserSchema.parse(body)
      const newUser = await UserService.createUser(data)
      
      await logAction(user, 'user.create', request, {
        resource: 'user',
        resourceId: newUser.id,
        details: `Created user: ${newUser.email}`,
      })

      return NextResponse.json(newUser)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: error.errors[0].message },
          { status: 400 }
        )
      }
      console.error('Error creating user:', error)
      return NextResponse.json(
        { error: 'حدث خطأ أثناء إنشاء المستخدم' },
        { status: 500 }
      )
    }
  })
}
