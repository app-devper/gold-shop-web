'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Building2, UserCircle, LogOut, Menu, Search } from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { ThemeToggle } from '@/components/theme-toggle'
import { GlobalSearchTrigger } from '@/components/global-search'
import { SidebarContent } from '@/components/layout/sidebar'
import { cn } from '@/lib/utils'

export function Topbar() {
    const router = useRouter()
    const pathname = usePathname()
    const logout = useAuthStore((state) => state.logout)
    const username = useAuthStore((state) => state.username)
    const branchName = useAuthStore((state) => state.branchName)
    const [mobileOpen, setMobileOpen] = useState(false)

    const handleLogout = () => {
        logout()
        router.push('/login')
    }

    return (
        <header className="flex h-14 items-center justify-between border-b bg-card px-4 shrink-0 gap-2">
            <div className="flex items-center gap-2 min-w-0">
                {/* Mobile hamburger */}
                <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="lg:hidden h-9 w-9 p-0"
                        onClick={() => setMobileOpen(true)}
                        aria-label="เปิดเมนู"
                    >
                        <Menu className="h-5 w-5" />
                    </Button>
                    <SheetContent side="left" className="w-64 p-0 flex flex-col">
                        <SheetHeader className="sr-only"><SheetTitle>เมนู</SheetTitle></SheetHeader>
                        <SidebarContent onNavigate={() => setMobileOpen(false)} />
                    </SheetContent>
                </Sheet>

                <div className="flex items-center gap-2 text-sm text-muted-foreground min-w-0">
                    <Building2 className="h-4 w-4 text-gold-600 shrink-0" />
                    <span className="font-medium text-foreground truncate">{branchName || 'ไม่ระบุสาขา'}</span>
                </div>
            </div>

            <div className="flex items-center gap-1">
                <GlobalSearchTrigger />
                <ThemeToggle />
                {username && (
                    <span className="hidden sm:inline text-sm text-muted-foreground mx-1">{username}</span>
                )}
                <Link
                    href="/profile"
                    className={cn(
                        'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                        pathname === '/profile'
                            ? 'bg-gold-50 text-gold-700'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                >
                    <UserCircle className="h-4 w-4" />
                    <span className="hidden sm:inline">โปรไฟล์</span>
                </Link>
                <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 text-muted-foreground"
                    onClick={handleLogout}
                    aria-label="ออกจากระบบ"
                >
                    <LogOut className="h-4 w-4" />
                    <span className="hidden sm:inline">ออกจากระบบ</span>
                </Button>
            </div>
        </header>
    )
}
