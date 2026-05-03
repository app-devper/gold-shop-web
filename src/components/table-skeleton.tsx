import { Skeleton } from '@/components/ui/skeleton'
import { TableBody, TableCell, TableRow } from '@/components/ui/table'

export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <TableBody>
      {Array.from({ length: rows }).map((_, r) => (
        <TableRow key={r}>
          {Array.from({ length: cols }).map((_, c) => (
            <TableCell key={c}>
              <Skeleton className="h-4 w-full max-w-[120px]" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </TableBody>
  )
}
