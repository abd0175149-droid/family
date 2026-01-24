'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

interface Member {
  id: string
  person: { id: string; fullName: string; gender: string }
  role: string
  isPrimarySpouse?: boolean
}

interface Family {
  id: string
  title?: string | null
  members: Member[]
  childLinks: { childHouseholdId: string; parentHouseholdId: string }[]
  parentLinks: { childHouseholdId: string; parentHouseholdId: string }[]
}

interface TreeData {
  families?: Family[]
  households?: Family[]
}

interface TreeNode {
  id: string
  data: Family
  children: TreeNode[]
}

function buildHierarchy(families: Family[]): TreeNode[] {
  const byId = new Map<string, Family>()
  families.forEach((f) => byId.set(f.id, f))
  const childrenMap = new Map<string, string[]>()
  for (const f of families) {
    for (const l of f.childLinks) {
      if (l.parentHouseholdId !== f.id) continue
      const list = childrenMap.get(f.id) ?? []
      list.push(l.childHouseholdId)
      childrenMap.set(f.id, list)
    }
  }
  const rootFamilies = families.filter((f) => (f.parentLinks?.length ?? 0) === 0)
  if (rootFamilies.length === 0 && families.length > 0) rootFamilies.push(families[0])

  function toNode(f: Family): TreeNode {
    const childIds = childrenMap.get(f.id) ?? []
    const children = childIds
      .map((id) => byId.get(id))
      .filter(Boolean) as Family[]
    return {
      id: f.id,
      data: f,
      children: children.map(toNode),
    }
  }
  return rootFamilies.map(toNode)
}

const NODE_WIDTH = 200
const NODE_HEIGHT = 100
const DX = 220
const DY = 160

