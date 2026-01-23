import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withPermission } from '@/lib/middleware/rbac'
import { PERMISSIONS } from '@/lib/constants/permissions'
import { FinanceService } from '@/lib/services/FinanceService'
import { getAuthUser } from '@/lib/middleware/auth'

const setDuesSchema = z.object({
  userId: z.string(),
  monthlyAmount: z.number().positive('المبلغ يجب أن يكون موجب'),
  effectiveFrom: z.string().transform((val) => new Date(val)),
  effectiveTo: z.string().optional().transform((val) => (val ? new Date(val) : undefined)),
})

export async function POST(request: NextRequest) {
  return withPermission(request, PERMISSIONS.FINANCE_WRITE, async (user) => {
    try {
      const body = await request.json()
      const data = setDuesSchema.parse(body)
      const dues = await FinanceService.setMemberDues(data, user.id)
      return NextResponse.json(dues)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: error.errors[0].message },
          { status: 400 }
        )
      }
      console.error('Error setting member dues:', error)
      return NextResponse.json(
        { error: 'حدث خطأ أثناء تعيين الاشتراك' },
        { status: 500 }
      )
    }
  })
}
