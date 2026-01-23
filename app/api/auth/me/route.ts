import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware/rbac'
import { UserService } from '@/lib/services/UserService'

export async function GET(request: NextRequest) {
  return withAuth(request, async (user) => {
    const dbUser = await UserService.getUserById(user.id)
    if (!dbUser) {
      return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 })
    }

    return NextResponse.json({
      user: {
        id: dbUser.id,
        email: dbUser.email,
        role: dbUser.role,
        fullName: dbUser.fullName,
        phone: dbUser.phone,
        personId: dbUser.personId,
        status: dbUser.status,
      },
    })
  })
}
