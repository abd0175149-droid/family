/**
 * دوال توليد مسارات بيزيه للشجرة العضوية.
 * كل الروابط منحنيات فقط (لا خطوط مستقيمة، لا زوايا).
 */

import type { Point } from './types'

/** قوس زوجي أفقي: مقعّر للأسفل، بين نقطتين، لا يلامس الأسماء (نستخدم نقاط داخلية) */
export function marriageArc(
  left: Point,
  right: Point,
  /** عمق التقوّس (موجب = للأسفل) */
  sag: number
): string {
  const margin = 20
  const x1 = left.x + margin
  const x2 = right.x - margin
  const y = (left.y + right.y) / 2
  const cy = y + sag
  // Quadratic Bezier: P0 (x1,y) -> control (mid, cy) -> P1 (x2,y)
  const mx = (x1 + x2) / 2
  return `M ${x1} ${y} Q ${mx} ${cy} ${x2} ${y}`
}

/** نقطة منتصف القوس الزوجي (بداية الجذع) */
export function marriageArcCenter(left: Point, right: Point, sag: number): Point {
  const margin = 20
  const x1 = left.x + margin
  const x2 = right.x - margin
  const y = (left.y + right.y) / 2
  const mx = (x1 + x2) / 2
  const cy = y + sag
  // تقريب نقطة المنتصف على المنحنى الرباعي
  const t = 0.5
  const oneMinusT = 1 - t
  const x = oneMinusT * oneMinusT * x1 + 2 * oneMinusT * t * mx + t * t * x2
  const yMid = oneMinusT * oneMinusT * y + 2 * oneMinusT * t * cy + t * t * y
  return { x, y: yMid }
}

/**
 * جذع: من نقطة (منتصف القوس) نزولاً ثم اتساع حتى أسفل القوس المتفرّع.
 * منحنى بيزيه رباعي واحد متصل.
 */
export function trunk(
  from: Point,
  /** عرض القوس المتفرّع، ومركزه الأفقي */
  branchCenterX: number,
  branchTopY: number
): string {
  const dx = Math.abs(branchCenterX - from.x)
  const extend = Math.max(dx * 0.6, 30)
  const c1 = { x: from.x - extend, y: from.y + (branchTopY - from.y) * 0.4 }
  const c2 = { x: branchCenterX + extend, y: branchTopY - (branchTopY - from.y) * 0.3 }
  return `M ${from.x} ${from.y} C ${c1.x} ${c1.y} ${c2.x} ${c2.y} ${branchCenterX} ${branchTopY}`
}

/**
 * قوس متفرّع: U مقلوب مفتوح. من يسار إلى يمين عبر الأسفل.
 * يُرسم كمسار واحد: leftAttach → أسفل الوسط → rightAttach.
 */
export function branchArc(
  top: Point,
  leftX: number,
  rightX: number,
  /** ارتفاع نهاية القوس (مستوى مرفقات الأبناء) */
  bottomY: number,
  depth: number
): string {
  const midX = (leftX + rightX) / 2
  const kneeY = top.y + depth * 0.6
  const c1 = { x: leftX - 20, y: (bottomY + kneeY) / 2 }
  const c2 = { x: midX - 30, y: kneeY }
  const c3 = { x: midX + 30, y: kneeY }
  const c4 = { x: rightX + 20, y: (bottomY + kneeY) / 2 }
  return `M ${leftX} ${bottomY} C ${c1.x} ${c1.y} ${c2.x} ${c2.y} ${midX} ${top.y} C ${c3.x} ${c3.y} ${c4.x} ${c4.y} ${rightX} ${bottomY}`
}

/** غصن ابن: من نقطة على القوس إلى موقع الاسم. منحنى قصير ينحني قليلاً للأعلى، يتوقف قبل الاسم. */
export function childBranch(from: Point, to: Point, margin: number = 12): string {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const dist = Math.sqrt(dx * dx + dy * dy) || 1
  const stop = Math.max(0, dist - margin)
  const t = stop / dist
  const end: Point = { x: from.x + dx * t, y: from.y + dy * t }
  const c1 = { x: (from.x + end.x) / 2 + 15, y: (from.y + end.y) / 2 - 10 }
  return `M ${from.x} ${from.y} Q ${c1.x} ${c1.y} ${end.x} ${end.y}`
}

/** قوس زوجي قصير (للابن المتزوج): بين نقطتين أفقيّاً، أخف. */
export function marriageArcShort(
  left: Point,
  right: Point,
  sag: number
): string {
  const margin = 12
  const x1 = left.x + margin
  const x2 = right.x - margin
  const y = (left.y + right.y) / 2
  const mx = (x1 + x2) / 2
  const cy = y + sag * 0.6
  return `M ${x1} ${y} Q ${mx} ${cy} ${x2} ${y}`
}
