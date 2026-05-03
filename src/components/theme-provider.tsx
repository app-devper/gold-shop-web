'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

type Theme = 'light' | 'dark'

const ThemeContext = createContext<{ theme: Theme; toggle: () => void } | null>(null)

const STORAGE_KEY = 'gold-shop-theme'

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Default light; we hydrate from localStorage on mount to avoid SSR mismatch
  const [theme, setTheme] = useState<Theme>('light')

  useEffect(() => {
    const stored = (localStorage.getItem(STORAGE_KEY) as Theme | null) ?? 'light'
    setTheme(stored)
    document.documentElement.classList.toggle('dark', stored === 'dark')
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  const toggle = () => setTheme(t => (t === 'dark' ? 'light' : 'dark'))

  return <ThemeContext.Provider value={{ theme, toggle }}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>')
  return ctx
}
