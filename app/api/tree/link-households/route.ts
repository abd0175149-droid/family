import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withPermission } from '@/lib/middleware/rbac'
import { PERMISSIONS } from '@/lib/constants/permissions'
import { TreeService } from '@/lib/services/TreeService'

const linkHouseholdsSchema = z.object({
  childHouseholdId: z.string(),
  parentHouseholdId: z.string(),
  linkViaPersonId: z.string(),
  viaSide: z.enum(['father_side', 'mother_side']).optional(),
})

export async function POST(request: NextRequest) {
  return withPermission(request, PERMISSIONS.TREE_WRITE, async () => {
    try {
      const body = await request.json()
      const data = linkHouseholdsSchema.parse(body)
      const link = await TreeService.linkHouseholds(data)
      return NextResponse.json(link)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: error.errors[0].message },
          { status: 400 }
        )
      }
      console.error('Error linking households:', error)
      return NextResponse.json(
        { error: 'حدث خطأ أثناء ربط الأسر' },
        { status: 500 }
      )
    }
  })
}
