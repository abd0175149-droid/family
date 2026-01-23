import DashboardLayout from '@/components/layout/DashboardLayout'
import MeetingMinutesList from '@/components/meetings/MeetingMinutesList'

export default function MeetingsPage() {
  return (
    <DashboardLayout role="member">
      <MeetingMinutesList />
    </DashboardLayout>
  )
}
