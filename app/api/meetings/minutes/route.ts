import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withPermission, withAuth } from '@/lib/middleware/rbac'
import { PERMISSIONS } from '@/lib/constants/permissions'
import { MeetingsService } from '@/lib/services/MeetingsService'
import { MeetingStatus } from '@prisma/client'
import { getAuthUser } from '@/lib/middleware/auth'

const createMinuteSchema = z.object({
  meetingDate: z.string().transform((val) => new Date(val)),
  title: z.string().min(1, 'العنوان مطلوب'),
  content: z.string().min(1, 'المحتوى مطلوب'),
  status: z.nativeEnum(MeetingStatus).optional(),
})

export async function GET(request: NextRequest) {
  return withAuth(request, async () => {
    try {
      const { searchParams } = new URL(request.url)
      const status = searchParams.get('status') as MeetingStatus | null

      const minutes = await MeetingsService.getMeetingMinutes(status || undefined)
      return NextResponse.json(minutes)
    } catch (error) {
      console.error('Error fetching meeting minutes:', error)
      return NextResponse.json(
        { error: 'حدث خطأ أثناء جلب المحاضر' },
        { status: 500 }
      )
    }
  })
}

export async function POST(request: NextRequest) {
  return withPermission(request, PERMISSIONS.MEETINGS_WRITE, async (user) => {
    try {
      const body = await request.json()
      const data = createMinuteSchema.parse(body)
      const minute = await MeetingsService.createMeetingMinute(data, user.id)
      return NextResponse.json(minute)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: error.errors[0].message },
          { status: 400 }
        )
      }
      console.error('Error creating meeting minute:', error)
      return NextResponse.json(
        { error: 'حدث خطأ أثناء إنشاء المحضر' },
        { status: 500 }
      )
    }
  })
}
