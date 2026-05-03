'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Building2, Users, UserCheck, TrendingUp,
  Package, ShoppingCart, Landmark, PiggyBank, ArrowLeftRight,
  Gift, Receipt, BarChart3, ChevronRight, Gem,
  type LucideIcon,
} from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import { cn } from '@/lib/utils'

type NavItem = { href: string; label: string; icon: LucideIcon }
type NavSection = { title: string; items: NavItem[]; adminOnly?: boolean }

const sections: NavSection[] = [
  {
    title: 'หลัก',
    items: [
      { href: '/dashboard', label: 'แดชบอร์ด', icon: LayoutDashboard },
      { href: '/sales', label: 'ขายสินค้า (POS)', icon: ShoppingCart },
      { href: '/gold-prices', label: 'ราคาทอง', icon: TrendingUp },
    ],
  },
  {
    title: 'สต็อก',
    items: [
      { href: '/products', label: 'สินค้า', icon: Package },
      { href: '/customers', label: 'ลูกค้า', icon: Users },
      { href: '/inventory', label: 'โอนสินค้า', icon: ArrowLeftRight },
    ],
  },
  {
    title: 'บริการ',
    items: [
      { href: '/pawns', label: 'จำนำทอง', icon: Landmark },
      { href: '/gold-savings', label: 'ออมทอง', icon: PiggyBank },
      { href: '/rewards', label: 'รางวัล', icon: Gift },
      { href: '/expenses', label: 'ค่าใช้จ่าย', icon: Receipt },
    ],
  },
  {
    title: 'รายงาน',
    items: [{ href: '/reports', label: 'รายงาน', icon: BarChart3 }],
  },
  {
    title: 'ผู้ดูแล',
    adminOnly: true,
    items: [
      { href: '/users', label: 'จัดการผู้ใช้', icon: Users },
      { href: '/employees', label: 'พนักงาน', icon: UserCheck },
      { href: '/branches', label: 'สาขา', icon: Building2 },
    ],
  },
]

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + '/')
}

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  const role = useAuthStore((state) => state.userRole)
  const isAdmin = role === 'SUPER' || role === 'ADMIN'

  return (
    <>
      <div className="flex h-14 items-center border-b px-4 gap-2">
        <div className="h-7 w-7 rounded-full bg-gold-500 flex items-center justify-center text-white">
          <Gem className="h-4 w-4" />
        </div>
        <h1 className="text-base font-semibold">Gold Shop</h1>
      </div>

      <div className="flex-1 overflow-y-auto py-3">
        <nav className="space-y-4 px-2">
          {sections.map((section) => {
            if (section.adminOnly && !isAdmin) return null
            return (
              <div key={section.title}>
                <p className="px-3 pt-1 pb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {section.title}
                </p>
                <div className="space-y-0.5">
                  {section.items.map(({ href, label, icon: Icon }) => {
                    const active = isActive(pathname, href)
                    return (
                      <Link
                        key={href}
                        href={href}
                        onClick={onNavigate}
                        className={cn(
                          'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                          active
                            ? 'bg-gold-50 text-gold-700'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="truncate">{label}</span>
                        {active && <ChevronRight className="ml-auto h-3 w-3" />}
                      </Link>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </nav>
      </div>
    </>
  )
}

export function Sidebar() {
  return (
    <div className="hidden lg:flex h-screen w-60 flex-col border-r bg-card">
      <SidebarContent />
    </div>
  )
}
