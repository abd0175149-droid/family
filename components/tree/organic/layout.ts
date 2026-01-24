/**
 * تخطيط الشجرة العضوية: مراحل 1–3 (عرض، توازن، إسناد x,y).
 */

import type {
  OrganicNode,
  LayoutConfig,
  LayoutResult,
  LabelPlacement,
  PathSpec,
  Point,
} from './types'
import { DEFAULT_LAYOUT_CONFIG } from './types'
import {
  marriageArc,
  marriageArcCenter,
  trunk,
  branchArc,
  childBranch,
  marriageArcShort,
} from './curves'

const SAG = 14
const COUPLE_SAG_SHORT = 8

interface LayoutContext {
  config: LayoutConfig
  labels: LabelPlacement[]
  paths: PathSpec[]
  gen: number
  scale: number
  stroke: number
}

function scaleConfig(c: LayoutConfig, scale: number) {
  return {
    ...c,
    coupleGap: c.coupleGap * scale,
    trunkHeight: c.trunkHeight * scale,
    siblingGap: c.siblingGap * scale,
    generationGap: c.generationGap * scale,
    branchArcDepth: c.branchArcDepth * scale,
  }
}

function addLabel(
  ctx: LayoutContext,
  id: string,
  x: number,
  y: number,
  text: string,
  kind: LabelPlacement['kind']
) {
  ctx.labels.push({ id, x, y, text, kind, generation: ctx.gen })
}

function addPath(ctx: LayoutContext, id: string, d: string, kind: PathSpec['kind']) {
  ctx.paths.push({
    id,
    d,
    kind,
    generation: ctx.gen,
    strokeWidth: ctx.stroke,
  })
}

/** عرض العقدة (للتوازن). للأبناء: عرض كل ابن أو ضبطه. */
function nodeWidth(node: OrganicNode, config: LayoutConfig, scale: number): number {
  const c = scaleConfig(config, scale)
  if (node.type === 'single') return c.siblingGap
  const childTotal = node.children.reduce(
    (sum, ch) => sum + nodeWidth(ch, config, scale * config.generationScale),
    0
  )
  const gaps = Math.max(0, node.children.length - 1) * c.siblingGap
  const w = childTotal + gaps
  return Math.max(w, c.coupleGap + 80)
}

