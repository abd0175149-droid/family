import DashboardLayout from '@/components/layout/DashboardLayout'
import MemberFinanceSummary from '@/components/finance/MemberFinanceSummary'

export default function MyFinancePage() {
  return (
    <DashboardLayout role="member">
      <MemberFinanceSummary />
    </DashboardLayout>
  )
}
