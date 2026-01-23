'use client'

import { useEffect, useState } from 'react'

interface VoteOption {
  id: string
  title: string
  locationUrl?: string
  votes: Array<{
    userId: string
  }>
}

export default function VoteOptions() {
  const [options, setOptions] = useState<VoteOption[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [voting, setVoting] = useState(false)

  useEffect(() => {
    fetch('/api/meetings/vote/options')
      .then((res) => res.json())
      .then((data) => {
        setOptions(data)
        setLoading(false)
      })
      .catch((error) => {
        console.error('Error fetching vote options:', error)
        setLoading(false)
      })
  }, [])

  const handleVote = async (optionId: string) => {
    setVoting(true)
    try {
      const response = await fetch('/api/meetings/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ optionId }),
      })

      if (response.ok) {
        setSelectedOption(optionId)
        // Refresh options to show updated vote count
        const data = await fetch('/api/meetings/vote/options').then((res) => res.json())
        setOptions(data)
      } else {
        const error = await response.json()
        alert(error.error || 'حدث خطأ أثناء التصويت')
      }
    } catch (error) {
      console.error('Error voting:', error)
      alert('حدث خطأ أثناء التصويت')
    } finally {
      setVoting(false)
    }
  }

  if (loading) {
    return <div className="p-4 text-center">جاري التحميل...</div>
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
      <h2 className="text-xl font-bold mb-4">خيارات التصويت</h2>
      <div className="space-y-2">
        {options.map((option) => (
          <div
            key={option.id}
            className="flex items-center justify-between p-3 border rounded hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <div className="flex-1">
              <div className="font-medium">{option.title}</div>
              {option.locationUrl && (
                <a
                  href={option.locationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline"
                >
                  عرض الموقع
                </a>
              )}
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {option.votes.length} صوت
              </div>
            </div>
            <button
              onClick={() => handleVote(option.id)}
              disabled={voting || selectedOption === option.id}
              className={`px-4 py-2 rounded ${
                selectedOption === option.id
                  ? 'bg-green-600 text-white'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              } disabled:opacity-50`}
            >
              {selectedOption === option.id ? 'تم التصويت' : 'صوت'}
            </button>
          </div>
        ))}
      </div>
      {options.length === 0 && (
        <div className="text-center py-4 text-gray-600 dark:text-gray-400">
          لا توجد خيارات متاحة
        </div>
      )}
    </div>
  )
}
