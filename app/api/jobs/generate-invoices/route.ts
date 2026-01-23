import { NextRequest, NextResponse } from 'next/server'
import { FinanceService } from '@/lib/services/FinanceService'

export async function POST(request: NextRequest) {
  try {
    // Verify secret token
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')
    const expectedToken = process.env.CRON_SECRET

    if (!expectedToken || token !== expectedToken) {
      return NextResponse.json(
        { error: 'غير مصرح' },
        { status: 401 }
      )
    }

    // Get current month
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1

    // Generate invoices
    const invoices = await FinanceService.generateMonthlyInvoices(year, month)

    return NextResponse.json({
      message: 'تم توليد الفواتير بنجاح',
      year,
      month,
      count: invoices.length,
      invoices: invoices.map((inv) => ({
        id: inv.id,
        userId: inv.userId,
        year: inv.year,
        month: inv.month,
        dueAmount: inv.dueAmount,
      })),
    })
  } catch (error) {
    console.error('Error generating invoices:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء توليد الفواتير' },
      { status: 500 }
    )
  }
}
