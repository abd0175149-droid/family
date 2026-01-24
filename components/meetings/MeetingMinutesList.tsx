'use client'

import { useEffect, useState } from 'react'

interface MeetingMinute {
  id: string
  meetingDate: string
  title: string
  content: string
  status: string
  creator: {
    fullName: string
  }
}

export default function MeetingMinutesList() {
  const [minutes, setMinutes] = useState<MeetingMinute[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('')

  useEffect(() => {
    const url = statusFilter
      ? `/api/meetings/minutes?status=${statusFilter}`
      : '/api/meetings/minutes'
    
    setLoading(true)
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        setMinutes(data)
        setLoading(false)
      })
      .catch((error) => {
        console.error('Error fetching minutes:', error)
        setLoading(false)
      })
  }, [statusFilter])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-gray-600 rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600 dark:text-gray-400 font-medium">جاري التحميل...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent mb-2">
            محاضر الاجتماعات
          </h1>
          <p className="text-gray-600 dark:text-gray-400">سجل اجتماعات العائلة</p>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-gray-100 font-medium transition-all"
        >
          <option value="">جميع الحالات</option>
          <option value="draft">مسودة</option>
          <option value="published">منشور</option>
          <option value="archived">مؤرشف</option>
        </select>
      </div>

      {minutes.length === 0 ? (
        <div className="glass-effect rounded-2xl p-8 sm:p-12 text-center border border-gray-200/50 dark:border-gray-800/50">
          <div className="text-5xl sm:text-6xl mb-4">📋</div>
          <p className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">لا توجد محاضر</p>
          <p className="text-gray-600 dark:text-gray-400">ابدأ بإنشاء محضر اجتماع جديد</p>
        </div>
      ) : (
        <div className="space-y-4 lg:space-y-6">
          {minutes.map((minute, index) => (
            <div
              key={minute.id}
              className="glass-effect rounded-2xl p-4 sm:p-6 lg:p-8 shadow-soft border border-gray-200/50 dark:border-gray-800/50 hover:shadow-glow transition-all duration-300 animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                <div className="flex-1">
                  <h3 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                    {minute.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                    <span className="flex items-center gap-1.5">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {new Date(minute.meetingDate).toLocaleDateString('ar-SA', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      بواسطة {minute.creator.fullName}
                    </span>
                  </div>
                </div>
                <span
                  className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
                    minute.status === 'published'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      : minute.status === 'archived'
                      ? 'bg-primary-100 text-primary-800 dark:bg-primary-900/50 dark:text-primary-300'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                  }`}
                >
                  {minute.status === 'published'
                    ? '✅ منشور'
                    : minute.status === 'archived'
                    ? '📦 مؤرشف'
                    : '📝 مسودة'}
                </span>
              </div>
              <div className="prose prose-slate dark:prose-invert max-w-none">
                <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {minute.content}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
