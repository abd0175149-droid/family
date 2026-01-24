'use client'

import { useState, useEffect } from 'react'
import { HouseholdMemberRole } from '@prisma/client'

interface Person {
  id: string
  fullName: string
  gender: string
}

interface AddHouseholdFormProps {
  onSuccess?: (householdId?: string) => void
  onCancel?: () => void
}

export default function AddHouseholdForm({ onSuccess, onCancel }: AddHouseholdFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [persons, setPersons] = useState<Person[]>([])
  const [loadingPersons, setLoadingPersons] = useState(true)
  const [personsLoadError, setPersonsLoadError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    members: [] as Array<{
      personId: string
      role: HouseholdMemberRole
      isPrimarySpouse: boolean
    }>,
  })

  const loadPersons = () => {
    setPersonsLoadError(null)
    setLoadingPersons(true)
    fetch('/api/tree/search?q=', { credentials: 'include' })
      .then((res) => {
        if (!res.ok) {
          setLoadingPersons(false)
          setPersonsLoadError('تعذر تحميل قائمة الأشخاص. تحقق من تسجيل الدخول وجرب مرة أخرى.')
          return null
        }
        return res.json()
      })
      .then((data) => {
        setLoadingPersons(false)
        if (data != null && Array.isArray(data)) {
          setPersons(data)
          setPersonsLoadError(null)
        } else {
          setPersonsLoadError('تعذر تحميل قائمة الأشخاص. تحقق من تسجيل الدخول وجرب مرة أخرى.')
        }
      })
      .catch(() => {
        setLoadingPersons(false)
        setPersonsLoadError('تعذر تحميل قائمة الأشخاص. تحقق من تسجيل الدخول وجرب مرة أخرى.')
      })
  }

  useEffect(() => {
    loadPersons()
  }, [])

  const addMember = () => {
    setFormData({
      ...formData,
      members: [
        ...formData.members,
        { personId: '', role: 'husband', isPrimarySpouse: false },
      ],
    })
  }

  const removeMember = (index: number) => {
    setFormData({
      ...formData,
      members: formData.members.filter((_, i) => i !== index),
    })
  }

  const updateMember = (index: number, field: string, value: any) => {
    const newMembers = [...formData.members]
    newMembers[index] = { ...newMembers[index], [field]: value }
    setFormData({ ...formData, members: newMembers })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // التحقق من أن جميع الأعضاء لديهم personId
    if (formData.members.some((m) => !m.personId)) {
      setError('يرجى اختيار شخص لكل عضو')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/tree/household', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: formData.title || undefined,
          members: formData.members,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        setError(errorData.error || 'حدث خطأ أثناء إنشاء الأسرة')
        setLoading(false)
        return
      }

      const data = await response.json()

      setFormData({
        title: '',
        members: [],
      })

      if (onSuccess) {
        onSuccess(data?.id)
      } else if (data?.id) {
        window.location.replace(`/tree/household/${data.id}/edit`)
      } else {
        window.location.replace('/tree')
      }
    } catch (error: any) {
      console.error('Error creating household:', error)
      setError(error.message || 'حدث خطأ أثناء إنشاء الأسرة')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-olive-900 dark:text-olive-50 mb-2 flex items-center gap-2">
          <span className="text-2xl">🏠</span>
          إنشاء أسرة جديدة
        </h2>
        <p className="text-olive-600 dark:text-olive-400 text-sm">
          أنشئ أسرة جديدة واربطها بالأشخاص الموجودين
        </p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl animate-slide-down flex items-center gap-2">
          <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      <div>
        <label htmlFor="title" className="block text-sm font-semibold text-olive-800 dark:text-olive-200 mb-2">
          عنوان الأسرة (اختياري)
        </label>
        <input
          id="title"
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="w-full px-4 py-3 border border-olive-200 dark:border-olive-700 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-olive-500 focus:border-transparent bg-white dark:bg-olive-900/50 text-olive-900 dark:text-olive-50 transition-all"
          placeholder="مثال: أسرة محمد وعائشة"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <label className="block text-sm font-semibold text-olive-800 dark:text-olive-200">
            أعضاء الأسرة
          </label>
          <button
            type="button"
            onClick={addMember}
            className="px-4 py-2 bg-olive-100 dark:bg-olive-900/30 text-olive-700 dark:text-olive-400 font-medium rounded-lg hover:bg-olive-200 dark:hover:bg-olive-900/50 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            إضافة عضو
          </button>
        </div>

        {loadingPersons ? (
          <div className="text-center py-8 text-olive-600 dark:text-olive-400">جاري تحميل الأشخاص...</div>
        ) : personsLoadError ? (
          <div className="text-center py-8 px-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl">
            <p className="text-orange-700 dark:text-orange-400 font-medium mb-4">{personsLoadError}</p>
            <button
              type="button"
              onClick={loadPersons}
              className="px-4 py-2 bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-300 font-medium rounded-lg hover:bg-orange-200 dark:hover:bg-orange-900/60 transition-colors"
            >
              إعادة المحاولة
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {formData.members.map((member, index) => (
              <div
                key={index}
                className="bg-olive-50/80 dark:bg-olive-900/30 rounded-xl p-4 border border-olive-200 dark:border-olive-700"
              >
                <div className="flex items-end justify-between gap-4 mb-3">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-olive-800 dark:text-olive-200 mb-2">
                      الشخص
                    </label>
                    <select
                      required
                      value={member.personId}
                      onChange={(e) => updateMember(index, 'personId', e.target.value)}
                      className="w-full px-4 py-2.5 border border-olive-200 dark:border-olive-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-olive-500 bg-white dark:bg-olive-900/50 text-olive-900 dark:text-olive-50"
                    >
                      <option value="">اختر شخصاً...</option>
                      {persons.map((person) => (
                        <option key={person.id} value={person.id}>
                          {person.fullName} ({person.gender === 'male' ? 'ذكر' : 'أنثى'})
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeMember(index)}
                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-olive-800 dark:text-olive-200 mb-2">
                      الدور
                    </label>
                    <select
                      required
                      value={member.role}
                      onChange={(e) => updateMember(index, 'role', e.target.value as HouseholdMemberRole)}
                      className="w-full px-4 py-2.5 border border-olive-200 dark:border-olive-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-olive-500 bg-white dark:bg-olive-900/50 text-olive-900 dark:text-olive-50"
                    >
                      <option value="husband">زوج</option>
                      <option value="wife">زوجة</option>
                      <option value="child">طفل</option>
                    </select>
                  </div>
                  {member.role === 'wife' && (
                    <div className="flex items-center pt-8">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={member.isPrimarySpouse}
                          onChange={(e) => updateMember(index, 'isPrimarySpouse', e.target.checked)}
                          className="w-4 h-4 text-olive-600 rounded focus:ring-olive-500"
                        />
                        <span className="text-sm text-olive-700 dark:text-olive-300">زوجة أساسية</span>
                      </label>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {formData.members.length === 0 && (
              <div className="text-center py-8 text-olive-600 dark:text-olive-400 border-2 border-dashed border-olive-200 dark:border-olive-700 rounded-xl">
                {'اضغط على \'إضافة عضو\' لإضافة أعضاء للأسرة'}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={loading || formData.members.length === 0}
          className="flex-1 gradient-primary text-white font-semibold py-3 px-4 rounded-xl shadow-lg hover:shadow-glow transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>جاري الإنشاء...</span>
            </>
          ) : (
            <>
              <span>إنشاء الأسرة</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </>
          )}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 bg-olive-100 dark:bg-olive-800/50 text-olive-800 dark:text-olive-200 font-semibold rounded-xl hover:bg-olive-200 dark:hover:bg-olive-800 transition-all"
          >
            إلغاء
          </button>
        )}
      </div>
    </form>
  )
}
