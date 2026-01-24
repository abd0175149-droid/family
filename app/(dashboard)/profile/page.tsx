'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useRouter } from 'next/navigation'

interface UserProfile {
  id: string
  fullName: string
  email: string
  phone?: string
  role: string
  status: string
  lastLoginAt?: string
  createdAt: string
  person?: {
    id: string
    fullName: string
    gender: string
    birthDate?: string
    deathDate?: string
    notes?: string
    photoFile?: {
      id: string
      filePath: string
    }
  }
}

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then((res) => {
        if (!res.ok) {
          window.location.href = '/login'
          return null
        }
        return res.json()
      })
      .then((data) => {
        if (data?.user) {
          setUser(data.user)
        }
        setLoading(false)
      })
      .catch((error) => {
        console.error('Error fetching profile:', error)
        setError('حدث خطأ أثناء جلب البيانات')
        setLoading(false)
      })
  }, [router])

  const getRoleLabel = (role: string) => {
    const roles: Record<string, string> = {
      super_admin: 'مدير عام',
      secretary: 'أمين سر',
      treasurer: 'أمين صندوق',
      member: 'عضو',
    }
    return roles[role] || role
  }

  const getStatusLabel = (status: string) => {
    return status === 'active' ? 'نشط' : 'معطل'
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 border-4 border-olive-200 border-t-olive-600 rounded-full animate-spin mx-auto"></div>
            <p className="text-olive-600 dark:text-olive-400 font-medium">جاري التحميل...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error || !user) {
    return (
      <DashboardLayout>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6 text-center">
          <p className="text-red-600 dark:text-red-400 font-medium">{error || 'لم يتم العثور على البيانات'}</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-olive-600 to-burgundy-500 bg-clip-text text-transparent mb-2">
            الملف الشخصي
          </h1>
          <p className="text-olive-600 dark:text-olive-400">عرض وتعديل معلوماتك الشخصية</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <div className="lg:col-span-2 space-y-6">
            {/* User Info Card */}
            <div className="glass-effect rounded-2xl p-4 sm:p-6 lg:p-8 shadow-soft border border-olive-200/50 dark:border-olive-800/50">
              <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-6 mb-6">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl gradient-primary flex items-center justify-center text-white text-3xl sm:text-4xl font-bold shadow-glow flex-shrink-0">
                  {user.fullName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl sm:text-2xl font-bold text-olive-900 dark:text-olive-100 mb-2">
                    {user.fullName}
                  </h2>
                  <p className="text-olive-600 dark:text-olive-400 mb-4 truncate">{user.email}</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-olive-100 text-olive-800 dark:bg-olive-900/30 dark:text-olive-400">
                      {getRoleLabel(user.role)}
                    </span>
                    <span
                      className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold ${
                        user.status === 'active'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                      }`}
                    >
                      {getStatusLabel(user.status)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6 border-t border-olive-200/50 dark:border-olive-800/50">
                <div>
                  <p className="text-sm font-medium text-olive-600 dark:text-olive-400 mb-1">البريد الإلكتروني</p>
                  <p className="text-olive-900 dark:text-olive-100 font-medium">{user.email}</p>
                </div>
                {user.phone && (
                  <div>
                    <p className="text-sm font-medium text-olive-600 dark:text-olive-400 mb-1">رقم الهاتف</p>
                    <p className="text-olive-900 dark:text-olive-100 font-medium">{user.phone}</p>
                  </div>
                )}
                {user.lastLoginAt && (
                  <div>
                    <p className="text-sm font-medium text-olive-600 dark:text-olive-400 mb-1">آخر تسجيل دخول</p>
                    <p className="text-olive-900 dark:text-olive-100 font-medium">
                      {new Date(user.lastLoginAt).toLocaleDateString('ar-SA', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-olive-600 dark:text-olive-400 mb-1">تاريخ التسجيل</p>
                  <p className="text-olive-900 dark:text-olive-100 font-medium">
                    {new Date(user.createdAt).toLocaleDateString('ar-SA', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Person Info Card */}
            {user.person && (
              <div className="glass-effect rounded-2xl p-4 sm:p-6 lg:p-8 shadow-soft border border-olive-200/50 dark:border-olive-800/50">
                <h3 className="text-xl font-bold text-olive-900 dark:text-olive-100 mb-6 flex items-center gap-2">
                  <span className="text-2xl">👤</span>
                  معلومات الشخص في الشجرة
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-olive-600 dark:text-olive-400 mb-1">الاسم الكامل</p>
                    <p className="text-olive-900 dark:text-olive-100 font-medium">{user.person.fullName}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-olive-600 dark:text-olive-400 mb-1">الجنس</p>
                    <p className="text-olive-900 dark:text-olive-100 font-medium">
                      {user.person.gender === 'male' ? 'ذكر' : 'أنثى'}
                    </p>
                  </div>
                  {user.person.birthDate && (
                    <div>
                      <p className="text-sm font-medium text-olive-600 dark:text-olive-400 mb-1">تاريخ الميلاد</p>
                      <p className="text-olive-900 dark:text-olive-100 font-medium">
                        {new Date(user.person.birthDate).toLocaleDateString('ar-SA', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  )}
                  {user.person.deathDate && (
                    <div>
                      <p className="text-sm font-medium text-olive-600 dark:text-olive-400 mb-1">تاريخ الوفاة</p>
                      <p className="text-olive-900 dark:text-olive-100 font-medium">
                        {new Date(user.person.deathDate).toLocaleDateString('ar-SA', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  )}
                  {user.person.notes && (
                    <div className="md:col-span-2">
                      <p className="text-sm font-medium text-olive-600 dark:text-olive-400 mb-1">ملاحظات</p>
                      <p className="text-olive-900 dark:text-olive-100">{user.person.notes}</p>
                    </div>
                  )}
                  {user.person.photoFile && (
                    <div className="md:col-span-2">
                      <p className="text-sm font-medium text-olive-600 dark:text-olive-400 mb-2">الصورة الشخصية</p>
                      <img
                        src={`/api/files/${user.person.photoFile.id}`}
                        alt={user.person.fullName}
                        className="w-32 h-32 rounded-xl object-cover shadow-lg"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {!user.person && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-6 text-center">
                <p className="text-amber-700 dark:text-amber-400 font-medium">
                  لم يتم ربط حسابك بشخص في الشجرة العائلية
                </p>
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-olive-500 to-burgundy-500 rounded-2xl p-4 sm:p-6 text-white shadow-glow">
              <h3 className="text-lg font-bold mb-4">إحصائيات سريعة</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-white/90">الدور</span>
                  <span className="font-bold">{getRoleLabel(user.role)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/90">الحالة</span>
                  <span className="font-bold">{getStatusLabel(user.status)}</span>
                </div>
              </div>
            </div>

            <div className="glass-effect rounded-2xl p-4 sm:p-6 shadow-soft border border-olive-200/50 dark:border-olive-800/50">
              <h3 className="text-lg font-bold text-olive-900 dark:text-olive-100 mb-4">إجراءات سريعة</h3>
              <div className="space-y-2">
                <button
                  onClick={() => router.push('/my-finance')}
                  className="w-full px-4 py-2.5 bg-olive-100 dark:bg-olive-800/50 text-olive-800 dark:text-olive-200 font-medium rounded-lg hover:bg-olive-200 dark:hover:bg-olive-800 transition-colors text-right"
                >
                  💳 عرض دفعاتي
                </button>
                <button
                  onClick={() => router.push('/tree')}
                  className="w-full px-4 py-2.5 bg-olive-100 dark:bg-olive-800/50 text-olive-800 dark:text-olive-200 font-medium rounded-lg hover:bg-olive-200 dark:hover:bg-olive-800 transition-colors text-right"
                >
                  🌳 عرض الشجرة
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
