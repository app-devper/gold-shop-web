'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, ShoppingCart, Users, Package, Landmark, PiggyBank, PlusCircle } from 'lucide-react'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import { Button } from '@/components/ui/button'
import { customerApi, productApi, pawnApi, goldSavingApi } from '@/lib/gold-api'
import { useDebounced } from '@/lib/use-debounced'
import type { Customer, Product, Pawn, GoldSaving } from '@/types/gold'

type Results = {
  customers: Customer[]
  products: Product[]
  pawns: Pawn[]
  savings: GoldSaving[]
}

const EMPTY: Results = { customers: [], products: [], pawns: [], savings: [] }

export function GlobalSearchTrigger() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen(o => !o)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="h-9 gap-2 px-3 text-muted-foreground"
        onClick={() => setOpen(true)}
      >
        <Search className="h-4 w-4" />
        <span className="hidden md:inline">ค้นหา...</span>
        <kbd className="hidden md:inline pointer-events-none ml-1 h-5 select-none rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">
          ⌘K
        </kbd>
      </Button>
      <GlobalSearchDialog open={open} onOpenChange={setOpen} />
    </>
  )
}

function GlobalSearchDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const router = useRouter()
  const [q, setQ] = useState('')
  const debouncedQ = useDebounced(q, 250)
  const [results, setResults] = useState<Results>(EMPTY)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) { setQ(''); setResults(EMPTY); return }
  }, [open])

  useEffect(() => {
    if (!debouncedQ || debouncedQ.length < 2) { setResults(EMPTY); return }
    let alive = true
    setLoading(true)
    Promise.allSettled([
      customerApi.list().then(list => filterCustomers(list, debouncedQ)),
      productApi.list({ search: debouncedQ }),
      pawnApi.list().then(list => filterPawns(list, debouncedQ)),
      goldSavingApi.list().then(list => filterSavings(list, debouncedQ)),
    ]).then(([c, p, pw, gs]) => {
      if (!alive) return
      setResults({
        customers: c.status === 'fulfilled' ? c.value.slice(0, 5) : [],
        products: p.status === 'fulfilled' ? p.value.slice(0, 5) : [],
        pawns: pw.status === 'fulfilled' ? pw.value.slice(0, 5) : [],
        savings: gs.status === 'fulfilled' ? gs.value.slice(0, 5) : [],
      })
      setLoading(false)
    })
    return () => { alive = false }
  }, [debouncedQ])

  const go = (path: string) => { router.push(path); onOpenChange(false) }

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} title="ค้นหา" description="ค้นหาลูกค้า สินค้า รายการจำนำ บัญชีออมทอง — กด ⌘K">
      <CommandInput placeholder="ค้นหา ชื่อ / เลข / บาร์โค้ด..." value={q} onValueChange={setQ} />
      <CommandList>
        {!debouncedQ && (
          <CommandGroup heading="คำสั่งด่วน">
            <CommandItem onSelect={() => go('/sales')}><ShoppingCart className="mr-2 h-4 w-4" />ขายสินค้า</CommandItem>
            <CommandItem onSelect={() => go('/customers')}><PlusCircle className="mr-2 h-4 w-4" />เพิ่มลูกค้า</CommandItem>
            <CommandItem onSelect={() => go('/pawns/create')}><Landmark className="mr-2 h-4 w-4" />จำนำใหม่</CommandItem>
            <CommandItem onSelect={() => go('/gold-savings')}><PiggyBank className="mr-2 h-4 w-4" />ออมทอง</CommandItem>
          </CommandGroup>
        )}

        {debouncedQ && !loading && results.customers.length === 0 && results.products.length === 0 && results.pawns.length === 0 && results.savings.length === 0 && (
          <CommandEmpty>ไม่พบผลลัพธ์สำหรับ &ldquo;{debouncedQ}&rdquo;</CommandEmpty>
        )}

        {results.customers.length > 0 && (
          <CommandGroup heading="ลูกค้า">
            {results.customers.map(c => (
              <CommandItem key={c.id} onSelect={() => go(`/customers`)}>
                <Users className="mr-2 h-4 w-4" />
                <span>{c.full_name}</span>
                {c.phone && <span className="ml-auto text-xs text-muted-foreground">{c.phone}</span>}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {results.products.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="สินค้า">
              {results.products.map(p => (
                <CommandItem key={p.id} onSelect={() => go(`/products`)}>
                  <Package className="mr-2 h-4 w-4" />
                  <span>{p.name}</span>
                  {p.sku && <span className="ml-auto text-xs text-muted-foreground">{p.sku}</span>}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
        {results.pawns.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="จำนำทอง">
              {results.pawns.map(p => (
                <CommandItem key={p.id} onSelect={() => go(`/pawns`)}>
                  <Landmark className="mr-2 h-4 w-4" />
                  <span>{p.pawn_number}</span>
                  <span className="ml-auto text-xs text-muted-foreground">฿{p.principal.toLocaleString('th-TH')}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
        {results.savings.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="ออมทอง">
              {results.savings.map(s => (
                <CommandItem key={s.id} onSelect={() => go(`/gold-savings`)}>
                  <PiggyBank className="mr-2 h-4 w-4" />
                  <span>{s.account_number}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  )
}

function filterCustomers(list: Customer[], q: string): Customer[] {
  const lq = q.toLowerCase()
  return list.filter(c =>
    c.full_name.toLowerCase().includes(lq)
    || c.phone?.includes(q)
    || c.rfid_card?.toLowerCase().includes(lq)
    || c.member_code?.toLowerCase().includes(lq)
  )
}

function filterPawns(list: Pawn[], q: string): Pawn[] {
  const lq = q.toLowerCase()
  return list.filter(p => p.pawn_number.toLowerCase().includes(lq))
}

function filterSavings(list: GoldSaving[], q: string): GoldSaving[] {
  const lq = q.toLowerCase()
  return list.filter(s => s.account_number.toLowerCase().includes(lq))
}
