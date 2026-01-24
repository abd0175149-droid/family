import { NextRequest, NextResponse } from 'next/server'
import { withPermission } from '@/lib/middleware/rbac'
import { PERMISSIONS } from '@/lib/constants/permissions'
import { TreeService } from '@/lib/services/TreeService'

export async function GET(request: NextRequest) {
  return withPermission(request, PERMISSIONS.TREE_READ, async () => {
    try {
      const { searchParams } = new URL(request.url)
      const query = (searchParams.get('q') || '').trim()
      
      const results = await TreeService.searchPersons(query)
      return NextResponse.json(results)
    } catch (error) {
      console.error('Error searching persons:', error)
      return NextResponse.json(
        { error: 'حدث خطأ أثناء البحث' },
        { status: 500 }
      )
    }
  })
}
