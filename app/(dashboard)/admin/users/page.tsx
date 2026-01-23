import DashboardLayout from '@/components/layout/DashboardLayout'
import UsersTable from '@/components/admin/UsersTable'

export default function AdminUsersPage() {
  return (
    <DashboardLayout role="super_admin">
      <UsersTable />
    </DashboardLayout>
  )
}
