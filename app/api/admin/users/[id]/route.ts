import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withPermission } from '@/lib/middleware/rbac'
import { PERMISSIONS } from '@/lib/constants/permissions'
import { UserService } from '@/lib/services/UserService'
import { logAction } from '@/lib/middleware/audit'

const updateUserSchema = z.object({
  fullName: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  role: z.string().optional(),
  status: z.string().optional(),
  personId: z.string().optional(),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withPermission(request, PERMISSIONS.USERS_UPDATE, async (user) => {
    try {
      const body = await request.json()
      const data = updateUserSchema.parse(body)
      const updatedUser = await UserService.updateUser(params.id, data)
      
      await logAction(user, 'user.update', request, {
        resource: 'user',
        resourceId: params.id,
        details: `Updated user: ${updatedUser.email}`,
      })

      return NextResponse.json(updatedUser)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: error.errors[0].message },
          { status: 400 }
        )
      }
      console.error('Error updating user:', error)
      return NextResponse.json(
        { error: 'حدث خطأ أثناء تحديث المستخدم' },
        { status: 500 }
      )
    }
  })
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withPermission(request, PERMISSIONS.USERS_SUSPEND, async (user) => {
    try {
      const suspendedUser = await UserService.suspendUser(params.id)
      
      await logAction(user, 'user.suspend', request, {
        resource: 'user',
        resourceId: params.id,
        details: `Suspended user: ${suspendedUser.email}`,
      })

      return NextResponse.json(suspendedUser)
    } catch (error) {
      console.error('Error suspending user:', error)
      return NextResponse.json(
        { error: 'حدث خطأ أثناء تعطيل المستخدم' },
        { status: 500 }
      )
    }
  })
}
