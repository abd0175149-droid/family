'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

interface SidebarItem {
  label: string
  href: string
  icon?: string
  permission?: string
}

interface SidebarProps {
  role: string
}

const menuItems: Record<string, SidebarItem[]> = {
  super_admin: [
    { label: 'الشجرة', href: '/tree' },
    { label: 'المالية', href: '/finance' },
    { label: 'الاجتماعات', href: '/meetings' },
    { label: 'المستخدمين', href: '/admin/users' },
  ],
  secretary: [
    { label: 'الشجرة', href: '/tree' },
    { label: 'الاجتماعات', href: '/meetings' },
    { label: 'المستخدمين', href: '/admin/users' },
  ],
  treasurer: [
    { label: 'المالية', href: '/finance' },
    { label: 'الشجرة', href: '/tree' },
    { label: 'الاجتماعات', href: '/meetings' },
  ],
  member: [
    { label: 'الشجرة', href: '/tree' },
    { label: 'دفعاتي', href: '/my-finance' },
    { label: 'الاجتماعات', href: '/meetings' },
  ],
}

export default function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname()
  const items = menuItems[role] || menuItems.member

  return (
    <aside className="w-64 bg-gray-50 dark:bg-gray-900 min-h-screen p-4">
      <nav className="space-y-2">
        {items.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'block px-4 py-2 rounded-lg transition-colors',
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800'
              )}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
