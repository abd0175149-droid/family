'use client'

import { useEffect, useState } from 'react'
import VoteOptions from './VoteOptions'
import VoteResults from './VoteResults'

interface NextMeeting {
  id: string
  meetingDate: string
  description?: string
  updatedBy: {
    fullName: string
  }
  updatedAt: string
}

export default function NextMeetingCard() {
  const [nextMeeting, setNextMeeting] = useState<NextMeeting | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/meetings/next')
      .then((res) => res.json())
      .then((data) => {
        setNextMeeting(data)
        setLoading(false)
      })
      .catch((error) => {
        console.error('Error fetching next meeting:', error)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return <div className="p-8 text-center">جاري التحميل...</div>
  }

  if (!nextMeeting) {
    return <div className="p-8 text-center text-red-600">حدث خطأ أثناء جلب البيانات</div>
  }

  return (
    <div className="p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">اللقاء القادم</h2>
        <div className="space-y-2">
          <div>
            <span className="text-gray-600 dark:text-gray-400">التاريخ: </span>
            <span className="font-semibold">
              {new Date(nextMeeting.meetingDate).toLocaleDateString('ar-SA', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>
          {nextMeeting.description && (
            <div>
              <span className="text-gray-600 dark:text-gray-400">الوصف: </span>
              <p>{nextMeeting.description}</p>
            </div>
          )}
          <div className="text-sm text-gray-500">
            آخر تحديث: {new Date(nextMeeting.updatedAt).toLocaleDateString('ar-SA')} بواسطة{' '}
            {nextMeeting.updatedBy.fullName}
          </div>
        </div>
      </div>

      <VoteOptions />
      <VoteResults />
    </div>
  )
}
