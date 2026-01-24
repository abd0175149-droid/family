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
    { label: 'الملف الشخصي', href: '/profile', icon: '👤' },
  ],
  secretary: [
    { label: 'الشجرة', href: '/tree', icon: '🌳' },
    { label: 'الاجتماعات', href: '/meetings', icon: '📋' },
    { label: 'المستخدمين', href: '/admin/users', icon: '👥' },
    { label: 'الملف الشخصي', href: '/profile', icon: '👤' },
  ],
  treasurer: [
    { label: 'المالية', href: '/finance', icon: '💰' },
    { label: 'الشجرة', href: '/tree', icon: '🌳' },
    { label: 'الاجتماعات', href: '/meetings', icon: '📋' },
    { label: 'الملف الشخصي', href: '/profile', icon: '👤' },
  ],
  member: [
    { label: 'الشجرة', href: '/tree', icon: '🌳' },
    { label: 'دفعاتي', href: '/my-finance', icon: '💳' },
    { label: 'الاجتماعات', href: '/meetings', icon: '📋' },
    { label: 'الملف الشخصي', href: '/profile', icon: '👤' },
  ],
}

export default function Sidebar({ role, isMobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname()
  const items = menuItems[role] || menuItems.member

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-72 flex-col bg-primary-600 dark:bg-primary-800 border-r border-primary-500 dark:border-primary-700 shadow-soft">
        <div className="p-6 border-b border-white/20">
          <h2 className="text-lg font-bold text-white">
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
                    ? 'bg-white/20 text-white'
                    : 'text-white/85 hover:bg-white/10'
                )}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
                {isActive && (
                  <div className="mr-auto w-2 h-2 rounded-full bg-white animate-scale-in" />
                )}
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Mobile Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 right-0 z-50 w-72 bg-primary-600 dark:bg-primary-800 border-l border-primary-500 shadow-2xl',
          'transform transition-transform duration-300 ease-in-out lg:hidden',
          isMobileOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        <div className="p-6 border-b border-white/20 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">القائمة الرئيسية</h2>
          <button
            onClick={onMobileClose}
            className="p-2 rounded-lg text-white hover:bg-white/10 transition-colors"
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
                  isActive ? 'bg-white/20 text-white' : 'text-white/85 hover:bg-white/10'
                )}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
                {isActive && <div className="mr-auto w-2 h-2 rounded-full bg-white animate-scale-in" />}
              </Link>
            )
          })}
        </nav>
      </aside>
    </>
  )
}
