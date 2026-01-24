import { NextRequest, NextResponse } from 'next/server'
import { withPermission } from '@/lib/middleware/rbac'
import { PERMISSIONS } from '@/lib/constants/permissions'
import { TreeService } from '@/lib/services/TreeService'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string; personId: string } }
) {
  return withPermission(_request, PERMISSIONS.TREE_WRITE, async () => {
    try {
      await TreeService.removeHouseholdMember(params.id, params.personId)
      const household = await TreeService.getHousehold(params.id)
      return NextResponse.json(household)
    } catch (error) {
      console.error('Error removing household member:', error)
      return NextResponse.json(
        { error: 'حدث خطأ أثناء إزالة العضو' },
        { status: 500 }
      )
    }
  })
}
