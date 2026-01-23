'use client'

import { useEffect, useState } from 'react'

interface VoteResult {
  id: string
  title: string
  locationUrl?: string
  voteCount: number
  votes: Array<{
    userId: string
    userName: string
  }>
}

interface VoteResultsData {
  meetingContext: string
  totalVotes: number
  options: VoteResult[]
}

export default function VoteResults() {
  const [results, setResults] = useState<VoteResultsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/meetings/vote/results')
      .then((res) => res.json())
      .then((data) => {
        setResults(data)
        setLoading(false)
      })
      .catch((error) => {
        console.error('Error fetching vote results:', error)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return <div className="p-4 text-center">جاري التحميل...</div>
  }

  if (!results || results.options.length === 0) {
    return null
  }

  const maxVotes = Math.max(...results.options.map((o) => o.voteCount))

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-4">نتائج التصويت</h2>
      <div className="mb-4 text-gray-600 dark:text-gray-400">
        إجمالي الأصوات: {results.totalVotes}
      </div>
      <div className="space-y-4">
        {results.options.map((option) => (
          <div key={option.id}>
            <div className="flex justify-between items-center mb-2">
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
              </div>
              <div className="text-lg font-bold">
                {option.voteCount} صوت ({maxVotes > 0 ? Math.round((option.voteCount / results.totalVotes) * 100) : 0}%)
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{
                  width: `${maxVotes > 0 ? (option.voteCount / maxVotes) * 100 : 0}%`,
                }}
              />
            </div>
            {option.votes.length > 0 && (
              <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                المصوتون: {option.votes.map((v) => v.userName).join(', ')}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
