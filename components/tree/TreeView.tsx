'use client'

import { useState } from 'react'
import FamilyTreeView from './FamilyTreeView'
import GridTreeView from './GridTreeView'

type ViewMode = 'tree' | 'grid'

export default function TreeView() {
  const [viewMode, setViewMode] = useState<ViewMode>('tree')

  return (
    <div className="space-y-6 animate-fade-in">
      {/* View Mode Toggle */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent mb-2">
            الشجرة العائلية
          </h1>
          <p className="text-slate-600 dark:text-slate-400">استكشف روابط العائلة وعلاقاتها</p>
        </div>
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-xl p-1 border border-slate-200/50 dark:border-slate-800/50">
          <button
            onClick={() => setViewMode('tree')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              viewMode === 'tree'
                ? 'gradient-primary text-white shadow-glow'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            🌳 شجرة
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              viewMode === 'grid'
                ? 'gradient-primary text-white shadow-glow'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            📋 شبكة
          </button>
        </div>
      </div>

      {viewMode === 'tree' ? <FamilyTreeView /> : <GridTreeView />}
    </div>
  )
}
