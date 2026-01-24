import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withPermission } from '@/lib/middleware/rbac'
import { PERMISSIONS } from '@/lib/constants/permissions'
import { TreeService } from '@/lib/services/TreeService'
import { HouseholdMemberRole } from '@prisma/client'

const addMemberSchema = z.object({
  personId: z.string().min(1, 'يجب اختيار شخص'),
  role: z.nativeEnum(HouseholdMemberRole),
  isPrimarySpouse: z.boolean().optional(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withPermission(request, PERMISSIONS.TREE_WRITE, async () => {
    try {
      const body = await request.json()
      const data = addMemberSchema.parse(body)
      await TreeService.addHouseholdMember(
        params.id,
        data.personId,
        data.role,
        data.isPrimarySpouse ?? false
      )
      const household = await TreeService.getHousehold(params.id)
      return NextResponse.json(household)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: error.errors[0].message },
          { status: 400 }
        )
      }
      console.error('Error adding household member:', error)
      return NextResponse.json(
        { error: 'حدث خطأ أثناء إضافة العضو' },
        { status: 500 }
      )
    }
  })
}
