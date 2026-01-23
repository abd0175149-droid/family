'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

interface SidebarItem {
  label: string
  href: string
  icon: string
  permission?: string
}

interface SidebarProps {
  role: string
  isMobileOpen?: boolean
  onMobileClose?: () => void
}

const menuItems: Record<string, SidebarItem[]> = {
  super_admin: [
    { label: 'الشجرة', href: '/tree', icon: '🌳' },
    { label: 'المالية', href: '/finance', icon: '💰' },
    { label: 'الاجتماعات', href: '/meetings', icon: '📋' },
    { label: 'المستخدمين', href: '/admin/users', icon: '👥' },
  ],
  secretary: [
    { label: 'الشجرة', href: '/tree', icon: '🌳' },
    { label: 'الاجتماعات', href: '/meetings', icon: '📋' },
    { label: 'المستخدمين', href: '/admin/users', icon: '👥' },
  ],
  treasurer: [
    { label: 'المالية', href: '/finance', icon: '💰' },
    { label: 'الشجرة', href: '/tree', icon: '🌳' },
    { label: 'الاجتماعات', href: '/meetings', icon: '📋' },
  ],
  member: [
    { label: 'الشجرة', href: '/tree', icon: '🌳' },
    { label: 'دفعاتي', href: '/my-finance', icon: '💳' },
    { label: 'الاجتماعات', href: '/meetings', icon: '📋' },
  ],
}

export default function Sidebar({ role, isMobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname()
  const items = menuItems[role] || menuItems.member

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-72 flex-col bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border-r border-slate-200/50 dark:border-slate-800/50 shadow-soft">
        <div className="p-6 border-b border-slate-200/50 dark:border-slate-800/50">
          <h2 className="text-lg font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
            القائمة الرئيسية
          </h2>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {items.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onMobileClose}
                className={cn(
                  'group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
                  'hover:scale-[1.02] active:scale-[0.98]',
                  isActive
                    ? 'gradient-primary text-white shadow-glow'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                )}
              >
                <span className={cn(
                  'text-xl transition-transform group-hover:scale-110',
                  isActive && 'drop-shadow-lg'
                )}>
                  {item.icon}
                </span>
                <span className={cn(
                  'font-medium',
                  isActive ? 'text-white' : 'group-hover:text-primary-600 dark:group-hover:text-primary-400'
                )}>
                  {item.label}
                </span>
                {isActive && (
                  <div className="mr-auto w-2 h-2 rounded-full bg-white/80 animate-scale-in" />
                )}
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Mobile Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 right-0 z-50 w-72 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl',
          'border-l border-slate-200/50 dark:border-slate-800/50 shadow-2xl',
          'transform transition-transform duration-300 ease-in-out lg:hidden',
          isMobileOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        <div className="p-6 border-b border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between">
          <h2 className="text-lg font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
            القائمة الرئيسية
          </h2>
          <button
            onClick={onMobileClose}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {items.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onMobileClose}
                className={cn(
                  'group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
                  'hover:scale-[1.02] active:scale-[0.98]',
                  isActive
                    ? 'gradient-primary text-white shadow-glow'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                )}
              >
                <span className={cn(
                  'text-xl transition-transform group-hover:scale-110',
                  isActive && 'drop-shadow-lg'
                )}>
                  {item.icon}
                </span>
                <span className={cn(
                  'font-medium',
                  isActive ? 'text-white' : 'group-hover:text-primary-600 dark:group-hover:text-primary-400'
                )}>
                  {item.label}
                </span>
                {isActive && (
                  <div className="mr-auto w-2 h-2 rounded-full bg-white/80 animate-scale-in" />
                )}
              </Link>
            )
          })}
        </nav>
      </aside>
    </>
  )
}
