'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function Pagination({
  page,
  pageSize,
  hasNext,
  onPageChange,
  totalLabel,
}: {
  page: number
  pageSize: number
  hasNext: boolean
  onPageChange: (page: number) => void
  totalLabel?: string
}) {
  return (
    <div className="flex items-center justify-between gap-2 pt-3 pb-1 text-sm text-muted-foreground">
      <span>
        {totalLabel ?? `หน้า ${page + 1}`} · {pageSize} รายการ/หน้า
      </span>
      <div className="flex gap-1">
        <Button
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0"
          disabled={page === 0}
          onClick={() => onPageChange(Math.max(0, page - 1))}
          aria-label="หน้าก่อนหน้า"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0"
          disabled={!hasNext}
          onClick={() => onPageChange(page + 1)}
          aria-label="หน้าถัดไป"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
