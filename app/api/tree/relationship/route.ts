import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withPermission } from '@/lib/middleware/rbac'
import { PERMISSIONS } from '@/lib/constants/permissions'
import { TreeService } from '@/lib/services/TreeService'
import { RelationType } from '@prisma/client'

const createRelationshipSchema = z.object({
  personId1: z.string(),
  personId2: z.string(),
  relationType: z.nativeEnum(RelationType),
  startDate: z.string().optional().transform((val) => (val ? new Date(val) : undefined)),
  endDate: z.string().optional().transform((val) => (val ? new Date(val) : undefined)),
})

export async function POST(request: NextRequest) {
  return withPermission(request, PERMISSIONS.TREE_WRITE, async () => {
    try {
      const body = await request.json()
      const data = createRelationshipSchema.parse(body)
      const relationship = await TreeService.createRelationship(data)
      return NextResponse.json(relationship)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: error.errors[0].message },
          { status: 400 }
        )
      }
      console.error('Error creating relationship:', error)
      return NextResponse.json(
        { error: 'حدث خطأ أثناء إنشاء العلاقة' },
        { status: 500 }
      )
    }
  })
}
