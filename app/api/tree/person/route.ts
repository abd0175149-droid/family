import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withPermission } from '@/lib/middleware/rbac'
import { PERMISSIONS } from '@/lib/constants/permissions'
import { TreeService } from '@/lib/services/TreeService'
import { Gender } from '@prisma/client'

const createPersonSchema = z.object({
  fullName: z.string().min(1, 'الاسم مطلوب'),
  gender: z.nativeEnum(Gender),
  birthDate: z.string().optional().transform((val) => (val ? new Date(val) : undefined)),
  deathDate: z.string().optional().transform((val) => (val ? new Date(val) : undefined)),
  photoFileId: z.string().optional(),
  notes: z.string().optional(),
})

export async function POST(request: NextRequest) {
  return withPermission(request, PERMISSIONS.TREE_WRITE, async () => {
    try {
      const body = await request.json()
      const data = createPersonSchema.parse(body)
      const person = await TreeService.createPerson(data)
      return NextResponse.json(person)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: error.errors[0].message },
          { status: 400 }
        )
      }
      console.error('Error creating person:', error)
      return NextResponse.json(
        { error: 'حدث خطأ أثناء إضافة الشخص' },
        { status: 500 }
      )
    }
  })
}
