'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import * as d3 from 'd3'

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

// ——— مواصفات الشجرة العضوية (الوصف النهائي الدقيق) ———
// • لا خطوط مستقيمة ولا زوايا قائمة — منحنيات ناعمة فقط (قوس زواج + CatmullRom للأغصان).
// • الزوج يمين، الزوجة يسار، نفس المستوى الأفقي؛ قوس أفقي مقعّر للأسفل (رابطة زواج)، لا يلامس الأسماء.
// • الخروج إلى الأبناء من منتصف القوس؛ منحنى نازل ثم تفرع سلس؛ غصن ينحني قليلاً للأعلى، ينتهي قبل الاسم.
// • كل جيل أدنى = خطوط أنحف. التوازن وتجنب التقاطع عبر d3.tree.
// • كل اسم داخل تشبّس (chip) بحيز ثابت — منع تداخل الأسماء.
const NAME_GAP = 58           // نصف المسافة بين مركزي التشبّسين (ذكر يمين، أنثى يسار)
const ARC_DEPTH = 14          // عمق القوس الزوجي (مقعّر للأسفل)
const ARC_CLEAR = 8           // بداية/نهاية القوس لا تلامس التشبّسات
const BRANCH_END_GAP = 24     // نهاية الغصن قبل التشبّس (مسافة بيضاء)
const DROP = 70               // هبوط المنحنى قبل التفرع
const STROKE_MARRIAGE = 2.2   // سماكة القوس الزوجي
const STROKE_BRANCH = 2       // سماكة الأغصان (أخف مع العمق)
const FONT_NAME = 11
const FONT_TITLE = 10
const CHIP_WIDTH = 74         // عرض ثابت لكل تشبّس — حيز محدد
const CHIP_HEIGHT = 22        // ارتفاع التشبّس
const CHIP_RX = 10            // تقويس زوايا التشبّس
const CHIP_PAD = 6            // padding أفقي داخل التشبّس
const MAX_CHIP_CHARS = 9      // أقصى حروف قبل القص بـ …

/** قوس زوجي أفقي مقعّر للأسفل — من اليمين (ذكر) إلى اليسار (أنثى). لا يلامس التشبّسات. */
function marriageArcPath(cx: number, cy: number, halfGap: number, arcDepth: number, clear: number): string {
  const right = cx + halfGap - clear
  const left = cx - halfGap + clear
  const cpY = cy + arcDepth
  return `M ${right} ${cy} Q ${cx} ${cpY} ${left} ${cy}`
}

/** قص النص ووضع … عند تجاوز الطول. */
function clipForChip(s: string, max: number): string {
  if (!s) return ''
  return s.length > max ? s.slice(0, max - 1) + '…' : s
}

/** منحنى غصن عضوي: من منتصف القوس نزولاً ثم تفرع سلس، ينحني قليلاً للأعلى عند النهاية. لا خطوط مستقيمة. */
function organicBranchPath(
  px: number, py: number,
  cx: number, cy: number,
  endGap: number,
  drop: number
): string {
  const ey = cy - endGap
  const dx = cx - px
  const pts: [number, number][] = [
    [px, py],
    [px + dx * 0.08, py + drop * 0.35],
    [cx - dx * 0.08, ey + drop * 0.5],
    [cx, ey],
  ]
  const line = d3.line().curve(d3.curveCatmullRom.alpha(0.6))
  return line(pts) ?? `M ${px} ${py} C ${px} ${py + drop}, ${cx} ${ey + drop}, ${cx} ${ey}`
}

