'use client'

import { useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import AddPersonForm from '@/components/tree/AddPersonForm'
import AddHouseholdForm from '@/components/tree/AddHouseholdForm'

type FormType = 'person' | 'household'

export default function AddTreeItemPage() {
  const [formType, setFormType] = useState<FormType>('person')

  const handleSuccess = (householdId?: string) => {
    if (householdId) {
      window.location.replace(`/tree/household/${householdId}/edit`)
    } else {
      window.location.replace('/tree')
    }
  }

  const handleCancel = () => {
    window.location.replace('/tree')
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
        {/* Tabs */}
        <div className="glass-effect rounded-2xl p-2 shadow-soft border border-gray-200 dark:border-gray-800">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFormType('person')}
              className={`flex-1 min-w-[120px] px-4 py-3 rounded-xl font-semibold transition-all ${
                formType === 'person'
                  ? 'gradient-primary text-white shadow-glow'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/50'
              }`}
            >
              ➕ إضافة شخص
            </button>
            <button
              onClick={() => setFormType('household')}
              className={`flex-1 min-w-[120px] px-4 py-3 rounded-xl font-semibold transition-all ${
                formType === 'household'
                  ? 'gradient-primary text-white shadow-glow'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/50'
              }`}
            >
              🏠 إنشاء أسرة
            </button>
          </div>
        </div>

        <div className="glass-effect rounded-2xl p-4 sm:p-6 lg:p-8 shadow-soft border border-gray-200 dark:border-gray-800">
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
