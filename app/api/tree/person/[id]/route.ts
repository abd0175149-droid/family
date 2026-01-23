import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withPermission } from '@/lib/middleware/rbac'
import { PERMISSIONS } from '@/lib/constants/permissions'
import { TreeService } from '@/lib/services/TreeService'
import { Gender } from '@prisma/client'

const updatePersonSchema = z.object({
  fullName: z.string().min(1).optional(),
  gender: z.nativeEnum(Gender).optional(),
  birthDate: z.string().optional().transform((val) => (val ? new Date(val) : undefined)),
  deathDate: z.string().optional().transform((val) => (val ? new Date(val) : undefined)),
  photoFileId: z.string().optional(),
  notes: z.string().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withPermission(request, PERMISSIONS.TREE_READ, async () => {
    try {
      const person = await TreeService.getPersonDetails(params.id)
      if (!person) {
        return NextResponse.json(
          { error: 'الشخص غير موجود' },
          { status: 404 }
        )
      }
      return NextResponse.json(person)
    } catch (error) {
      console.error('Error fetching person:', error)
      return NextResponse.json(
        { error: 'حدث خطأ أثناء جلب الشخص' },
        { status: 500 }
      )
    }
  })
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withPermission(request, PERMISSIONS.TREE_WRITE, async () => {
    try {
      const body = await request.json()
      const data = updatePersonSchema.parse(body)
      const person = await TreeService.updatePerson(params.id, data)
      return NextResponse.json(person)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: error.errors[0].message },
          { status: 400 }
        )
      }
      console.error('Error updating person:', error)
      return NextResponse.json(
        { error: 'حدث خطأ أثناء تحديث الشخص' },
        { status: 500 }
      )
    }
  })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withPermission(request, PERMISSIONS.TREE_DELETE, async () => {
    try {
      await TreeService.deletePerson(params.id)
      return NextResponse.json({ message: 'تم حذف الشخص بنجاح' })
    } catch (error: any) {
      console.error('Error deleting person:', error)
      return NextResponse.json(
        { error: error.message || 'حدث خطأ أثناء حذف الشخص' },
        { status: 500 }
      )
    }
  })
}
