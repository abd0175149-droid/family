import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware/rbac'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      const invoices = await prisma.invoice.findMany({
        where: { userId: user.id },
        include: {
          payments: {
            orderBy: {
              paidAt: 'desc',
            },
            include: {
              receiptFile: true,
            },
          },
        },
        orderBy: [
          { year: 'desc' },
          { month: 'desc' },
        ],
      })

      return NextResponse.json(invoices)
    } catch (error) {
      console.error('Error fetching member invoices:', error)
      return NextResponse.json(
        { error: 'حدث خطأ أثناء جلب الفواتير' },
        { status: 500 }
      )
    }
  })
}
