import { NextRequest, NextResponse } from 'next/server'
import { withPermission } from '@/lib/middleware/rbac'
import { PERMISSIONS } from '@/lib/constants/permissions'
import { MeetingsService } from '@/lib/services/MeetingsService'
import { getAuthUser } from '@/lib/middleware/auth'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withPermission(request, PERMISSIONS.MEETINGS_ARCHIVE, async (user) => {
    try {
      await MeetingsService.archiveMeetingMinute(params.id, user.id)
      return NextResponse.json({ message: 'تم أرشفة المحضر بنجاح' })
    } catch (error) {
      console.error('Error archiving meeting minute:', error)
      return NextResponse.json(
        { error: 'حدث خطأ أثناء أرشفة المحضر' },
        { status: 500 }
      )
    }
  })
}
