'use client'

import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useTheme } from '@/components/theme-provider'

export function ThemeToggle() {
  const { theme, toggle } = useTheme()
  const label = theme === 'dark' ? 'สลับเป็นโหมดสว่าง' : 'สลับเป็นโหมดมืด'
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-9 w-9 p-0"
          onClick={toggle}
          aria-label={label}
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}
