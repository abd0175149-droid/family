'use client'

import { useEffect, useState, useMemo } from 'react'

interface Household {
  id: string
  title?: string
  members: Array<{
    id: string
    person: {
      id: string
      fullName: string
      gender: string
      birthDate?: string
    }
    role: string
    isPrimarySpouse?: boolean
  }>
  childLinks: Array<{
    id: string
    childHouseholdId: string
    childHousehold?: {
      id: string
      title?: string
      members: Array<{
        person: {
          id: string
          fullName: string
          gender: string
        }
        role: string
      }>
    }
    linkViaPerson?: {
      id: string
      fullName: string
    }
  }>
  parentLinks: Array<{
    id: string
    parentHouseholdId: string
    parentHousehold?: {
      id: string
      title?: string
    }
    linkViaPerson?: {
      id: string
      fullName: string
    }
  }>
}

interface TreeData {
  households: Household[]
  relationships: any[]
}

interface Generation {
  level: number
  households: Household[]
}

export default function FamilyTreeView() {
  const [treeData, setTreeData] = useState<TreeData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedHousehold, setSelectedHousehold] = useState<string | null>(null)
  const [zoom, setZoom] = useState(100)

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

  // تنظيم الأسر حسب الأجيال
  const generations = useMemo(() => {
    if (!treeData || treeData.households.length === 0) return []

    const householdMap = new Map<string, Household>()
    treeData.households.forEach((h) => householdMap.set(h.id, h))

    // إيجاد الجذور (الأسر بدون آباء)
    const rootHouseholds = treeData.households.filter(
      (h) => h.parentLinks.length === 0
    )

    // إذا لم توجد جذور، استخدم جميع الأسر كجذور
    const roots = rootHouseholds.length > 0 ? rootHouseholds : treeData.households

    const generations: Generation[] = []
    const householdLevels = new Map<string, number>()
    const processed = new Set<string>()

    // حساب مستويات الأبناء مع حماية قوية من الحلقات
    const processChildren = (householdId: string, currentLevel: number, visitedInPath: Set<string>, maxDepth: number = 100) => {
      // حماية من الحلقات الدائرية
      if (visitedInPath.has(householdId)) {
        console.warn(`Circular reference detected for household: ${householdId}`)
        return
      }

      // حماية من العمق الزائد
      if (currentLevel > maxDepth) {
        console.warn(`Maximum depth exceeded for household: ${householdId} at level ${currentLevel}`)
        return
      }

      const household = householdMap.get(householdId)
      if (!household) return

      // إضافة للزيارة في هذا المسار
      const newVisitedPath = new Set(visitedInPath)
      newVisitedPath.add(householdId)

      // تحديث المستوى إذا كان أعلى (نأخذ أعلى مستوى للأسرة)
      const existingLevel = householdLevels.get(householdId) ?? -1
      if (currentLevel > existingLevel) {
        householdLevels.set(householdId, currentLevel)
      }

      // معالجة الأبناء - نزور كل الأبناء حتى لو تمت زيارتهم من قبل
      // لأن نفس الأسرة قد تكون في مستويات مختلفة عبر مسارات مختلفة
      household.childLinks.forEach((link) => {
        const childId = link.childHousehold?.id || link.childHouseholdId
        if (childId) {
          // نتحقق فقط من الحلقات الدائرية، وليس من الزيارة السابقة
          if (!newVisitedPath.has(childId)) {
            processChildren(childId, currentLevel + 1, newVisitedPath, maxDepth)
          } else {
            console.warn(`Skipping circular link: ${householdId} -> ${childId}`)
          }
        }
      })
    }

    // معالجة الجذور
    roots.forEach((root) => {
      if (!processed.has(root.id)) {
        processed.add(root.id)
        householdLevels.set(root.id, 0)
        processChildren(root.id, 0, new Set(), 100)
      }
    })

    // معالجة الأسر التي لم يتم زيارتها (أسر بدون روابط أو أسر معزولة)
    treeData.households.forEach((household) => {
      if (!householdLevels.has(household.id)) {
        // إذا لم يكن للأسرة أي روابط، ضعها في المستوى 0
        // إذا كان لها روابط لكن لم يتم زيارتها، قد تكون هناك مشكلة في البيانات
        if (household.childLinks.length === 0 && household.parentLinks.length === 0) {
          householdLevels.set(household.id, 0)
        } else {
          // أسرة لها روابط لكن لم يتم زيارتها - قد تكون في حلقة أو مشكلة في البيانات
          console.warn(`Unvisited household with links: ${household.id}`)
          householdLevels.set(household.id, 0) // ضعها في المستوى 0 كحل احتياطي
        }
      }
    })

    // تجميع الأسر حسب المستوى
    const maxLevel = Math.max(...Array.from(householdLevels.values()), 0)
    for (let i = 0; i <= maxLevel; i++) {
      const households = treeData.households.filter(
        (h) => householdLevels.get(h.id) === i
      )
      if (households.length > 0) {
        generations.push({ level: i, households })
      }
    }

    // إذا لم يتم العثور على أجيال، ضع جميع الأسر في جيل واحد
    if (generations.length === 0) {
      generations.push({ level: 0, households: treeData.households })
    }

    return generations
  }, [treeData])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-600 dark:text-slate-400 font-medium">جاري تحميل الشجرة...</p>
        </div>
      </div>
    )
  }

  if (!treeData || treeData.households.length === 0) {
    return (
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl p-12 text-center border border-slate-200/50 dark:border-slate-800/50">
        <div className="text-6xl mb-4">🌳</div>
        <p className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-2">لا توجد بيانات في الشجرة</p>
        <p className="text-slate-500 dark:text-slate-400">ابدأ بإضافة أسر جديدة</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Controls */}
      <div className="flex items-center justify-between gap-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-xl p-4 border border-slate-200/50 dark:border-slate-800/50">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setZoom(Math.max(50, zoom - 10))}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Zoom out"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
            </svg>
          </button>
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300 min-w-[60px] text-center">
            {zoom}%
          </span>
          <button
            onClick={() => setZoom(Math.min(200, zoom + 10))}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Zoom in"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
            </svg>
          </button>
          <button
            onClick={() => setZoom(100)}
            className="px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            إعادة تعيين
          </button>
        </div>
        <div className="text-sm text-slate-600 dark:text-slate-400">
          {generations.length} {generations.length === 1 ? 'جيل' : 'أجيال'} • {treeData.households.length} {treeData.households.length === 1 ? 'أسرة' : 'أسر'}
        </div>
      </div>

      {/* Tree Container */}
      <div className="relative bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-slate-950 dark:to-slate-900 rounded-2xl p-8 lg:p-12 overflow-auto border border-slate-200/50 dark:border-slate-800/50">
        <div
          className="relative min-h-[600px]"
          style={{
            transform: `scale(${zoom / 100})`,
            transformOrigin: 'top center',
          }}
        >
          {generations.map((generation, genIndex) => (
            <GenerationLevel
              key={generation.level}
              generation={generation}
              genIndex={genIndex}
              totalGenerations={generations.length}
              selectedHousehold={selectedHousehold}
              onSelectHousehold={setSelectedHousehold}
              treeData={treeData}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function GenerationLevel({
  generation,
  genIndex,
  totalGenerations,
  selectedHousehold,
  onSelectHousehold,
  treeData,
}: {
  generation: Generation
  genIndex: number
  totalGenerations: number
  selectedHousehold: string | null
  onSelectHousehold: (id: string | null) => void
  treeData: TreeData
}) {
  const isRoot = genIndex === 0
  const isLast = genIndex === totalGenerations - 1

  return (
    <div className="relative mb-16 last:mb-0">
      {/* Generation Label */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-500 to-accent-500 text-white rounded-full text-sm font-bold shadow-lg">
          <span>الجيل {generation.level + 1}</span>
          {isRoot && <span className="text-xs opacity-90">(الأجداد)</span>}
          {isLast && <span className="text-xs opacity-90">(الأحفاد)</span>}
        </div>
      </div>

      {/* Households Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 relative">
        {generation.households.map((household, index) => (
          <div key={household.id} className="relative">
            {/* Connection Lines */}
            {!isLast && household.childLinks.length > 0 && (
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0.5 h-8 bg-gradient-to-b from-primary-400 to-primary-200 dark:from-primary-600 dark:to-primary-800 z-0"></div>
            )}
            {!isRoot && household.parentLinks.length > 0 && (
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0.5 h-8 bg-gradient-to-b from-primary-200 to-primary-400 dark:from-primary-800 dark:to-primary-600 z-0"></div>
            )}

            {/* Household Card */}
            <HouseholdCard
              household={household}
              isSelected={selectedHousehold === household.id}
              onSelect={() => onSelectHousehold(household.id === selectedHousehold ? null : household.id)}
              treeData={treeData}
            />
          </div>
        ))}
      </div>

      {/* Horizontal Connection Lines Between Generations */}
      {!isLast && (
        <div className="absolute top-full left-0 right-0 h-8 flex items-center justify-center">
          <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-primary-300 dark:via-primary-700 to-transparent"></div>
        </div>
      )}
    </div>
  )
}

function HouseholdCard({
  household,
  isSelected,
  onSelect,
  treeData,
}: {
  household: Household
  isSelected: boolean
  onSelect: () => void
  treeData: TreeData
}) {
  const husbands = household.members.filter((m) => m.role === 'husband')
  const wives = household.members.filter((m) => m.role === 'wife')
  const children = household.members.filter((m) => m.role === 'child')

  // إيجاد الأسر المرتبطة
  const childHouseholds = household.childLinks.map((link) => {
    const childId = link.childHousehold?.id || link.childHouseholdId
    const childHousehold = treeData.households.find((h) => h.id === childId)
    return childHousehold
  }).filter(Boolean) as Household[]

  return (
    <div
      className={`relative bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl p-5 shadow-lg border-2 transition-all duration-300 cursor-pointer transform hover:scale-105 hover:shadow-glow z-10 ${
        isSelected
          ? 'border-primary-500 shadow-glow-lg ring-4 ring-primary-200 dark:ring-primary-900'
          : 'border-slate-200 dark:border-slate-800 hover:border-primary-300 dark:hover:border-primary-700'
      }`}
      onClick={onSelect}
    >
      {/* Household Title */}
      {household.title && (
        <div className="mb-3 pb-2 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 text-center">
            {household.title}
          </h3>
        </div>
      )}

      {/* Spouses */}
      <div className="space-y-2 mb-3">
        {husbands.map((h) => (
          <div
            key={h.id}
            className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-lg border border-blue-200 dark:border-blue-700"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-md flex-shrink-0">
              {h.person.fullName.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm truncate">
                {h.person.fullName}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">زوج</p>
            </div>
          </div>
        ))}

        {wives.map((w) => (
          <div
            key={w.id}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
              w.isPrimarySpouse
                ? 'bg-gradient-to-r from-pink-50 to-pink-100 dark:from-pink-900/30 dark:to-pink-800/30 border-pink-300 dark:border-pink-700'
                : 'bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 border-purple-300 dark:border-purple-700'
            }`}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md flex-shrink-0 ${
              w.isPrimarySpouse
                ? 'bg-gradient-to-br from-pink-400 to-pink-600'
                : 'bg-gradient-to-br from-purple-400 to-purple-600'
            }`}>
              {w.person.fullName.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm truncate">
                {w.person.fullName}
                {w.isPrimarySpouse && <span className="text-xs text-pink-600 dark:text-pink-400 mr-1">⭐</span>}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">زوجة</p>
            </div>
          </div>
        ))}
      </div>

      {/* Children Count */}
      {children.length > 0 && (
        <div className="flex items-center justify-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800 mb-2">
          <span className="text-xl">👶</span>
          <span className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
            {children.length} {children.length === 1 ? 'طفل' : 'أطفال'}
          </span>
        </div>
      )}

      {/* Connected Households Indicator */}
      {childHouseholds.length > 0 && (
        <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
          <p className="text-xs text-center text-slate-500 dark:text-slate-400">
            ↳ {childHouseholds.length} {childHouseholds.length === 1 ? 'أسرة مرتبطة' : 'أسر مرتبطة'}
          </p>
        </div>
      )}

      {/* Selection Indicator */}
      {isSelected && (
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center shadow-lg">
          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      )}
    </div>
  )
}
