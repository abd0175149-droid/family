import DashboardLayout from '@/components/layout/DashboardLayout'
import NextMeetingCard from '@/components/meetings/NextMeetingCard'

export default function NextMeetingPage() {
  return (
    <DashboardLayout role="member">
      <NextMeetingCard />
    </DashboardLayout>
  )
}
