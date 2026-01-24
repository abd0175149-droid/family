'use client'

import { useEffect, useState, useMemo } from 'react'
import type { OrganicNode, LayoutResult } from './types'
import { runLayout } from './layout'

interface Person {
  id: string
  fullName: string
  gender?: string
  primaryFamilyId?: string
}

interface FamilyMember {
  id: string
  person: Person
  role: string
  isPrimarySpouse?: boolean
}

interface Family {
  id: string
  title?: string
  members: FamilyMember[]
  childLinks: { childHouseholdId: string; parentHouseholdId: string }[]
  parentLinks: { childHouseholdId: string; parentHouseholdId: string }[]
}

interface TreeData {
  families?: Family[]
  households?: Family[]
}

function toPerson(p: Person): { id: string; fullName: string } {
  return { id: p.id, fullName: p.fullName }
}

function mapToOrganicNodes(treeData: TreeData): OrganicNode[] {
  const families = treeData.families ?? treeData.households ?? []
  const byId = new Map<string, Family>()
  families.forEach((f) => byId.set(f.id, f))

  const nodeByFamily = new Map<string, OrganicNode>()

  for (const f of families) {
    const husbands = f.members.filter((m) => m.role === 'husband')
    const wives = f.members.filter((m) => m.role === 'wife')
    const children = f.members.filter((m) => m.role === 'child')
    const husband = husbands[0]?.person
    const wife = wives.find((w) => w.isPrimarySpouse)?.person ?? wives[0]?.person

    const node: OrganicNode = {
      type: 'couple',
      husband: husband ? toPerson(husband) : undefined,
      wife: wife ? toPerson(wife) : undefined,
      children: [],
      familyId: f.id,
    }
    nodeByFamily.set(f.id, node)
  }

  for (const f of families) {
    const node = nodeByFamily.get(f.id)!
    const children = f.members.filter((m) => m.role === 'child')
    for (const ch of children) {
      const pid = ch.person.id
      const pfid = ch.person.primaryFamilyId
      if (pfid && pfid !== f.id && byId.has(pfid)) {
        const childNode = nodeByFamily.get(pfid)!
        node.children.push(childNode)
      } else {
        const single: OrganicNode = {
          type: 'single',
          personId: pid,
          children: [],
        }
        if (ch.person.gender === 'male') single.husband = toPerson(ch.person)
        else single.wife = toPerson(ch.person)
        node.children.push(single)
      }
    }
  }

  const roots = families.filter((f) => (f.parentLinks?.length ?? 0) === 0)
  if (roots.length === 0 && families.length > 0) {
    const first = families[0]
    return [nodeByFamily.get(first.id)!].filter(Boolean)
  }
  return roots.map((r) => nodeByFamily.get(r.id)!).filter(Boolean)
}

function OrganicSVG({ result }: { result: LayoutResult }) {
  const { labels, paths, width, height, minX, minY } = result

  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`${minX} ${minY} ${width} ${height}`}
      className="min-h-[600px] w-full"
      preserveAspectRatio="xMidYMin meet"
    >
      <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        {paths.map((p) => (
          <path
            key={p.id}
            d={p.d}
            strokeWidth={p.strokeWidth}
            className="text-slate-600 dark:text-slate-400"
          />
        ))}
      </g>
      <g className="fill-slate-900 dark:fill-slate-100" style={{ fontFamily: 'var(--font-arabic), system-ui' }}>
        {labels.map((l) => (
          <text
            key={l.id}
            x={l.x}
            y={l.y}
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-sm font-medium"
            style={{ fontSize: l.generation > 0 ? '0.85em' : '1em' }}
          >
            {l.text}
          </text>
        ))}
      </g>
    </svg>
  )
}

export default function OrganicTree() {
  const [treeData, setTreeData] = useState<TreeData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/tree')
      .then((r) => r.json())
      .then((data) => {
        setTreeData(data)
        setLoading(false)
      })
      .catch((e) => {
        console.error('Error fetching tree:', e)
        setLoading(false)
      })
  }, [])

  const layoutResult = useMemo(() => {
    if (!treeData) return null
    const roots = mapToOrganicNodes(treeData)
    if (roots.length === 0) return null
    return runLayout(roots)
  }, [treeData])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-2 border-slate-300 dark:border-slate-600 border-t-slate-900 dark:border-t-slate-100 rounded-full animate-spin mx-auto" />
          <p className="text-slate-600 dark:text-slate-400 font-medium">جاري تحميل الشجرة...</p>
        </div>
      </div>
    )
  }

  const families = treeData?.families ?? treeData?.households ?? []
  if (!treeData || families.length === 0) {
    return (
      <div className="elegant-border rounded-lg bg-white dark:bg-slate-900 p-12 text-center elegant-shadow">
        <div className="text-5xl mb-4">🌳</div>
        <p className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">لا توجد بيانات في الشجرة</p>
        <p className="text-slate-500 dark:text-slate-400">ابدأ بإضافة أسر جديدة</p>
      </div>
    )
  }

  if (!layoutResult) {
    return (
      <div className="elegant-border rounded-lg bg-white dark:bg-slate-900 p-12 text-center elegant-shadow">
        <p className="text-slate-600 dark:text-slate-400">لا يمكن بناء الشجرة من البيانات الحالية.</p>
      </div>
    )
  }

  return (
    <div
      className="w-full overflow-auto rounded-xl elegant-border bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 elegant-shadow"
      style={{ minHeight: '900px' }}
    >
      <OrganicSVG result={layoutResult} />
    </div>
  )
}
