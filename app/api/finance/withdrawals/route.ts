import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withPermission } from '@/lib/middleware/rbac'
import { PERMISSIONS } from '@/lib/constants/permissions'
import { FinanceService } from '@/lib/services/FinanceService'
import { getAuthUser } from '@/lib/middleware/auth'

const createWithdrawalSchema = z.object({
  amount: z.number().positive('المبلغ يجب أن يكون موجب'),
  reason: z.string().min(1, 'السبب مطلوب'),
  beneficiaryName: z.string().optional(),
  receiptFileId: z.string().optional(),
  withdrawnAt: z.string().transform((val) => new Date(val)),
})

export async function POST(request: NextRequest) {
  return withPermission(request, PERMISSIONS.FINANCE_WRITE, async (user) => {
    try {
      const body = await request.json()
      const data = createWithdrawalSchema.parse(body)
      const withdrawal = await FinanceService.createWithdrawal(data, user.id)
      return NextResponse.json(withdrawal)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: error.errors[0].message },
          { status: 400 }
        )
      }
      console.error('Error creating withdrawal:', error)
      return NextResponse.json(
        { error: 'حدث خطأ أثناء تسجيل السحب' },
        { status: 500 }
      )
    }
  })
}
