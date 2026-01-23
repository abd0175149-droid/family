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
    return <div className="p-8 text-center">جاري التحميل...</div>
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">محاضر الاجتماعات</h1>

      <div className="mb-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border rounded"
        >
          <option value="">جميع الحالات</option>
          <option value="draft">مسودة</option>
          <option value="published">منشور</option>
          <option value="archived">مؤرشف</option>
        </select>
      </div>

      <div className="space-y-4">
        {minutes.map((minute) => (
          <div
            key={minute.id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-4"
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="text-lg font-semibold">{minute.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {new Date(minute.meetingDate).toLocaleDateString('ar-SA')} - بواسطة{' '}
                  {minute.creator.fullName}
                </p>
              </div>
              <span
                className={`px-2 py-1 rounded text-sm ${
                  minute.status === 'published'
                    ? 'bg-green-100 text-green-800'
                    : minute.status === 'archived'
                    ? 'bg-gray-100 text-gray-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}
              >
                {minute.status === 'published'
                  ? 'منشور'
                  : minute.status === 'archived'
                  ? 'مؤرشف'
                  : 'مسودة'}
              </span>
            </div>
            <div className="mt-4 whitespace-pre-wrap">{minute.content}</div>
          </div>
        ))}
      </div>

      {minutes.length === 0 && (
        <div className="text-center py-8 text-gray-600 dark:text-gray-400">
          لا توجد محاضر
        </div>
      )}
    </div>
  )
}
