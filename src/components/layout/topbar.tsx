'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Building2, UserCircle, LogOut } from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function Topbar() {
    const router = useRouter()
    const pathname = usePathname()
    const logout = useAuthStore((state) => state.logout)
    const username = useAuthStore((state) => state.username)
    const branchName = useAuthStore((state) => state.branchName)

    const handleLogout = () => {
        logout()
        router.push('/login')
    }

    return (
        <header className="flex h-14 items-center justify-between border-b bg-white px-4 shrink-0">
            {/* Branch Info */}
            <div className="flex items-center gap-2 text-sm text-gray-600">
                <Building2 className="h-4 w-4 text-yellow-600" />
                <span className="font-medium text-gray-800">{branchName || 'ไม่ระบุสาขา'}</span>
            </div>

            {/* Right side: username + profile + logout */}
            <div className="flex items-center gap-1">
                {username && (
                    <span className="text-sm text-gray-500 mr-2">{username}</span>
                )}
                <Link
                    href="/profile"
                    className={cn(
                        'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                        pathname === '/profile'
                            ? 'bg-yellow-50 text-yellow-700'
                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    )}
                >
                    <UserCircle className="h-4 w-4" />
                    <span>โปรไฟล์</span>
                </Link>
                <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 text-gray-600"
                    onClick={handleLogout}
                >
                    <LogOut className="h-4 w-4" />
                    <span>ออกจากระบบ</span>
                </Button>
            </div>
        </header>
    )
}
