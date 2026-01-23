'use client'

import { useEffect, useState } from 'react'

interface User {
  id: string
  fullName: string
  email: string
  phone?: string
  role: string
  status: string
  person?: {
    fullName: string
  }
}

export default function UsersTable() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/users')
      .then((res) => res.json())
      .then((data) => {
        setUsers(data)
        setLoading(false)
      })
      .catch((error) => {
        console.error('Error fetching users:', error)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return <div className="p-8 text-center">جاري التحميل...</div>
  }

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      super_admin: 'مدير عام',
      secretary: 'أمين سر',
      treasurer: 'أمين صندوق',
      member: 'عضو',
    }
    return labels[role] || role
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">إدارة المستخدمين</h1>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-right p-4">الاسم</th>
              <th className="text-right p-4">البريد الإلكتروني</th>
              <th className="text-right p-4">الهاتف</th>
              <th className="text-right p-4">الدور</th>
              <th className="text-right p-4">الحالة</th>
              <th className="text-right p-4">الشخص المرتبط</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b">
                <td className="p-4">{user.fullName}</td>
                <td className="p-4">{user.email}</td>
                <td className="p-4">{user.phone || '-'}</td>
                <td className="p-4">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                    {getRoleLabel(user.role)}
                  </span>
                </td>
                <td className="p-4">
                  <span
                    className={`px-2 py-1 rounded text-sm ${
                      user.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {user.status === 'active' ? 'نشط' : 'معطل'}
                  </span>
                </td>
                <td className="p-4">{user.person?.fullName || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {users.length === 0 && (
        <div className="text-center py-8 text-gray-600 dark:text-gray-400">
          لا يوجد مستخدمين
        </div>
      )}
    </div>
  )
}