export default function D3FamilyTree() {
  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [treeData, setTreeData] = useState<TreeData | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [dim, setDim] = useState({ w: 800, h: 500 })

  useEffect(() => {
    fetch('/api/tree', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        setTreeData(data)
        setError(null)
      })
      .catch(() => setError('تعذر تحميل الشجرة'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!treeData || !containerRef.current || !svgRef.current) return
    const families = treeData.families ?? treeData.households ?? []
    if (families.length === 0) return

    let cancelled = false
    import('d3').then((d3) => {
      if (cancelled || !svgRef.current) return
    const roots = buildHierarchy(families)
    if (roots.length === 0) return

    const virtualRoot: TreeNode = {
      id: '_root',
      data: {} as Family,
      children: roots,
    }
    const { w: width, h: height } = dim
    const treeLayout = d3.tree().nodeSize([DY, DX])
    const hierarchy = d3.hierarchy(virtualRoot as any, (d: TreeNode) => d.children)
    treeLayout(hierarchy as any)

    const nodes = hierarchy.descendants().filter((d: any) => d.data.id !== '_root')
    const links = hierarchy.links().filter((l: any) => (l.source as any).data.id !== '_root' && (l.target as any).data.id !== '_root')
    const minX = nodes.length ? Math.min(...nodes.map((d: any) => d.x)) : 0
    const maxX = nodes.length ? Math.max(...nodes.map((d: any) => d.x)) : 0
    const minY = nodes.length ? Math.min(...nodes.map((d: any) => d.y)) : 0
    const maxY = nodes.length ? Math.max(...nodes.map((d: any) => d.y)) : 0
    const pad = 40
    const viewW = Math.max(width, maxY - minY + pad * 2)
    const viewH = Math.max(height, maxX - minX + pad * 2)

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()
    svg.attr('viewBox', `0 0 ${viewW} ${viewH}`).attr('width', '100%')

    const gZoom = svg.append('g')
    const g = gZoom.append('g').attr('transform', `translate(${pad - minY},${pad - minX})`)

    const zoom = d3.zoom().scaleExtent([0.2, 3]).on('zoom', (ev: any) => {
      gZoom.attr('transform', ev.transform)
    })
    svg.call(zoom as any)

    const linkGen = d3.linkHorizontal().x((d: any) => d.y).y((d: any) => d.x)
    const linkGrp = g.append('g')
      .attr('fill', 'none')
      .attr('stroke', '#AA2B1D')
      .attr('stroke-opacity', 0.7)
      .attr('stroke-width', 2.5)
    linkGrp.selectAll('path')
      .data(links)
      .join('path')
      .attr('d', linkGen as any)
      .each(function () {
        d3.select(this).append('title').text('علاقة أبوية')
      })

    const node = g
      .append('g')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .attr('transform', (d: any) => `translate(${d.y},${d.x})`)
      .style('cursor', 'pointer')

    node
      .append('rect')
      .attr('width', NODE_WIDTH)
      .attr('height', NODE_HEIGHT)
      .attr('x', -NODE_WIDTH / 2)
      .attr('y', -NODE_HEIGHT / 2)
      .attr('rx', 10)
      .attr('fill', (d: any) => (d.data.id === selectedId ? '#F3CF7A' : '#fafafa'))
      .attr('stroke', (d: any) => (d.data.id === selectedId ? '#CC561E' : '#AA2B1D'))
      .attr('stroke-width', (d: any) => (d.data.id === selectedId ? 3 : 2))

    function lines(f: Family): string[] {
      const out: string[] = []
      if (f.title) out.push(f.title)
      const husbands = f.members.filter((m) => m.role === 'husband').map((m) => m.person.fullName)
      const wives = f.members.filter((m) => m.role === 'wife').map((m) => m.person.fullName)
      const children = f.members.filter((m) => m.role === 'child').map((m) => m.person.fullName)
      if (husbands.length) out.push('زوج: ' + husbands.join('، '))
      if (wives.length) out.push('زوجة: ' + wives.join('، '))
      if (children.length) {
        if (children.length <= 3) out.push('أطفال: ' + children.join('، '))
        else out.push(`أطفال: ${children.length} (${children.slice(0, 2).join('، ')}...)`)
      }
      if (!out.length) out.push('أسرة')
      return out
    }

    const lineHeight = 14
    node.each(function (d: any) {
      const f = d.data.data as Family
      const texts = lines(f)
      const gNode = d3.select(this)
      texts.forEach((t, i) => {
        const s = t.length > 28 ? t.slice(0, 26) + '…' : t
        gNode
          .append('text')
          .attr('text-anchor', 'middle')
          .attr('dy', -NODE_HEIGHT / 2 + 18 + i * lineHeight)
          .attr('font-size', i === 0 ? 11 : 10)
          .attr('font-weight', i === 0 ? 'bold' : 'normal')
          .attr('fill', i === 0 ? '#18181b' : '#52525b')
          .attr('x', 0)
          .text(s)
      })
    })

    node.append('title').text((d: any) => {
      const f = d.data.data as Family
      return lines(f).join('\n')
    })

    node.on('click', (_: any, d: any) => {
      setSelectedId(d.data.id)
    })
    }).catch((e) => {
      console.error('D3 load error:', e)
    })

    return () => {
      cancelled = true
    }
  }, [treeData, dim, selectedId])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      const w = el.clientWidth || 800
      const h = Math.max(400, el.clientHeight || 500)
      setDim({ w: Math.max(400, w), h })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin mx-auto" />
          <p className="text-gray-600 dark:text-gray-400 font-medium">جاري تحميل الشجرة...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-2xl glass-effect p-8 text-center border border-gray-200/50 dark:border-gray-800/50">
        <p className="text-primary-600 dark:text-primary-400 font-medium">{error}</p>
      </div>
    )
  }

  const families = treeData?.families ?? treeData?.households ?? []
  if (families.length === 0) {
    return (
      <div className="rounded-2xl glass-effect p-8 sm:p-12 text-center border border-gray-200/50 dark:border-gray-800/50">
        <div className="text-5xl mb-4">🌳</div>
        <p className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">لا توجد بيانات في الشجرة</p>
        <p className="text-gray-600 dark:text-gray-400">ابدأ بإضافة أسر جديدة</p>
      </div>
    )
  }

  const selected = selectedId ? families.find((f) => f.id === selectedId) : null

  return (
    <div className="space-y-4">
      <div
        ref={containerRef}
        className="w-full overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 shadow-soft"
        style={{ minHeight: 'min(500px, 60vh)' }}
      >
        <svg ref={svgRef} className="block w-full" style={{ minHeight: 400 }} />
      </div>
      {selected && (
        <div className="glass-effect rounded-2xl p-4 sm:p-6 border border-gray-200 dark:border-gray-800">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-50 mb-3">
                {selected.title || 'أسرة'} — العلاقات والأفراد
              </h3>
              <div className="space-y-2 text-sm">
                {selected.members.filter((m) => m.role === 'husband').length > 0 && (
                  <p className="text-gray-700 dark:text-gray-300">
                    <span className="font-semibold text-primary-600">الزوج:</span>{' '}
                    {selected.members.filter((m) => m.role === 'husband').map((m) => m.person.fullName).join('، ')}
                  </p>
                )}
                {selected.members.filter((m) => m.role === 'wife').length > 0 && (
                  <p className="text-gray-700 dark:text-gray-300">
                    <span className="font-semibold text-primary-600">الزوجات:</span>{' '}
                    {selected.members.filter((m) => m.role === 'wife').map((m) => m.person.fullName).join('، ')}
                  </p>
                )}
                {selected.members.filter((m) => m.role === 'child').length > 0 && (
                  <p className="text-gray-700 dark:text-gray-300">
                    <span className="font-semibold text-primary-600">الأطفال:</span>{' '}
                    {selected.members.filter((m) => m.role === 'child').map((m) => m.person.fullName).join('، ')}
                  </p>
                )}
                {selected.members.length === 0 && (
                  <p className="text-gray-500 dark:text-gray-400">لا يوجد أعضاء مسجّلون.</p>
                )}
              </div>
            </div>
            <Link
              href={`/tree/household/${selected.id}/edit`}
              className="inline-flex items-center gap-2 px-4 py-2 gradient-primary text-white rounded-xl font-medium hover:shadow-glow transition-all flex-shrink-0"
            >
              ✏️ تعديل الأسرة
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