/** تخطيط عقدة واحدة (زوجان أو فرد). يُرجع العرض المستخدم و y التالي. */
function layoutNode(
  node: OrganicNode,
  xBase: number,
  yBase: number,
  width: number,
  ctx: LayoutContext,
  nested = false
): number {
  const c = scaleConfig(ctx.config, ctx.scale)
  let nextY = yBase

  if (node.type === 'single') {
    addLabel(ctx, `single-${node.personId ?? node.familyId ?? 'x'}`, xBase, yBase, node.husband?.fullName ?? node.wife?.fullName ?? '—', 'child')
    return yBase + c.generationGap * 0.5
  }

  const husband = node.husband
  const wife = node.wife
  const midX = xBase + width / 2
  const gap = (nested ? 40 : c.coupleGap / 2) * ctx.scale
  const wifeX = midX - gap
  const husbandX = midX + gap

  const wifeP: Point = { x: wifeX, y: yBase }
  const husbandP: Point = { x: husbandX, y: yBase }

  if (husband) addLabel(ctx, `h-${husband.id}`, husbandP.x, husbandP.y, husband.fullName, 'husband')
  if (wife) addLabel(ctx, `w-${wife.id}`, wifeP.x, wifeP.y, wife.fullName, 'wife')

  const left = wife ? wifeP : husbandP
  const right = husband ? husbandP : wifeP
  const arcD = nested
    ? marriageArcShort(left, right, COUPLE_SAG_SHORT)
    : marriageArc(left, right, SAG)
  addPath(ctx, `marriage-${node.familyId ?? 'root'}`, arcD, 'marriage-arc')

  const center = nested
    ? { x: midX, y: yBase + COUPLE_SAG_SHORT * 0.5 }
    : marriageArcCenter(left, right, SAG)
  const trunkH = nested ? c.trunkHeight * 0.6 : c.trunkHeight
  nextY = yBase + trunkH
  const branchTop: Point = { x: midX, y: nextY }
  const branchDepth = c.branchArcDepth * (nested ? 0.7 : 1)
  const bottomY = nextY + branchDepth

  if (node.children.length === 0) {
    return nextY + c.generationGap * 0.5
  }

  const childWidths = node.children.map((ch) =>
    nodeWidth(ch, ctx.config, ctx.scale * ctx.config.generationScale)
  )
  const totalChild = childWidths.reduce((a, b) => a + b, 0)
  const totalGaps = (node.children.length - 1) * c.siblingGap
  const minSpan = node.children.length === 1 ? c.coupleGap * 0.8 : 0
  const span = Math.max(totalChild + totalGaps, minSpan)
  let offset = xBase + (width - span) / 2

  const childPositions: Point[] = []
  for (let i = 0; i < node.children.length; i++) {
    const w = childWidths[i]
    const cx = offset + w / 2
    childPositions.push({ x: cx, y: bottomY })
    offset += w + c.siblingGap
  }

  const leftX = childPositions[0].x
  const rightX = childPositions[childPositions.length - 1].x
  const trunkD = trunk(center, midX, branchTop.y)
  addPath(ctx, `trunk-${node.familyId ?? 'root'}`, trunkD, 'trunk')

  const branchD = branchArc(branchTop, leftX, rightX, bottomY, branchDepth)
  addPath(ctx, `branch-${node.familyId ?? 'root'}`, branchD, 'branch-arc')

  const childCtx: LayoutContext = {
    ...ctx,
    gen: ctx.gen + 1,
    scale: ctx.scale * ctx.config.generationScale,
    stroke: ctx.stroke * ctx.config.strokeScale,
  }

  const childBaseY = bottomY + c.generationGap
  let maxChildY = childBaseY

  for (let i = 0; i < node.children.length; i++) {
    const ch = node.children[i]
    const cw = childWidths[i]
    const cx = childPositions[i].x
    const attach: Point = { x: cx, y: bottomY }

    if (ch.type === 'single') {
      const name = ch.husband?.fullName ?? ch.wife?.fullName ?? '—'
      const labelY = childBaseY
      addLabel(childCtx, `ch-${ch.personId ?? i}`, cx, labelY, name, 'child')
      const branchPath = childBranch(attach, { x: cx, y: labelY }, c.branchLabelMargin)
      addPath(childCtx, `child-branch-${ch.personId ?? i}`, branchPath, 'child-branch')
      maxChildY = Math.max(maxChildY, labelY + c.generationGap * 0.5)
    } else {
      const subW = nodeWidth(ch, ctx.config, childCtx.scale)
      const subX = cx - subW / 2
      const subMid = subX + subW / 2
      const labelY = childBaseY
      const childBranchD = childBranch(attach, { x: subMid, y: labelY }, c.branchLabelMargin)
      addPath(childCtx, `child-branch-${ch.personId ?? ch.familyId ?? i}`, childBranchD, 'child-branch')
      const subY = layoutNode(ch, subX, labelY, subW, childCtx, true)
      maxChildY = Math.max(maxChildY, subY)
    }
  }

  return maxChildY + c.generationGap * 0.3
}

/** حساب صندوق المحيط من المواضع والمسارات. */
function bounds(
  labels: LabelPlacement[],
  _paths: PathSpec[],
  padding: number
): { width: number; height: number; minX: number; minY: number } {
  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity
  for (const l of labels) {
    minX = Math.min(minX, l.x)
    maxX = Math.max(maxX, l.x)
    minY = Math.min(minY, l.y)
    maxY = Math.max(maxY, l.y)
  }
  if (labels.length === 0) {
    minX = maxX = minY = maxY = 0
  }
  const w = Math.max(maxX - minX + padding * 2, 400)
  const h = Math.max(maxY - minY + padding * 2, 300)
  return {
    width: w,
    height: h,
    minX: minX - padding,
    minY: minY - padding,
  }
}

/**
 * يشغّل التخطيط ويعيد النتيجة.
 */
export function runLayout(
  roots: OrganicNode[],
  config: Partial<LayoutConfig> = {}
): LayoutResult {
  const cfg = { ...DEFAULT_LAYOUT_CONFIG, ...config }
  const ctx: LayoutContext = {
    config: cfg,
    labels: [],
    paths: [],
    gen: 0,
    scale: 1,
    stroke: cfg.baseStrokeWidth,
  }

  if (roots.length === 0) {
    return { labels: [], paths: [], width: 400, height: 300, minX: 0, minY: 0 }
  }

  const root = roots[0]
  const w = nodeWidth(root, cfg, 1)
  const padding = 60
  const y = padding
  layoutNode(root, padding, y, w + padding * 2, ctx)

  const { width: bW, height: bH, minX: bMinX, minY: bMinY } = bounds(ctx.labels, ctx.paths, padding)
  return {
    labels: ctx.labels,
    paths: ctx.paths,
    width: bW,
    height: bH,
    minX: bMinX,
    minY: bMinY,
  }
}
