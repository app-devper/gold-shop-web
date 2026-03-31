'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Building2, Users, UserCheck, TrendingUp,
  Package, ShoppingCart, Landmark, PiggyBank, ArrowLeftRight,
  Gift, Receipt, BarChart3, ChevronRight,
} from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: 'แดชบอร์ด', icon: LayoutDashboard },
  { href: '/sales', label: 'ขายสินค้า (POS)', icon: ShoppingCart },
  { href: '/gold-prices', label: 'ราคาทอง', icon: TrendingUp },
  { href: '/customers', label: 'ลูกค้า', icon: Users },
  { href: '/products', label: 'สินค้า', icon: Package },
  { href: '/pawns', label: 'จำนำทอง', icon: Landmark },
  { href: '/gold-savings', label: 'ออมทอง', icon: PiggyBank },
  { href: '/inventory', label: 'โอนสินค้า', icon: ArrowLeftRight },
  { href: '/rewards', label: 'รางวัล', icon: Gift },
  { href: '/expenses', label: 'ค่าใช้จ่าย', icon: Receipt },
  { href: '/reports', label: 'รายงาน', icon: BarChart3 },
]

const adminItems = [
  { href: '/users', label: 'จัดการผู้ใช้', icon: Users },
  { href: '/employees', label: 'พนักงาน', icon: UserCheck },
  { href: '/branches', label: 'สาขา', icon: Building2 },
]

export function Sidebar() {
  const pathname = usePathname()
  const role = useAuthStore((state) => state.userRole)

  const isAdmin = role === 'SUPER' || role === 'ADMIN'

  return (
    <div className="flex h-screen w-60 flex-col border-r bg-white">
      <div className="flex h-14 items-center border-b px-4 gap-2">
        <div className="h-7 w-7 rounded-full bg-yellow-500 flex items-center justify-center text-white text-xs font-bold">G</div>
        <h1 className="text-base font-semibold">Gold Shop</h1>
      </div>

      <div className="flex-1 overflow-y-auto py-3">
        <nav className="space-y-0.5 px-2">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                pathname === href || pathname.startsWith(href + '/')
                  ? 'bg-yellow-50 text-yellow-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{label}</span>
              {(pathname === href || pathname.startsWith(href + '/')) && (
                <ChevronRight className="ml-auto h-3 w-3" />
              )}
            </Link>
          ))}

          {isAdmin && (
            <>
              <div className="px-3 pt-4 pb-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Admin</p>
              </div>
              {adminItems.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    pathname === href
                      ? 'bg-yellow-50 text-yellow-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{label}</span>
                </Link>
              ))}
            </>
          )}
        </nav>
      </div>
    </div>
  )
}
