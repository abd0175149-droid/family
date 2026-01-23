import { NextRequest, NextResponse } from 'next/server'
import { withPermission } from '@/lib/middleware/rbac'
import { PERMISSIONS } from '@/lib/constants/permissions'
import { prisma } from '@/lib/prisma'
import { InvoiceStatus } from '@prisma/client'

export async function GET(request: NextRequest) {
  return withPermission(request, PERMISSIONS.FINANCE_READ_ALL, async () => {
    try {
      const { searchParams } = new URL(request.url)
      const year = searchParams.get('year')
      const month = searchParams.get('month')
      const status = searchParams.get('status') as InvoiceStatus | null

      const where: any = {}
      if (year) where.year = parseInt(year)
      if (month) where.month = parseInt(month)
      if (status) where.status = status

      const invoices = await prisma.invoice.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
          payments: {
            orderBy: {
              paidAt: 'desc',
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
      console.error('Error fetching invoices:', error)
      return NextResponse.json(
        { error: 'حدث خطأ أثناء جلب الفواتير' },
        { status: 500 }
      )
    }
  })
}
