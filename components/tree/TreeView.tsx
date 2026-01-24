'use client'

import { useState } from 'react'
import D3FamilyTree from './d3/D3FamilyTree'
import GridTreeView from './GridTreeView'

type ViewMode = 'tree' | 'grid'

export default function TreeView() {
  const [viewMode, setViewMode] = useState<ViewMode>('tree')

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-50 mb-1 sm:mb-2">
            الشجرة العائلية
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">استكشف روابط العائلة وعلاقاتها</p>
        </div>
        <div className="glass-effect rounded-xl p-1.5 border border-gray-200 dark:border-gray-800 flex flex-wrap gap-1">
          <button
            onClick={() => setViewMode('tree')}
            className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-all ${
              viewMode === 'tree'
                ? 'gradient-primary text-white shadow-glow elegant-shadow'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/50'
            }`}
          >
            🌳 شجرة
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-all ${
              viewMode === 'grid'
                ? 'gradient-primary text-white shadow-glow elegant-shadow'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/50'
            }`}
          >
            📋 شبكة
          </button>
        </div>
      </div>

      {viewMode === 'tree' ? <D3FamilyTree /> : <GridTreeView />}
    </div>
  )
}
