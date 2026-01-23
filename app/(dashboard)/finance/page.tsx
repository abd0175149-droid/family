import DashboardLayout from '@/components/layout/DashboardLayout'
import FinanceDashboard from '@/components/finance/FinanceDashboard'

export default function FinancePage() {
  return (
    <DashboardLayout role="treasurer">
      <FinanceDashboard />
    </DashboardLayout>
  )
}
