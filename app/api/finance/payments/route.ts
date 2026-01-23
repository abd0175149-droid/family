import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withPermission } from '@/lib/middleware/rbac'
import { PERMISSIONS } from '@/lib/constants/permissions'
import { FinanceService } from '@/lib/services/FinanceService'
import { getAuthUser } from '@/lib/middleware/auth'

const createPaymentSchema = z.object({
  userId: z.string(),
  invoiceId: z.string(),
  amountPaid: z.number().positive('المبلغ يجب أن يكون موجب'),
  paidAt: z.string().transform((val) => new Date(val)),
  receiptFileId: z.string().optional(),
})

export async function POST(request: NextRequest) {
  return withPermission(request, PERMISSIONS.FINANCE_WRITE, async (user) => {
    try {
      const body = await request.json()
      const data = createPaymentSchema.parse(body)
      const payment = await FinanceService.createPayment(data, user.id)
      return NextResponse.json(payment)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: error.errors[0].message },
          { status: 400 }
        )
      }
      console.error('Error creating payment:', error)
      return NextResponse.json(
        { error: 'حدث خطأ أثناء تسجيل الدفعة' },
        { status: 500 }
      )
    }
  })
}
