import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware/rbac'
import { UserService } from '@/lib/services/UserService'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  return withAuth(request, async (user) => {
    const dbUser = await UserService.getUserById(user.id)
    if (!dbUser) {
      return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 })
    }

    // جلب معلومات الشخص المرتبط إن وجد
    let person = null
    if (dbUser.personId) {
      person = await prisma.person.findUnique({
        where: { id: dbUser.personId },
        include: {
          photoFile: {
            select: {
              id: true,
              filePath: true,
            },
          },
        },
      })
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
        lastLoginAt: dbUser.lastLoginAt,
        createdAt: dbUser.createdAt,
        person: person
          ? {
              id: person.id,
              fullName: person.fullName,
              gender: person.gender,
              birthDate: person.birthDate,
              deathDate: person.deathDate,
              notes: person.notes,
              photoFile: person.photoFile
                ? {
                    id: person.photoFile.id,
                    filePath: person.photoFile.filePath,
                  }
                : null,
            }
          : null,
      },
    })
  })
}
