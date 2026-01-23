'use client'

import { useEffect, useState } from 'react'
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Position,
  MarkerType,
} from 'reactflow'
import 'reactflow/dist/style.css'
import dagre from 'dagre'

interface Person {
  id: string
  fullName: string
  gender: string
  birthDate?: string
  fatherId?: string
  motherId?: string
  primaryFamilyId?: string
}

interface Family {
  id: string
  title?: string
  members: Array<{
    person: Person
    role: string
    isPrimarySpouse?: boolean
  }>
}

interface TreeData {
  persons?: Person[]
  families?: Family[]
  households?: any[]
}

// عرض عقدة الأسرة - تصميم أنيق وواضح
function FamilyNode({ data }: { data: Family }) {
  const husbands = data.members.filter((m) => m.role === 'husband')
  const wives = data.members.filter((m) => m.role === 'wife')
  const children = data.members.filter((m) => m.role === 'child')

  return (
    <div className="elegant-border rounded-xl bg-white dark:bg-slate-900 p-5 min-w-[240px] elegant-shadow-lg hover:shadow-xl transition-shadow">
      {data.title && (
        <div className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-3 text-center pb-2 border-b-2 border-slate-200 dark:border-slate-700">
          {data.title}
        </div>
      )}
      
      {/* الأزواج */}
      <div className="space-y-2.5 mb-3">
        {husbands.map((h) => (
          <div key={h.person.id} className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-800 dark:bg-slate-100 flex items-center justify-center text-sm font-bold text-white dark:text-slate-900 flex-shrink-0">
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
          <div key={w.person.id} className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-600 dark:bg-slate-300 flex items-center justify-center text-sm font-bold text-white dark:text-slate-900 flex-shrink-0">
              {w.person.fullName.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm truncate">
                {w.person.fullName}
                {w.isPrimarySpouse && <span className="text-xs text-amber-500 mr-1">⭐</span>}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">زوجة</p>
            </div>
          </div>
        ))}
      </div>

      {/* عدد الأبناء */}
      {children.length > 0 && (
        <div className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
          <span className="text-lg">👶</span>
          <span className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
            {children.length} {children.length === 1 ? 'طفل' : 'أطفال'}
          </span>
        </div>
      )}
    </div>
  )
}

const nodeTypes = {
  family: FamilyNode,
}

// استخدام Dagre للـ layout العمودي مع تحسينات
function getLayoutedElements(nodes: Node[], edges: Edge[], direction: 'TB' | 'LR' = 'TB') {
  const dagreGraph = new dagre.graphlib.Graph()
  dagreGraph.setDefaultEdgeLabel(() => ({}))
  
  // إعدادات محسّنة للشجرة العمودية
  dagreGraph.setGraph({ 
    rankdir: direction as string,
    nodesep: 80,      // المسافة الأفقية بين العقد
    ranksep: 200,     // المسافة العمودية بين المستويات
    align: 'UL',      // محاذاة من الأعلى واليسار
    acyclicer: 'greedy',
    ranker: 'longest-path', // استخدام longest-path للحصول على شجرة واضحة
  })

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { 
      width: 260, 
      height: node.data?.height || 180 
    })
  })

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target)
  })

  dagre.layout(dagreGraph)

  nodes.forEach((node) => {
    const nodeWithPosition = dagreGraph.node(node.id)
    node.targetPosition = Position.Top
    node.sourcePosition = Position.Bottom
    node.position = {
      x: nodeWithPosition.x - 130,
      y: nodeWithPosition.y - 90,
    }
  })

  return { nodes, edges }
}

