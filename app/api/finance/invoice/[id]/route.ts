import { NextRequest, NextResponse } from 'next/server'
import { withPermission } from '@/lib/middleware/rbac'
import { PERMISSIONS } from '@/lib/constants/permissions'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withPermission(request, PERMISSIONS.FINANCE_READ_ALL, async () => {
    try {
      const invoice = await prisma.invoice.findUnique({
        where: { id: params.id },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
          payments: {
            include: {
              receiptFile: true,
              creator: {
                select: {
                  id: true,
                  fullName: true,
                },
              },
            },
            orderBy: {
              paidAt: 'desc',
            },
          },
        },
      })

      if (!invoice) {
        return NextResponse.json(
          { error: 'الفاتورة غير موجودة' },
          { status: 404 }
        )
      }

      return NextResponse.json(invoice)
    } catch (error) {
      console.error('Error fetching invoice:', error)
      return NextResponse.json(
        { error: 'حدث خطأ أثناء جلب الفاتورة' },
        { status: 500 }
      )
    }
  })
}
