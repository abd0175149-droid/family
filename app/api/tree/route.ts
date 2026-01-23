import { NextRequest, NextResponse } from 'next/server'
import { withPermission } from '@/lib/middleware/rbac'
import { PERMISSIONS } from '@/lib/constants/permissions'
import { TreeService } from '@/lib/services/TreeService'

export async function GET(request: NextRequest) {
  return withPermission(request, PERMISSIONS.TREE_READ, async () => {
    try {
      const tree = await TreeService.getTreeStructure()
      return NextResponse.json(tree)
    } catch (error) {
      console.error('Error fetching tree:', error)
      return NextResponse.json(
        { error: 'حدث خطأ أثناء جلب الشجرة' },
        { status: 500 }
      )
    }
  })
}