export default function FamilyTreeViewVertical() {
  const [treeData, setTreeData] = useState<TreeData | null>(null)
  const [loading, setLoading] = useState(true)
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])

  useEffect(() => {
    fetch('/api/tree')
      .then((res) => res.json())
      .then((data) => {
        setTreeData(data)
        setLoading(false)
      })
      .catch((error) => {
        console.error('Error fetching tree:', error)
        // معالجة ChunkLoadError
        if (error?.name === 'ChunkLoadError' || error?.message?.includes('Loading chunk')) {
          setTimeout(() => {
            window.location.reload()
          }, 1000)
        }
        setLoading(false)
      })
  }, [])

  // بناء Nodes و Edges من البيانات بشكل محسّن
  useEffect(() => {
    if (!treeData) return

    const familyNodes: Node[] = []
    const familyEdges: Edge[] = []
    const processedFamilies = new Set<string>()
    const familyMap = new Map<string, any>()

    // استخدام families الجديدة أو households القديمة
    const families = treeData.families || treeData.households || []

    // إنشاء خريطة للأسر
    families.forEach((family: any) => {
      familyMap.set(family.id, family)
    })

    // إنشاء nodes للأسر
    families.forEach((family: any) => {
      if (processedFamilies.has(family.id)) return
      processedFamilies.add(family.id)

      // تحويل household إلى family format. لا نخزن childLinks/parentLinks في العقدة
      // (تحتوي على كائنات متداخلة دائرية → Maximum call stack)
      const familyData: Family = {
        id: family.id,
        title: family.title,
        members: (family.members || []).map((m: any) => ({
          person: {
            id: m.person?.id ?? m.personId,
            fullName: m.person?.fullName ?? '',
            gender: m.person?.gender ?? '',
            fatherId: m.person?.fatherId,
            motherId: m.person?.motherId,
            primaryFamilyId: m.person?.primaryFamilyId,
          },
          role: m.role,
          isPrimarySpouse: m.isPrimarySpouse,
        })),
      }

      familyNodes.push({
        id: family.id,
        type: 'family',
        data: familyData,
        position: { x: 0, y: 0 }, // سيتم حسابها بواسطة Dagre
      })
    })

    // إنشاء edges بناءً على روابط الأسر - مع تحسينات
    families.forEach((family: any) => {
      // استخدام childLinks من HouseholdLink (الطريقة الأساسية)
      if (family.childLinks && Array.isArray(family.childLinks)) {
        family.childLinks.forEach((link: any) => {
          const childId = link.childHouseholdId || link.childHousehold?.id
          if (childId && childId !== family.id && familyMap.has(childId)) {
            // التحقق من عدم وجود edge مكرر
            if (!familyEdges.find((e) => e.target === childId && e.source === family.id)) {
              familyEdges.push({
                id: `edge-${family.id}-${childId}`,
                source: family.id,
                target: childId,
                type: 'smoothstep',
                style: { 
                  stroke: '#525252', 
                  strokeWidth: 2.5,
                },
                markerEnd: {
                  type: MarkerType.ArrowClosed,
                  color: '#525252',
                },
                animated: false,
                labelStyle: { fill: '#525252', fontWeight: 600 },
              })
            }
          }
        })
      }

      // أيضاً البحث عن الأبناء الذين لديهم أسر خاصة بهم (استخدام primaryFamilyId)
      if (treeData.persons && family.members) {
        const children = family.members.filter((m: any) => m.role === 'child')
        children.forEach((childMember: any) => {
          const childPerson = childMember.person
          if (childPerson?.primaryFamilyId && 
              childPerson.primaryFamilyId !== family.id && 
              familyMap.has(childPerson.primaryFamilyId)) {
            const childFamily = familyMap.get(childPerson.primaryFamilyId)
            if (childFamily && !familyEdges.find((e) => e.target === childFamily.id && e.source === family.id)) {
              familyEdges.push({
                id: `edge-${family.id}-${childFamily.id}`,
                source: family.id,
                target: childFamily.id,
                type: 'smoothstep',
                style: { 
                  stroke: '#525252', 
                  strokeWidth: 2.5,
                },
                markerEnd: {
                  type: MarkerType.ArrowClosed,
                  color: '#525252',
                },
                animated: false,
              })
            }
          }
        })
      }
    })

    // تطبيق layout فقط إذا كان هناك nodes
    if (familyNodes.length > 0) {
      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(familyNodes, familyEdges, 'TB')
      setNodes(layoutedNodes)
      setEdges(layoutedEdges)
    } else {
      setNodes([])
      setEdges([])
    }
  }, [treeData, setNodes, setEdges])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-2 border-slate-300 dark:border-slate-600 border-t-slate-900 dark:border-t-slate-100 rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-600 dark:text-slate-400 font-medium">جاري تحميل الشجرة...</p>
        </div>
      </div>
    )
  }

  const families = treeData?.families || treeData?.households || []
  if (!treeData || !families || families.length === 0) {
    return (
      <div className="elegant-border rounded-lg bg-white dark:bg-slate-900 p-12 text-center elegant-shadow">
        <div className="text-5xl mb-4">🌳</div>
        <p className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">لا توجد بيانات في الشجرة</p>
        <p className="text-slate-500 dark:text-slate-400">ابدأ بإضافة أسر جديدة</p>
      </div>
    )
  }

  return (
    <div className="w-full h-[900px] elegant-border rounded-xl overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{
          padding: 0.2,
          maxZoom: 1.5,
          minZoom: 0.3,
        }}
        attributionPosition="bottom-left"
        defaultEdgeOptions={{
          type: 'smoothstep',
          style: { strokeWidth: 2.5 },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#525252',
          },
        }}
      >
        <Background 
          color="#d4d4d4" 
          gap={20}
          size={1}
        />
        <Controls 
          className="elegant-shadow rounded-lg bg-white dark:bg-slate-900 elegant-border" 
          showInteractive={false}
        />
        <MiniMap 
          className="elegant-shadow rounded-lg bg-white dark:bg-slate-900 elegant-border"
          nodeColor={(node) => {
            return '#525252'
          }}
          maskColor="rgba(0, 0, 0, 0.1)"
        />
        <div className="absolute top-4 right-4 elegant-shadow rounded-lg bg-white dark:bg-slate-900 p-3 elegant-border z-10">
          <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            {families.length} {families.length === 1 ? 'أسرة' : 'أسر'}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {edges.length} {edges.length === 1 ? 'رابط' : 'روابط'}
          </div>
        </div>
      </ReactFlow>
    </div>
  )
}
