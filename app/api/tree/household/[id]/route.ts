import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withPermission } from '@/lib/middleware/rbac'
import { PERMISSIONS } from '@/lib/constants/permissions'
import { TreeService } from '@/lib/services/TreeService'

const updateHouseholdSchema = z.object({
  title: z.string().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withPermission(request, PERMISSIONS.TREE_READ, async () => {
    try {
      const household = await TreeService.getHousehold(params.id)
      if (!household) {
        return NextResponse.json({ error: 'الأسرة غير موجودة' }, { status: 404 })
      }
      return NextResponse.json(household)
    } catch (e) {
      console.error('Error fetching household:', e)
      return NextResponse.json(
        { error: 'حدث خطأ أثناء جلب الأسرة' },
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
      const data = updateHouseholdSchema.parse(body)
      const household = await TreeService.updateHousehold(params.id, data)
      return NextResponse.json(household)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: error.errors[0].message },
          { status: 400 }
        )
      }
      console.error('Error updating household:', error)
      return NextResponse.json(
        { error: 'حدث خطأ أثناء تحديث الأسرة' },
        { status: 500 }
      )
    }
  })
}
