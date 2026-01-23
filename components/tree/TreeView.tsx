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

function HouseholdNode({ household, index }: { household: Household; index: number }) {
  const husbands = household.members.filter((m) => m.role === 'husband')
  const wives = household.members.filter((m) => m.role === 'wife')
  const children = household.members.filter((m) => m.role === 'child')

  return (
    <div
      className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl p-6 shadow-soft border border-slate-200/50 dark:border-slate-800/50 hover:shadow-glow transition-all duration-300 hover:scale-[1.02] animate-slide-up"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {household.title && (
        <div className="mb-4 pb-3 border-b border-slate-200/50 dark:border-slate-800/50">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span className="text-xl">🏠</span>
            {household.title}
          </h3>
        </div>
      )}

      <div className="space-y-4">
        {husbands.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">
              الزوج
            </p>
            <div className="space-y-1.5">
              {husbands.map((h) => (
                <div
                  key={h.id}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                    {h.person.fullName.charAt(0)}
                  </div>
                  <span className="font-medium text-slate-900 dark:text-slate-100">{h.person.fullName}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {wives.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">
              الزوجات
            </p>
            <div className="space-y-1.5">
              {wives.map((w) => (
                <div
                  key={w.id}
                  className="flex items-center gap-2 px-3 py-2 bg-pink-50 dark:bg-pink-900/20 rounded-lg"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-pink-600 flex items-center justify-center text-white font-semibold text-sm">
                    {w.person.fullName.charAt(0)}
                  </div>
                  <span className="font-medium text-slate-900 dark:text-slate-100">{w.person.fullName}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {children.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">
              الأطفال
            </p>
            <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
              <span className="text-2xl">👶</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {children.length} {children.length === 1 ? 'طفل' : 'أطفال'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
