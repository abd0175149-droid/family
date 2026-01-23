import { NextRequest, NextResponse } from 'next/server'
import { withPermission } from '@/lib/middleware/rbac'
import { PERMISSIONS } from '@/lib/constants/permissions'
import { FinanceService } from '@/lib/services/FinanceService'

export async function GET(request: NextRequest) {
  return withPermission(request, PERMISSIONS.FINANCE_READ_ALL, async () => {
    try {
      const { searchParams } = new URL(request.url)
      const year = searchParams.get('year')
        ? parseInt(searchParams.get('year')!)
        : undefined
      const month = searchParams.get('month')
        ? parseInt(searchParams.get('month')!)
        : undefined

      const dashboard = await FinanceService.getFinanceDashboard(year, month)
      return NextResponse.json(dashboard)
    } catch (error) {
      console.error('Error fetching finance dashboard:', error)
      return NextResponse.json(
        { error: 'حدث خطأ أثناء جلب لوحة المالية' },
        { status: 500 }
      )
    }
  })
}
