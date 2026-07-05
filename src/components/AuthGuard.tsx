'use client'

import { useEffect, useSyncExternalStore } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'

const subscribeNoop = () => () => {}

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const accessToken = useAuthStore((state) => state.accessToken)
  const hydrated = useSyncExternalStore(subscribeNoop, () => true, () => false)

  useEffect(() => {
    if (hydrated && !accessToken) {
      router.replace('/login')
    }
  }, [hydrated, accessToken, router])

  if (!hydrated) return null
  if (!accessToken) return null

  return <>{children}</>
}
