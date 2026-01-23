'use client'

import { useEffect, useState } from 'react'

interface Person {
  id: string
  fullName: string
  gender: string
  birthDate?: string
  deathDate?: string
  notes?: string
  photoFile?: {
    filePath: string
  }
  householdMembers: Array<{
    household: {
      id: string
      title?: string
      members: Array<{
        person: {
          id: string
          fullName: string
        }
        role: string
      }>
    }
  }>
}

interface PersonModalProps {
  personId: string | null
  onClose: () => void
}

export default function PersonModal({ personId, onClose }: PersonModalProps) {
  const [person, setPerson] = useState<Person | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!personId) return

    setLoading(true)
    fetch(`/api/tree/person/${personId}`)
      .then((res) => res.json())
      .then((data) => {
        setPerson(data)
        setLoading(false)
      })
      .catch((error) => {
        console.error('Error fetching person:', error)
        setLoading(false)
      })
  }, [personId])

  if (!personId) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">تفاصيل الشخص</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ✕
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8">جاري التحميل...</div>
        ) : person ? (
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg">{person.fullName}</h3>
              <p className="text-gray-600 dark:text-gray-400">
                {person.gender === 'male' ? 'ذكر' : 'أنثى'}
              </p>
            </div>

            {person.birthDate && (
              <div>
                <span className="text-gray-600 dark:text-gray-400">تاريخ الميلاد: </span>
                <span>{new Date(person.birthDate).toLocaleDateString('ar-SA')}</span>
              </div>
            )}

            {person.deathDate && (
              <div>
                <span className="text-gray-600 dark:text-gray-400">تاريخ الوفاة: </span>
                <span>{new Date(person.deathDate).toLocaleDateString('ar-SA')}</span>
              </div>
            )}

            {person.notes && (
              <div>
                <span className="text-gray-600 dark:text-gray-400">ملاحظات: </span>
                <p>{person.notes}</p>
              </div>
            )}

            {person.householdMembers.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">الأسرة</h4>
                {person.householdMembers.map((hm) => (
                  <div key={hm.household.id} className="mb-2">
                    {hm.household.title && (
                      <div className="font-medium">{hm.household.title}</div>
                    )}
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {hm.household.members
                        .filter((m) => m.person.id !== person.id)
                        .map((m) => m.person.fullName)
                        .join(', ')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-red-600">حدث خطأ أثناء جلب البيانات</div>
        )}
      </div>
    </div>
  )
}
