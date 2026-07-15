import useSWR from 'swr'

import { customerApi } from '@/lib/gold-api'
import { useDebounced } from '@/lib/use-debounced'
import type { Customer } from '@/types/gold'

const SEARCH_DEBOUNCE_MS = 250
const SEARCH_LIMIT = 20

export function useCustomerSearch(query: string) {
  const debouncedQuery = useDebounced(query.trim(), SEARCH_DEBOUNCE_MS)
  const { data } = useSWR<Customer[]>(
    ['customer-search', debouncedQuery],
    () => customerApi.list({ q: debouncedQuery || undefined, limit: SEARCH_LIMIT }),
  )
  return { customers: data ?? [] }
}
