import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withPermission, withAuth } from '@/lib/middleware/rbac'
import { PERMISSIONS } from '@/lib/constants/permissions'
import { MeetingsService } from '@/lib/services/MeetingsService'
import { getAuthUser } from '@/lib/middleware/auth'

const createOptionSchema = z.object({
  title: z.string().min(1, 'العنوان مطلوب'),
  locationUrl: z.string().url().optional().or(z.literal('')),
  isForNextMeeting: z.boolean().optional(),
})

export async function GET(request: NextRequest) {
  return withAuth(request, async () => {
    try {
      const { searchParams } = new URL(request.url)
      const isForNextMeeting = searchParams.get('isForNextMeeting') !== 'false'

      const options = await MeetingsService.getVoteOptions(isForNextMeeting)
      return NextResponse.json(options)
    } catch (error) {
      console.error('Error fetching vote options:', error)
      return NextResponse.json(
        { error: 'حدث خطأ أثناء جلب خيارات التصويت' },
        { status: 500 }
      )
    }
  })
}

export async function POST(request: NextRequest) {
  return withPermission(request, PERMISSIONS.MEETINGS_WRITE, async (user) => {
    try {
      const body = await request.json()
      const data = createOptionSchema.parse(body)
      const option = await MeetingsService.createVoteOption(
        {
          title: data.title,
          locationUrl: data.locationUrl || undefined,
          isForNextMeeting: data.isForNextMeeting,
        },
        user.id
      )
      return NextResponse.json(option)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: error.errors[0].message },
          { status: 400 }
        )
      }
      console.error('Error creating vote option:', error)
      return NextResponse.json(
        { error: 'حدث خطأ أثناء إنشاء خيار التصويت' },
        { status: 500 }
      )
    }
  })
}
