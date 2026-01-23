import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withPermission } from '@/lib/middleware/rbac'
import { PERMISSIONS } from '@/lib/constants/permissions'
import { MeetingsService } from '@/lib/services/MeetingsService'
import { MeetingStatus } from '@prisma/client'

const updateMinuteSchema = z.object({
  meetingDate: z.string().transform((val) => new Date(val)).optional(),
  title: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
  status: z.nativeEnum(MeetingStatus).optional(),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withPermission(request, PERMISSIONS.MEETINGS_WRITE, async (user) => {
    try {
      const body = await request.json()
      const data = updateMinuteSchema.parse(body)
      const minute = await MeetingsService.updateMeetingMinute(params.id, data, user.id)
      return NextResponse.json(minute)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: error.errors[0].message },
          { status: 400 }
        )
      }
      console.error('Error updating meeting minute:', error)
      return NextResponse.json(
        { error: 'حدث خطأ أثناء تحديث المحضر' },
        { status: 500 }
      )
    }
  })
}
