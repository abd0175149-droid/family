import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware/rbac'
import { MeetingsService } from '@/lib/services/MeetingsService'

export async function GET(request: NextRequest) {
  return withAuth(request, async () => {
    try {
      const { searchParams } = new URL(request.url)
      const meetingContext = searchParams.get('context') || 'next_meeting'

      const results = await MeetingsService.getVoteResults(meetingContext)
      return NextResponse.json(results)
    } catch (error) {
      console.error('Error fetching vote results:', error)
      return NextResponse.json(
        { error: 'حدث خطأ أثناء جلب نتائج التصويت' },
        { status: 500 }
      )
    }
  })
}
