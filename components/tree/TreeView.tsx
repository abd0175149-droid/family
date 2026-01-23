'use client'

import { useEffect, useState } from 'react'

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

export default function TreeView() {
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
    return <div className="p-8 text-center">جاري تحميل الشجرة...</div>
  }

  if (!treeData || treeData.households.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-600 dark:text-gray-400">لا توجد بيانات في الشجرة</p>
      </div>
    )
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">الشجرة العائلية</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {treeData.households.map((household) => (
          <HouseholdNode key={household.id} household={household} />
        ))}
      </div>
    </div>
  )
}

function HouseholdNode({ household }: { household: Household }) {
  const husbands = household.members.filter((m) => m.role === 'husband')
  const wives = household.members.filter((m) => m.role === 'wife')
  const children = household.members.filter((m) => m.role === 'child')

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      {household.title && (
        <h3 className="font-semibold mb-2">{household.title}</h3>
      )}
      <div className="space-y-2">
        {husbands.length > 0 && (
          <div>
            <span className="text-sm text-gray-600 dark:text-gray-400">زوج:</span>
            {husbands.map((h) => (
              <div key={h.id} className="font-medium">{h.person.fullName}</div>
            ))}
          </div>
        )}
        {wives.length > 0 && (
          <div>
            <span className="text-sm text-gray-600 dark:text-gray-400">زوجات:</span>
            {wives.map((w) => (
              <div key={w.id} className="font-medium">{w.person.fullName}</div>
            ))}
          </div>
        )}
        {children.length > 0 && (
          <div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              أطفال: {children.length}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
