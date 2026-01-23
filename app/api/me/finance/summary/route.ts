import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware/rbac'
import { FinanceService } from '@/lib/services/FinanceService'

export async function GET(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      const summary = await FinanceService.getMemberFinanceSummary(user.id)
      return NextResponse.json(summary)
    } catch (error) {
      console.error('Error fetching member finance summary:', error)
      return NextResponse.json(
        { error: 'حدث خطأ أثناء جلب الملخص المالي' },
        { status: 500 }
      )
    }
  })
}
