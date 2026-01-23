import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withPermission } from '@/lib/middleware/rbac'
import { PERMISSIONS } from '@/lib/constants/permissions'
import { MeetingsService } from '@/lib/services/MeetingsService'

const castVoteSchema = z.object({
  optionId: z.string(),
  meetingContext: z.string().optional().default('next_meeting'),
})

export async function POST(request: NextRequest) {
  return withPermission(request, PERMISSIONS.VOTE_CAST, async (user) => {
    try {
      const body = await request.json()
      const data = castVoteSchema.parse(body)
      const vote = await MeetingsService.castVote(
        user.id,
        data.optionId,
        data.meetingContext
      )
      return NextResponse.json(vote)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: error.errors[0].message },
          { status: 400 }
        )
      }
      console.error('Error casting vote:', error)
      return NextResponse.json(
        { error: 'حدث خطأ أثناء التصويت' },
        { status: 500 }
      )
    }
  })
}
