import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withPermission } from '@/lib/middleware/rbac'
import { PERMISSIONS } from '@/lib/constants/permissions'
import { TreeService } from '@/lib/services/TreeService'
import { HouseholdMemberRole } from '@prisma/client'

const createHouseholdSchema = z.object({
  title: z.string().optional(),
  members: z
    .array(
      z.object({
        personId: z.string(),
        role: z.nativeEnum(HouseholdMemberRole),
        isPrimarySpouse: z.boolean().optional(),
      })
    )
    .optional(),
})

export async function POST(request: NextRequest) {
  return withPermission(request, PERMISSIONS.TREE_WRITE, async () => {
    try {
      const body = await request.json()
      const data = createHouseholdSchema.parse(body)
      const household = await TreeService.createHousehold(data)
      return NextResponse.json(household)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: error.errors[0].message },
          { status: 400 }
        )
      }
      console.error('Error creating household:', error)
      return NextResponse.json(
        { error: 'حدث خطأ أثناء إنشاء الأسرة' },
        { status: 500 }
      )
    }
  })
}
