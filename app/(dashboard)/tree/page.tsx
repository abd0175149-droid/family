'use client'

import Link from 'next/link'
import TreeView from '@/components/tree/TreeView'
import DashboardLayout from '@/components/layout/DashboardLayout'

export default function TreePage() {
  return (
    <DashboardLayout role="member">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 dark:text-slate-100 mb-2">
              الشجرة العائلية
            </h1>
            <p className="text-slate-600 dark:text-slate-400">استكشف روابط العائلة وعلاقاتها</p>
          </div>
          <Link
            href="/tree/add"
            className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-semibold px-6 py-3 rounded-lg elegant-shadow hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>إضافة جديد</span>
          </Link>
        </div>
        <TreeView />
      </div>
    </DashboardLayout>
  )
}
