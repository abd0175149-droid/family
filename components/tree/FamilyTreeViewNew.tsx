'use client'

import { useEffect, useState, useCallback } from 'react'
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  ConnectionMode,
  Panel,
  Position,
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
  households?: any[] // للتوافق مع البيانات القديمة
}

// عرض عقدة الأسرة
function FamilyNode({ data }: { data: Family }) {
  const husbands = data.members.filter((m) => m.role === 'husband')
  const wives = data.members.filter((m) => m.role === 'wife')
  const children = data.members.filter((m) => m.role === 'child')

  return (
    <div className="elegant-border rounded-lg bg-white dark:bg-slate-900 p-4 min-w-[200px] elegant-shadow-lg">
      {data.title && (
        <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 text-center border-b border-slate-200 dark:border-slate-700 pb-2">
          {data.title}
        </div>
      )}
      
      {/* الأزواج */}
      <div className="space-y-2 mb-3">
        {husbands.map((h) => (
          <div key={h.person.id} className="flex items-center gap-2 text-sm">
            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-semibold text-slate-700 dark:text-slate-300">
              {h.person.fullName.charAt(0)}
            </div>
            <span className="font-medium text-slate-900 dark:text-slate-100">{h.person.fullName}</span>
          </div>
        ))}
        
        {wives.map((w) => (
          <div key={w.person.id} className="flex items-center gap-2 text-sm">
            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-semibold text-slate-700 dark:text-slate-300">
              {w.person.fullName.charAt(0)}
            </div>
            <span className="font-medium text-slate-900 dark:text-slate-100">{w.person.fullName}</span>
          </div>
        ))}
      </div>

      {/* عدد الأبناء */}
      {children.length > 0 && (
        <div className="text-xs text-center text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-700">
          {children.length} {children.length === 1 ? 'طفل' : 'أطفال'}
        </div>
      )}
    </div>
  )
}

const nodeTypes = {
  family: FamilyNode,
}

// استخدام Dagre للـ layout العمودي
function getLayoutedElements(nodes: Node[], edges: Edge[], direction: 'TB' | 'LR' = 'TB') {
  const dagreGraph = new dagre.graphlib.Graph()
  dagreGraph.setDefaultEdgeLabel(() => ({}))
  dagreGraph.setGraph({ 
    rankdir: direction as string,
    nodesep: 100,
    ranksep: 150,
    align: 'UL',
  })

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: 220, height: node.data?.height || 150 })
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
      x: nodeWithPosition.x - 110,
      y: nodeWithPosition.y - 75,
    }
  })

  return { nodes, edges }
}

export default function FamilyTreeViewNew() {
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
        setLoading(false)
      })
  }, [])

  // بناء Nodes و Edges من البيانات
  useEffect(() => {
    if (!treeData) return

    const familyNodes: Node[] = []
    const familyEdges: Edge[] = []
    const processedFamilies = new Set<string>()

    // استخدام families الجديدة أو households القديمة
    const families = treeData.families || treeData.households || []

    // إنشاء nodes للأسر
    families.forEach((family: any) => {
      if (processedFamilies.has(family.id)) return
      processedFamilies.add(family.id)

      // تحويل household إلى family format إذا لزم الأمر
      const familyData: Family = {
        id: family.id,
        title: family.title,
        members: family.members?.map((m: any) => ({
          person: m.person || {
            id: m.personId,
            fullName: m.person?.fullName || '',
            gender: m.person?.gender || '',
          },
          role: m.role,
          isPrimarySpouse: m.isPrimarySpouse,
        })) || [],
      }

      familyNodes.push({
        id: family.id,
        type: 'family',
        data: familyData,
        position: { x: 0, y: 0 }, // سيتم حسابها بواسطة Dagre
      })
    })

    // إنشاء edges بناءً على روابط الأسر
    families.forEach((family: any) => {
      // استخدام childLinks من HouseholdLink
      if (family.childLinks) {
        family.childLinks.forEach((link: any) => {
          const childId = link.childHouseholdId || link.childHousehold?.id
          if (childId && childId !== family.id) {
            if (!familyEdges.find((e) => e.target === childId && e.source === family.id)) {
              familyEdges.push({
                id: `${family.id}-${childId}`,
                source: family.id,
                target: childId,
                type: 'smoothstep',
                style: { stroke: '#737373', strokeWidth: 2 },
                animated: false,
              })
            }
          }
        })
      }

      // أيضاً البحث عن الأبناء الذين لديهم أسر خاصة بهم (إذا كانت persons متوفرة)
      if (treeData.persons && family.members) {
        const children = family.members.filter((m: any) => m.role === 'child')
        children.forEach((childMember: any) => {
          const childPerson = childMember.person
          if (childPerson?.primaryFamilyId && childPerson.primaryFamilyId !== family.id) {
            const childFamily = families.find((f: any) => f.id === childPerson.primaryFamilyId)
            if (childFamily && !familyEdges.find((e) => e.target === childFamily.id && e.source === family.id)) {
              familyEdges.push({
                id: `${family.id}-${childFamily.id}`,
                source: family.id,
                target: childFamily.id,
                type: 'smoothstep',
                style: { stroke: '#737373', strokeWidth: 2 },
                animated: false,
              })
            }
          }
        })
      }
    })

    // تطبيق layout
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(familyNodes, familyEdges)
    setNodes(layoutedNodes)
    setEdges(layoutedEdges)
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

  if (!treeData || treeData.families.length === 0) {
    return (
      <div className="elegant-border rounded-lg bg-white dark:bg-slate-900 p-12 text-center elegant-shadow">
        <div className="text-5xl mb-4">🌳</div>
        <p className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">لا توجد بيانات في الشجرة</p>
        <p className="text-slate-500 dark:text-slate-400">ابدأ بإضافة أسر جديدة</p>
      </div>
    )
  }

  return (
    <div className="w-full h-[800px] elegant-border rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-950">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView
        attributionPosition="bottom-left"
      >
        <Background color="#e5e5e5" gap={16} />
        <Controls className="elegant-shadow" />
        <MiniMap 
          className="elegant-shadow"
          nodeColor={(node) => {
            return '#737373'
          }}
        />
        <Panel position="top-right" className="elegant-shadow rounded-lg bg-white dark:bg-slate-900 p-2 elegant-border">
          <div className="text-xs text-slate-600 dark:text-slate-400">
            {families.length} {families.length === 1 ? 'أسرة' : 'أسر'}
          </div>
        </Panel>
      </ReactFlow>
    </div>
  )
}
