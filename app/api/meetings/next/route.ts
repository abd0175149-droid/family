import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withPermission, withAuth } from '@/lib/middleware/rbac'
import { PERMISSIONS } from '@/lib/constants/permissions'
import { MeetingsService } from '@/lib/services/MeetingsService'
import { getAuthUser } from '@/lib/middleware/auth'

const updateNextMeetingSchema = z.object({
  meetingDate: z.string().transform((val) => new Date(val)),
  description: z.string().optional(),
})

export async function GET(request: NextRequest) {
  return withAuth(request, async () => {
    try {
      const nextMeeting = await MeetingsService.getNextMeeting()
      return NextResponse.json(nextMeeting)
    } catch (error) {
      console.error('Error fetching next meeting:', error)
      return NextResponse.json(
        { error: 'حدث خطأ أثناء جلب اللقاء القادم' },
        { status: 500 }
      )
    }
  })
}

export async function PUT(request: NextRequest) {
  return withPermission(request, PERMISSIONS.MEETINGS_WRITE, async (user) => {
    try {
      const body = await request.json()
      const data = updateNextMeetingSchema.parse(body)
      const nextMeeting = await MeetingsService.updateNextMeeting(data, user.id)
      return NextResponse.json(nextMeeting)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: error.errors[0].message },
          { status: 400 }
        )
      }
      console.error('Error updating next meeting:', error)
      return NextResponse.json(
        { error: 'حدث خطأ أثناء تحديث اللقاء القادم' },
        { status: 500 }
      )
    }
  })
}
