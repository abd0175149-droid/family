'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Household {
  id: string
  title?: string
  members: Array<{
    id: string
    person: {
      id: string
      fullName: string
      gender: string
    }
    role: string
  }>
  childLinks: Array<{
    childHousehold: { id: string }
  }>
  parentLinks: Array<{
    parentHousehold: { id: string }
  }>
}

interface TreeData {
  households: Household[]
  relationships: any[]
}

export default function GridTreeView() {
  const [treeData, setTreeData] = useState<TreeData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/tree')
      .then((res) => res.json())
      .then((data) => {
        setTreeData(data)
        setLoading(false)
      })
      .catch((error) => {
        console.error('Error fetching tree:', error)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-olive-200 border-t-olive-600 rounded-full animate-spin mx-auto"></div>
          <p className="text-olive-600 dark:text-olive-400 font-medium">جاري تحميل الشجرة...</p>
        </div>
      </div>
    )
  }

  if (!treeData || treeData.households.length === 0) {
    return (
      <div className="glass-effect rounded-2xl p-8 sm:p-12 text-center border border-olive-200/50 dark:border-olive-800/50">
        <div className="text-5xl sm:text-6xl mb-4">🌳</div>
        <p className="text-lg sm:text-xl font-semibold text-olive-800 dark:text-olive-200 mb-2">لا توجد بيانات في الشجرة</p>
        <p className="text-olive-600 dark:text-olive-400">ابدأ بإضافة أسر جديدة</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
      {treeData.households.map((household, index) => (
        <HouseholdNode key={household.id} household={household} index={index} />
      ))}
    </div>
  )
}

function HouseholdNode({ household, index }: { household: Household; index: number }) {
  const husbands = household.members.filter((m) => m.role === 'husband')
  const wives = household.members.filter((m) => m.role === 'wife')
  const children = household.members.filter((m) => m.role === 'child')

  return (
    <div
      className="glass-effect rounded-2xl p-4 sm:p-6 shadow-soft border border-olive-200/50 dark:border-olive-800/50 hover:shadow-glow transition-all duration-300 hover:scale-[1.02] animate-slide-up"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="flex items-start justify-between gap-2 mb-4 pb-3 border-b border-olive-200/50 dark:border-olive-800/50">
        <div className="flex items-center gap-2 min-w-0">
          {household.title && (
            <>
              <span className="text-xl">🏠</span>
              <h3 className="text-lg font-bold text-olive-900 dark:text-olive-100 truncate">
                {household.title}
              </h3>
            </>
          )}
        </div>
        <Link
          href={`/tree/household/${household.id}/edit`}
          className="flex-shrink-0 px-2.5 py-1.5 text-xs font-medium text-olive-700 dark:text-olive-300 hover:bg-olive-100 dark:hover:bg-olive-800/50 rounded-lg transition-colors"
        >
          ✏️ تعديل
        </Link>
      </div>

      <div className="space-y-4">
        {husbands.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-olive-600 dark:text-olive-400 mb-2 uppercase tracking-wide">
              الزوج
            </p>
            <div className="space-y-1.5">
              {husbands.map((h) => (
                <div
                  key={h.id}
                  className="flex items-center gap-2 px-3 py-2 bg-olive-50 dark:bg-olive-900/30 rounded-lg"
                >
                  <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-white font-semibold text-sm">
                    {h.person.fullName.charAt(0)}
                  </div>
                  <span className="font-medium text-olive-900 dark:text-olive-100">{h.person.fullName}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {wives.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-olive-600 dark:text-olive-400 mb-2 uppercase tracking-wide">
              الزوجات
            </p>
            <div className="space-y-1.5">
              {wives.map((w) => (
                <div
                  key={w.id}
                  className="flex items-center gap-2 px-3 py-2 bg-burgundy-50 dark:bg-burgundy-900/20 rounded-lg"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-burgundy-400 to-burgundy-600 flex items-center justify-center text-white font-semibold text-sm">
                    {w.person.fullName.charAt(0)}
                  </div>
                  <span className="font-medium text-olive-900 dark:text-olive-100">{w.person.fullName}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {children.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-olive-600 dark:text-olive-400 mb-2 uppercase tracking-wide">
              الأطفال
            </p>
            <div className="flex items-center gap-2 px-3 py-2 bg-gold-100/80 dark:bg-gold-900/20 rounded-lg">
              <span className="text-2xl">👶</span>
              <span className="font-semibold text-olive-900 dark:text-olive-100">
                {children.length} {children.length === 1 ? 'طفل' : 'أطفال'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
