/**
 * نموذج البيانات الداخلي للشجرة العضوية.
 * يُستخدم في التخطيط والرسم بعد تحويل families/childLinks من الـ API.
 */

export interface OrganicPerson {
  id: string
  fullName: string
}

export interface OrganicNode {
  type: 'couple' | 'single'
  husband?: OrganicPerson
  wife?: OrganicPerson
  children: OrganicNode[]
  /** أسرة فرعية إن وُجدت (الابن متزوج) */
  childFamilyId?: string
  familyId?: string
  personId?: string
}

/** نقطة 2D في التخطيط */
export interface Point {
  x: number
  y: number
}

/** موضع اسم في التخطيط */
export interface LabelPlacement {
  id: string
  x: number
  y: number
  text: string
  /** ذكر = يمين، أنثى = يسار، ابن... */
  kind: 'husband' | 'wife' | 'child' | 'spouse'
  generation: number
}

/** مواصفات مسار منحنى للرسم */
export interface PathSpec {
  id: string
  d: string
  kind: 'marriage-arc' | 'trunk' | 'branch-arc' | 'child-branch'
  generation: number
  strokeWidth: number
}

/** نتيجة التخطيط: عناصر للرسم */
export interface LayoutResult {
  labels: LabelPlacement[]
  paths: PathSpec[]
  width: number
  height: number
  minX: number
  minY: number
}

/** إعدادات التخطيط */
export interface LayoutConfig {
  /** مسافة أفقية بين الزوجين */
  coupleGap: number
  /** مسافة رأسية بين الجذع والقوس المتفرّع */
  trunkHeight: number
  /** مسافة أفقية بين الأبناء */
  siblingGap: number
  /** مسافة رأسية بين الأجيال */
  generationGap: number
  /** معامل تصغير لكل جيل (مسافات، عرض) */
  generationScale: number
  /** معامل تصغير سماكة الخط لكل جيل */
  strokeScale: number
  /** سماكة أساسية للخط (جيل 0) */
  baseStrokeWidth: number
  /** هامش بين نهاية الغصن والاسم */
  branchLabelMargin: number
  /** عمق أفقي للقوس المتفرّع (U) */
  branchArcDepth: number
}

export const DEFAULT_LAYOUT_CONFIG: LayoutConfig = {
  coupleGap: 120,
  trunkHeight: 80,
  siblingGap: 60,
  generationGap: 100,
  generationScale: 0.85,
  strokeScale: 0.9,
  baseStrokeWidth: 2.5,
  branchLabelMargin: 12,
  branchArcDepth: 50,
}
