'use client'

import { useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import AddPersonForm from '@/components/tree/AddPersonForm'
import AddHouseholdForm from '@/components/tree/AddHouseholdForm'

type FormType = 'person' | 'household'

export default function AddTreeItemPage() {
  const [formType, setFormType] = useState<FormType>('person')

  const handleSuccess = () => {
    window.location.replace('/tree')
  }

  const handleCancel = () => {
    window.location.replace('/tree')
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
        {/* Tabs */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl p-2 shadow-soft border border-slate-200/50 dark:border-slate-800/50">
          <div className="flex gap-2">
            <button
              onClick={() => setFormType('person')}
              className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all ${
                formType === 'person'
                  ? 'gradient-primary text-white shadow-glow'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              ➕ إضافة شخص
            </button>
            <button
              onClick={() => setFormType('household')}
              className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all ${
                formType === 'household'
                  ? 'gradient-primary text-white shadow-glow'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              🏠 إنشاء أسرة
            </button>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl p-6 lg:p-8 shadow-soft border border-slate-200/50 dark:border-slate-800/50">
          {formType === 'person' ? (
            <AddPersonForm onSuccess={handleSuccess} onCancel={handleCancel} />
          ) : (
            <AddHouseholdForm onSuccess={handleSuccess} onCancel={handleCancel} />
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
