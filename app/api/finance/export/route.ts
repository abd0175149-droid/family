import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withPermission } from '@/lib/middleware/rbac'
import { PERMISSIONS } from '@/lib/constants/permissions'
import { FinanceService } from '@/lib/services/FinanceService'

const exportSchema = z.object({
  type: z.enum(['pdf', 'excel']),
  year: z.string().optional().transform((val) => (val ? parseInt(val) : undefined)),
  month: z.string().optional().transform((val) => (val ? parseInt(val) : undefined)),
})

export async function GET(request: NextRequest) {
  return withPermission(request, PERMISSIONS.FINANCE_EXPORT, async () => {
    try {
      const { searchParams } = new URL(request.url)
      const params = {
        type: searchParams.get('type') || 'pdf',
        year: searchParams.get('year') || undefined,
        month: searchParams.get('month') || undefined,
      }

      const data = exportSchema.parse(params)
      const report = await FinanceService.exportFinanceReport(
        data.type,
        data.year,
        data.month
      )

      return NextResponse.json(report)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: error.errors[0].message },
          { status: 400 }
        )
      }
      console.error('Error exporting finance report:', error)
      return NextResponse.json(
        { error: 'حدث خطأ أثناء تصدير التقرير' },
        { status: 500 }
      )
    }
  })
}