export default function D3FamilyTree() {
  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [treeData, setTreeData] = useState<TreeData | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)

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

    const roots = buildHierarchy(families)
    if (roots.length === 0) return

    const virtualRoot: TreeNode = {
      id: '_root',
      data: {} as Family,
      children: roots,
    }

    const treeW = 920
    const treeH = 600
    const treeLayout = d3
      .tree<TreeNode>()
      .size([treeW, treeH])
      .separation((a: any, b: any) => (a.parent === b.parent ? 1.15 : 1.05))
    const hierarchy = d3.hierarchy(virtualRoot, (d) => d.children)
    treeLayout(hierarchy as any)

    const nodes = hierarchy.descendants().filter((d: any) => d.data.id !== '_root')
    const links = hierarchy.links().filter(
      (l: any) => (l.source as any).data.id !== '_root' && (l.target as any).data.id !== '_root'
    )

    const minX = nodes.length ? Math.min(...nodes.map((d: any) => d.x)) : 0
    const maxX = nodes.length ? Math.max(...nodes.map((d: any) => d.x)) : 0
    const minY = nodes.length ? Math.min(...nodes.map((d: any) => d.y)) : 0
    const maxY = nodes.length ? Math.max(...nodes.map((d: any) => d.y)) : 0
    const pad = 56
    const viewW = Math.max(800, maxY - minY + pad * 2)
    const viewH = Math.max(520, maxX - minX + pad * 2)

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()
    svg.attr('viewBox', `0 0 ${viewW} ${viewH}`).attr('width', '100%').attr('height', '100%')

    const gZoom = svg.append('g')
    const g = gZoom.append('g').attr('transform', `translate(${pad - minY},${pad - minX})`)

    const zoom = d3.zoom<SVGSVGElement, unknown>().scaleExtent([0.2, 2.8]).on('zoom', (ev) => {
      gZoom.attr('transform', ev.transform as any)
    })
    svg.call(zoom as any)

    // ——— 1) أغصان العلاقات (منحنيات ناعمة فقط، لا خطوط مستقيمة) ———
    const linkGrp = g.append('g').attr('fill', 'none')
    linkGrp
      .selectAll('path')
      .data(links)
      .join('path')
      .attr('stroke', '#8a7356')
      .attr('stroke-opacity', 0.85)
      .attr('stroke-width', (l: any) => {
        const depth = (l.target as any).depth ?? 0
        return Math.max(1.2, STROKE_BRANCH - depth * 0.15)
      })
      .attr('stroke-linecap', 'round')
      .attr('stroke-linejoin', 'round')
      .attr('d', (l: any) => {
        const src = l.source as any
        const tgt = l.target as any
        const px = src.y
        const py = src.x
        const cx = tgt.y
        const cy = tgt.x
        return organicBranchPath(px, py, cx, cy, BRANCH_END_GAP, DROP)
      })
      .each(function () {
        d3.select(this).append('title').text('علاقة نسب')
      })

    // ——— 2) العُقد: زوج (يمين) + زوجة (يسار) + قوس زوجي ———
    const nodeGrp = g.append('g').selectAll('g').data(nodes).join('g').style('cursor', 'pointer')

    nodeGrp.each(function (d: any) {
      const f = d.data.data as Family
      const cx = d.y
      const cy = d.x
      const husbands = f.members.filter((m) => m.role === 'husband').map((m) => m.person.fullName)
      const wives = f.members.filter((m) => m.role === 'wife').map((m) => m.person.fullName)
      const husband = husbands[0] ?? ''
      const wife = wives[0] ?? ''
      const gNode = d3.select(this)

      // قوس زواج: أفقي، مقعّر للأسفل، لا يلامس الأسماء
      gNode
        .append('path')
        .attr('d', marriageArcPath(cx, cy, NAME_GAP, ARC_DEPTH, ARC_CLEAR))
        .attr('fill', 'none')
        .attr('stroke', (d: any) => (d.data.id === selectedId ? '#CC561E' : '#AA2B1D'))
        .attr('stroke-width', STROKE_MARRIAGE)
        .attr('stroke-opacity', 0.9)
        .attr('stroke-linecap', 'round')
        .each(function () {
          d3.select(this).append('title').text('رابطة زواج / أسرة')
        })

      // تشبّسات بأحجام ثابتة — حماية من التداخل. الذكر يمين، الأنثى يسار.
      const sel = (d: any) => d.data.id === selectedId
      const chipFill = (d: any) => (sel(d) ? '#fef3e2' : '#f5f0eb')
      const chipStroke = (d: any) => (sel(d) ? '#CC561E' : '#AA2B1D')
      const chipStrokeOpacity = (d: any) => (sel(d) ? 1 : 0.6)
      const textFill = (d: any) => (sel(d) ? '#1a1a1a' : '#2d2d2d')

      if (husband) {
        const chip = gNode.append('g').attr('class', 'name-chip').attr('data-role', 'husband')
        chip
          .append('rect')
          .attr('x', cx + NAME_GAP)
          .attr('y', cy - CHIP_HEIGHT / 2)
          .attr('width', CHIP_WIDTH)
          .attr('height', CHIP_HEIGHT)
          .attr('rx', CHIP_RX)
          .attr('fill', chipFill as any)
          .attr('stroke', chipStroke as any)
          .attr('stroke-width', 1.2)
          .attr('stroke-opacity', chipStrokeOpacity as any)
        chip
          .append('text')
          .attr('x', cx + NAME_GAP + CHIP_PAD)
          .attr('y', cy)
          .attr('text-anchor', 'start')
          .attr('dominant-baseline', 'central')
          .attr('font-size', FONT_NAME)
          .attr('font-weight', '600')
          .attr('fill', textFill as any)
          .text(clipForChip(husband, MAX_CHIP_CHARS))
      }
      if (wife) {
        const chip = gNode.append('g').attr('class', 'name-chip').attr('data-role', 'wife')
        chip
          .append('rect')
          .attr('x', cx - NAME_GAP - CHIP_WIDTH)
          .attr('y', cy - CHIP_HEIGHT / 2)
          .attr('width', CHIP_WIDTH)
          .attr('height', CHIP_HEIGHT)
          .attr('rx', CHIP_RX)
          .attr('fill', chipFill as any)
          .attr('stroke', chipStroke as any)
          .attr('stroke-width', 1.2)
          .attr('stroke-opacity', chipStrokeOpacity as any)
        chip
          .append('text')
          .attr('x', cx - NAME_GAP - CHIP_WIDTH + CHIP_WIDTH - CHIP_PAD)
          .attr('y', cy)
          .attr('text-anchor', 'end')
          .attr('dominant-baseline', 'central')
          .attr('font-size', FONT_NAME)
          .attr('font-weight', '600')
          .attr('fill', textFill as any)
          .text(clipForChip(wife, MAX_CHIP_CHARS))
      }

      // عنوان اختياري صغير تحت منتصف القوس (تشبّس صغير أيضاً)
      if (f.title && (husband || wife)) {
        const t = clipForChip(f.title, 10)
        const tw = Math.min(t.length * 6.5, 56)
        const th = 16
        const titleChip = gNode.append('g').attr('class', 'title-chip')
        titleChip
          .append('rect')
          .attr('x', cx - tw / 2)
          .attr('y', cy + ARC_DEPTH + 6)
          .attr('width', tw)
          .attr('height', th)
          .attr('rx', 6)
          .attr('fill', 'rgba(0,0,0,0.04)')
          .attr('stroke', 'rgba(0,0,0,0.08)')
          .attr('stroke-width', 1)
        titleChip
          .append('text')
          .attr('x', cx)
          .attr('y', cy + ARC_DEPTH + 6 + th / 2)
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'central')
          .attr('font-size', FONT_TITLE)
          .attr('fill', '#6b6b6b')
          .text(t)
      }
    })

    nodeGrp.on('click', (_: any, d: any) => setSelectedId(d.data.id))

    // تلميح عند التمرير على العقدة: الزوج، الزوجة، أطفال
    nodeGrp.each(function (d: any) {
      const f = (d as any).data.data as Family
      const parts: string[] = []
      const h = f.members.filter((m) => m.role === 'husband').map((m) => m.person.fullName)
      const w = f.members.filter((m) => m.role === 'wife').map((m) => m.person.fullName)
      const c = f.members.filter((m) => m.role === 'child').map((m) => m.person.fullName)
      if (h.length) parts.push('زوج: ' + h.join('، '))
      if (w.length) parts.push('زوجة: ' + w.join('، '))
      if (c.length) parts.push('أطفال: ' + c.join('، '))
      if (parts.length) d3.select(this).append('title').text(parts.join('\n'))
    })
  }, [treeData, selectedId])

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
      <div className="rounded-2xl bg-white dark:bg-gray-800 p-8 text-center border border-gray-200 dark:border-gray-700">
        <p className="text-primary-600 dark:text-primary-300 font-medium">{error}</p>
      </div>
    )
  }

  const families = treeData?.families ?? treeData?.households ?? []
  if (families.length === 0) {
    return (
      <div className="rounded-2xl bg-white dark:bg-gray-800 p-8 sm:p-12 text-center border border-gray-200 dark:border-gray-700">
        <div className="text-5xl mb-4">🌳</div>
        <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">لا توجد بيانات في الشجرة</p>
        <p className="text-gray-600 dark:text-gray-300">ابدأ بإضافة أسر جديدة</p>
      </div>
    )
  }

  const selected = selectedId ? families.find((f) => f.id === selectedId) : null

  return (
    <div className="space-y-4">
      <div
        ref={containerRef}
        className="w-full overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-[#faf8f5] dark:bg-gray-900 shadow-soft"
        style={{ height: 'min(68vh, 720px)', minHeight: 520 }}
      >
        <svg ref={svgRef} className="block w-full h-full" style={{ minHeight: 520 }} />
      </div>
      {selected && (
        <div className="rounded-2xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3">
                {selected.title || 'أسرة'} — العلاقات والأفراد
              </h3>
              <div className="space-y-2 text-sm">
                {selected.members.filter((m) => m.role === 'husband').length > 0 && (
                  <p className="text-gray-800 dark:text-gray-200">
                    <span className="font-semibold text-primary-600">الزوج:</span>{' '}
                    {selected.members.filter((m) => m.role === 'husband').map((m) => m.person.fullName).join('، ')}
                  </p>
                )}
                {selected.members.filter((m) => m.role === 'wife').length > 0 && (
                  <p className="text-gray-800 dark:text-gray-200">
                    <span className="font-semibold text-primary-600">الزوجات:</span>{' '}
                    {selected.members.filter((m) => m.role === 'wife').map((m) => m.person.fullName).join('، ')}
                  </p>
                )}
                {selected.members.filter((m) => m.role === 'child').length > 0 && (
                  <p className="text-gray-800 dark:text-gray-200">
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
