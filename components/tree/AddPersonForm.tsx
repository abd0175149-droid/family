'use client'

import { useState } from 'react'
import { Gender } from '@prisma/client'

interface AddPersonFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

export default function AddPersonForm({ onSuccess, onCancel }: AddPersonFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    fullName: '',
    gender: 'male' as Gender,
    birthDate: '',
    deathDate: '',
    notes: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/tree/person', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          birthDate: formData.birthDate || undefined,
          deathDate: formData.deathDate || undefined,
          notes: formData.notes || undefined,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        setError(errorData.error || 'حدث خطأ أثناء إضافة الشخص')
        setLoading(false)
        return
      }

      const data = await response.json()
      console.log('Person created:', data)

      // Reset form
      setFormData({
        fullName: '',
        gender: 'male',
        birthDate: '',
        deathDate: '',
        notes: '',
      })

      if (onSuccess) {
        onSuccess()
      }
    } catch (error: any) {
      console.error('Error creating person:', error)
      setError(error.message || 'حدث خطأ أثناء إضافة الشخص')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-2">
          <span className="text-2xl">➕</span>
          إضافة شخص جديد
        </h2>
        <p className="text-slate-600 dark:text-slate-400 text-sm">
          أضف شخصاً جديداً إلى الشجرة العائلية
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label htmlFor="fullName" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
            الاسم الكامل <span className="text-red-500">*</span>
          </label>
          <input
            id="fullName"
            type="text"
            required
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 transition-all"
            placeholder="أدخل الاسم الكامل"
          />
        </div>

        <div>
          <label htmlFor="gender" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
            الجنس <span className="text-red-500">*</span>
          </label>
          <select
            id="gender"
            required
            value={formData.gender}
            onChange={(e) => setFormData({ ...formData, gender: e.target.value as Gender })}
            className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 transition-all"
          >
            <option value="male">ذكر</option>
            <option value="female">أنثى</option>
          </select>
        </div>

        <div>
          <label htmlFor="birthDate" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
            تاريخ الميلاد
          </label>
          <input
            id="birthDate"
            type="date"
            value={formData.birthDate}
            onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
            className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 transition-all"
          />
        </div>

        <div>
          <label htmlFor="deathDate" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
            تاريخ الوفاة (إن وجد)
          </label>
          <input
            id="deathDate"
            type="date"
            value={formData.deathDate}
            onChange={(e) => setFormData({ ...formData, deathDate: e.target.value })}
            className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 transition-all"
          />
        </div>

        <div className="md:col-span-2">
          <label htmlFor="notes" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
            ملاحظات
          </label>
          <textarea
            id="notes"
            rows={4}
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 transition-all resize-none"
            placeholder="أضف أي ملاحظات إضافية..."
          />
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 gradient-primary text-white font-semibold py-3 px-4 rounded-xl shadow-lg hover:shadow-glow transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>جاري الإضافة...</span>
            </>
          ) : (
            <>
              <span>إضافة الشخص</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </>
          )}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
          >
            إلغاء
          </button>
        )}
      </div>
    </form>
  )
}
