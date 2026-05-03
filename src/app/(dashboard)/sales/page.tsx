'use client'

import { useEffect, useRef, useState } from 'react'
import useSWR from 'swr'
import { format } from 'date-fns'
import { Search, ShoppingCart, Trash2, Edit2, Tag, UserPlus, X, Receipt, XCircle, RefreshCw, Gem, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

import { saleApi, customerApi, productApi, goldPriceApi } from '@/lib/gold-api'
import { useDebounced } from '@/lib/use-debounced'
import { apiToastError } from '@/lib/api-toast'
import type { Sale, Customer, Product, OldGoldItem, Payment, GoldPrice } from '@/types/gold'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { makeCartItem, calcGoldPrice, saleTypeLabels, statusColor, statusLabel, typeLabel, fmt, fmtDec } from './pos-types'
import type { CartItem } from './pos-types'
import {
  CustomerSearchDialog, EditPriceDialog, ItemDiscountDialog,
  GlobalDiscountDialog, PointsDialog, OldGoldDialog,
  PaymentDialog, ReceiptDialog, SaleDetailDialog,
} from './pos-dialogs'

export default function SalesPage() {
  // ── Cart state ──
  const [cart, setCart] = useState<CartItem[]>([])
  const [saleType, setSaleType] = useState<'sell' | 'exchange' | 'buy_old'>('sell')
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [oldGoldItems, setOldGoldItems] = useState<OldGoldItem[]>([])
  const [globalDiscount, setGlobalDiscount] = useState(0)
  const [globalDiscountType, setGlobalDiscountType] = useState<'amount' | 'percent'>('amount')
  const [pointsUsed, setPointsUsed] = useState(0)
  const [searchQ, setSearchQ] = useState('')
  const [saving, setSaving] = useState(false)

  // ── Dialog state ──
  const [customerSearchOpen, setCustomerSearchOpen] = useState(false)
  const [customerSearchQ, setCustomerSearchQ] = useState('')
  const [editPriceIdx, setEditPriceIdx] = useState<number | null>(null)
  const [editPriceVal, setEditPriceVal] = useState('')
  const [itemDiscountIdx, setItemDiscountIdx] = useState<number | null>(null)
  const [itemDiscountVal, setItemDiscountVal] = useState('')
  const [itemDiscountType, setItemDiscountType] = useState<'amount' | 'percent'>('amount')
  const [globalDiscountOpen, setGlobalDiscountOpen] = useState(false)
  const [globalDiscountInput, setGlobalDiscountInput] = useState('')
  const [globalDiscountTypeInput, setGlobalDiscountTypeInput] = useState<'amount' | 'percent'>('amount')
  const [pointsOpen, setPointsOpen] = useState(false)
  const [pointsInput, setPointsInput] = useState('')
  const [oldGoldOpen, setOldGoldOpen] = useState(false)
  const [ogDesc, setOgDesc] = useState('')
  const [ogGoldType, setOgGoldType] = useState('96.5%')
  const [ogWeight, setOgWeight] = useState('')
  const [ogPrice, setOgPrice] = useState('')
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [payMethod, setPayMethod] = useState<'cash' | 'transfer' | 'credit_card'>('cash')
  const [payAmount, setPayAmount] = useState('')
  const [receiptOpen, setReceiptOpen] = useState(false)
  const [lastSale, setLastSale] = useState<Sale | null>(null)
  const [detailSale, setDetailSale] = useState<Sale | null>(null)

  // ── Data ──
  const debouncedSearchQ = useDebounced(searchQ, 250)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const { data: currentGoldPrice } = useSWR<GoldPrice>('gold-price-current', () => goldPriceApi.current())
  const { data: allProducts } = useSWR<Product[]>('products-all', () => productApi.list({}))
  const { data: searchProducts } = useSWR<Product[]>(
    debouncedSearchQ ? ['products-search', debouncedSearchQ] : null,
    () => productApi.list({ search: debouncedSearchQ })
  )
  const { data: customers } = useSWR<Customer[]>('customers', () => customerApi.list())
  const { data: salesHistory, isLoading: histLoading, mutate: mutateSales } = useSWR<Sale[]>('sales', () => saleApi.list())

  const displayProducts = searchQ ? (searchProducts ?? []) : (allProducts ?? [])
  const BAHT_GRAM = 15.244
  const goldBarBuyPerGram = currentGoldPrice ? currentGoldPrice.gold_bar_buy / BAHT_GRAM : 0
  const goldOrnamentBuyPerGram = currentGoldPrice ? currentGoldPrice.gold_ornament_buy / BAHT_GRAM : 0
  const goldSellPricePerBaht = currentGoldPrice?.gold_ornament_sell ?? 0

  // ── Calculations ──
  const subtotal = cart.reduce((s, i) => s + i.total, 0)
  const globalDiscountAmount = globalDiscountType === 'percent' ? subtotal * (globalDiscount / 100) : globalDiscount
  const oldGoldValue = oldGoldItems.reduce((s, i) => s + i.total, 0)
  const netTotal = Math.max(0, subtotal - globalDiscountAmount - oldGoldValue - pointsUsed)
  const customerPoints = selectedCustomer?.membership?.points ?? 0

  // ── Helpers ──
  const addToCart = (p: Product) => setCart(prev => [...prev, makeCartItem(p, goldSellPricePerBaht)])
  const removeFromCart = (idx: number) => setCart(prev => prev.filter((_, i) => i !== idx))
  const clearCart = () => {
    setCart([]); setSelectedCustomer(null); setOldGoldItems([])
    setGlobalDiscount(0); setPointsUsed(0); setSaleType('sell')
  }

  const completeSale = async () => {
    const payments: Payment[] = [{ method: payMethod, amount: parseFloat(payAmount) || netTotal }]
    const payload = {
      customer_id: selectedCustomer?.id, sale_type: saleType,
      items: cart.map(i => ({
        product_id: i.product.id, product_name: i.product.name, gold_type: i.product.gold_type,
        weight: i.product.weight, price_level: 'custom', unit_price: i.unitPrice,
        labor_cost: i.product.labor_cost, discount: i.discount, discount_type: i.discountType,
        cost: i.product.cost, total: i.total,
      })),
      old_gold_items: oldGoldItems, subtotal, discount: globalDiscountAmount, discount_type: globalDiscountType,
      old_gold_value: oldGoldValue, net_total: netTotal, payments, points_used: pointsUsed,
    }
    try {
      setSaving(true)
      const sale = await saleApi.create(payload)
      setLastSale(sale); setReceiptOpen(true); clearCart(); mutateSales()
      toast.success('บันทึกการขายสำเร็จ')
    } catch (e) {
      apiToastError(e)
    } finally { setSaving(false); setPaymentOpen(false) }
  }

  const handleCancelSale = async (id: string) => {
    if (!confirm('ยืนยันยกเลิกรายการนี้?')) return
    try { await saleApi.cancel(id); toast.success('ยกเลิกรายการแล้ว'); mutateSales() }
    catch (e) { apiToastError(e) }
  }

  // ── Keyboard shortcuts + barcode scanner ──
  // Pure-digit input ≥6 chars typed within ~50ms-per-key = barcode → exact match auto-add.
  const lastKeyTime = useRef(0)
  const barcodeBuf = useRef('')
  useEffect(() => {
    const isTyping = (el: EventTarget | null) =>
      el instanceof HTMLElement && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)

    const handler = (e: KeyboardEvent) => {
      // Cmd/Ctrl+F → focus search
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault()
        searchInputRef.current?.focus()
        searchInputRef.current?.select()
        return
      }
      // F4 → open payment if cart not empty
      if (e.key === 'F4') {
        e.preventDefault()
        if (!saving && (cart.length > 0 || saleType === 'buy_old')) {
          setPayAmount(String(netTotal))
          setPaymentOpen(true)
        }
        return
      }

      // Barcode: capture digit bursts globally (only when not in another input)
      const now = Date.now()
      const fast = now - lastKeyTime.current < 50
      if (!isTyping(e.target) && /^[0-9]$/.test(e.key)) {
        if (!fast && barcodeBuf.current.length > 0) barcodeBuf.current = ''
        barcodeBuf.current += e.key
        lastKeyTime.current = now
        return
      }
      if (e.key === 'Enter') {
        const buf = barcodeBuf.current
        barcodeBuf.current = ''
        if (buf.length >= 6 && !isTyping(e.target)) {
          // Hardware-scanner-like burst: search and auto-add the first exact-barcode match
          void (async () => {
            try {
              const list = await productApi.list({ search: buf })
              const exact = list.find(p => p.barcode === buf) ?? list[0]
              if (exact) addToCart(exact)
              else toast.error(`ไม่พบสินค้า: ${buf}`)
            } catch (err) { apiToastError(err) }
          })()
          return
        }
        // Search input focused + Enter → add first matching product
        if (e.target === searchInputRef.current && displayProducts[0]) {
          e.preventDefault()
          addToCart(displayProducts[0])
          setSearchQ('')
          return
        }
      }
      if (e.key === 'Escape' && e.target === searchInputRef.current) {
        setSearchQ('')
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [cart.length, saleType, netTotal, saving, displayProducts])

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      <Tabs defaultValue="pos" className="flex flex-col flex-1 min-h-0">
        <div className="flex items-center justify-between pb-3 shrink-0">
          <h1 className="text-2xl font-bold">ขายสินค้า (POS)</h1>
          {currentGoldPrice && (
            <div className="hidden sm:flex items-center gap-3 text-xs rounded-lg px-3 py-1.5 text-white bg-gradient-to-br from-gold-600 to-gold-500">
              <span className="font-semibold">ทองวันนี้</span>
              <span>แท่งรับซื้อ ฿{currentGoldPrice.gold_bar_buy.toLocaleString('th-TH')}/บาท</span>
              <span className="opacity-60">|</span>
              <span>รูปพรรณรับซื้อ ฿{currentGoldPrice.gold_ornament_buy.toLocaleString('th-TH')}/บาท</span>
            </div>
          )}
          <TabsList>
            <TabsTrigger value="pos"><ShoppingCart className="h-4 w-4 mr-1.5" />ขายสินค้า</TabsTrigger>
            <TabsTrigger value="history"><Receipt className="h-4 w-4 mr-1.5" />ประวัติการขาย</TabsTrigger>
          </TabsList>
        </div>

        {/* ── POS Tab ── */}
        <TabsContent value="pos" className="flex-1 min-h-0 flex gap-4 mt-0 overflow-hidden">
          {/* Left: Product Grid */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex gap-2 mb-3 shrink-0">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input ref={searchInputRef} className="pl-9" placeholder="ค้นหาสินค้า, สแกนบาร์โค้ด...  (Ctrl+F)" value={searchQ} onChange={e => setSearchQ(e.target.value)} />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {displayProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                  <ShoppingCart className="h-12 w-12 mb-2 opacity-20" /><p>ไม่พบสินค้า</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {displayProducts.map(p => (
                    <button key={p.id} onClick={() => addToCart(p)}
                      className="text-left rounded-xl border bg-card p-3 hover:border-gold-400 hover:shadow-md transition-all">
                      <div className="rounded-lg bg-gold-50 flex items-center justify-center h-14 mb-2 relative">
                        <Gem className="h-7 w-7 text-gold-600" />
                        {p.gold_type && <span className="absolute top-1 left-1 text-xs bg-gold-500 text-white px-1.5 py-0.5 rounded">{p.gold_type}</span>}
                      </div>
                      <p className="font-semibold text-sm truncate">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{fmtDec(p.weight)}g · {fmtDec(p.weight / BAHT_GRAM)} บาททอง</p>
                      {goldSellPricePerBaht > 0 ? (
                        <div className="mt-1">
                          <p className="font-bold text-gold-700">฿{fmt(calcGoldPrice(p, goldSellPricePerBaht))}</p>
                          {p.labor_cost > 0 && <p className="text-xs text-muted-foreground">ค่ากำเหน็จ ฿{fmt(p.labor_cost)}</p>}
                        </div>
                      ) : (
                        <p className="font-bold text-gold-700 mt-1">฿{fmt(p.price)}</p>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Cart Panel */}
          <aside className="w-80 xl:w-96 flex flex-col border-l pl-4 min-h-0">
            {/* Header: sale type + customer (sticky top) */}
            <div className="shrink-0 space-y-3 pb-3 border-b">
              <div className="flex gap-1">
                {(['sell', 'exchange', 'buy_old'] as const).map(t => (
                  <button key={t} onClick={() => setSaleType(t)}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-lg border transition-colors ${saleType === t ? 'bg-gold-500 text-white border-gold-500' : 'border-border text-muted-foreground hover:bg-muted'}`}>
                    {saleTypeLabels[t]}
                  </button>
                ))}
              </div>
              {selectedCustomer ? (
                <div className="flex items-center gap-2 rounded-lg bg-gold-50 border border-gold-200 px-3 py-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{selectedCustomer.full_name}</p>
                    {customerPoints > 0 && <p className="text-xs text-muted-foreground">คะแนนสะสม: {customerPoints} คะแนน</p>}
                  </div>
                  <button onClick={() => { setSelectedCustomer(null); setPointsUsed(0) }}><X className="h-4 w-4 text-muted-foreground" /></button>
                </div>
              ) : (
                <Button variant="outline" size="sm" className="w-full" onClick={() => setCustomerSearchOpen(true)}>
                  <UserPlus className="h-4 w-4 mr-2" />เลือกลูกค้า
                </Button>
              )}
            </div>

            {/* Scroll body: cart + old gold */}
            <div className="flex-1 overflow-y-auto py-3 space-y-2 min-h-0">
              {cart.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm py-8">ตะกร้าว่างเปล่า</p>
              ) : cart.map((item, idx) => (
                <div key={idx} className="rounded-lg border bg-card p-2.5 text-sm">
                  <div className="flex items-start justify-between gap-1">
                    <p className="font-semibold truncate flex-1">{item.product.name}</p>
                    <button onClick={() => removeFromCart(idx)}><X className="h-4 w-4 text-muted-foreground" /></button>
                  </div>
                  <p className="text-xs text-muted-foreground">{fmtDec(item.product.weight)}g</p>
                  <div className="flex items-center justify-between mt-1.5">
                    <button onClick={() => { setEditPriceIdx(idx); setEditPriceVal(String(item.unitPrice)) }}
                      className="flex items-center gap-1 text-gold-700 font-bold hover:underline">
                      ฿{fmt(item.unitPrice)}<Edit2 className="h-3 w-3" />
                    </button>
                    <button onClick={() => { setItemDiscountIdx(idx); setItemDiscountVal(item.discount > 0 ? String(item.discount) : ''); setItemDiscountType(item.discountType) }}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                      <Tag className="h-3 w-3" />ส่วนลด
                    </button>
                  </div>
                  {item.discount > 0 && (
                    <p className="text-xs text-orange-600 mt-0.5">
                      ส่วนลด: {item.discountType === 'percent' ? `${item.discount}%` : `฿${fmt(item.discountAmount)}`} → ฿{fmt(item.total)}
                    </p>
                  )}
                </div>
              ))}

              {saleType !== 'sell' && (
                <div className="border-t pt-2 mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-semibold">ทองเก่า ({oldGoldItems.length})</p>
                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setOldGoldOpen(true)}>+ เพิ่ม</Button>
                  </div>
                  {oldGoldItems.map((og, i) => (
                    <div key={i} className="flex items-center justify-between text-xs py-1">
                      <span className="truncate flex-1">{og.description || `${og.gold_type} ${og.weight}g`}</span>
                      <div className="flex items-center gap-1">
                        <span className="font-medium">฿{fmt(og.total)}</span>
                        <button onClick={() => setOldGoldItems(prev => prev.filter((_, j) => j !== i))}><X className="h-3 w-3 text-muted-foreground" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sticky footer: summary + pay button */}
            <div className="shrink-0 border-t pt-3 space-y-1 text-sm bg-background">
              <div className="flex justify-between"><span className="text-muted-foreground">ยอดรวม</span><span>฿{fmt(subtotal)}</span></div>
              {globalDiscountAmount > 0 && <div className="flex justify-between text-red-600"><span>ส่วนลดท้ายบิล</span><span>-฿{fmt(globalDiscountAmount)}</span></div>}
              {oldGoldValue > 0 && <div className="flex justify-between text-orange-600"><span>หักทองเก่า</span><span>-฿{fmt(oldGoldValue)}</span></div>}
              {pointsUsed > 0 && <div className="flex justify-between text-blue-600"><span>ใช้คะแนน ({pointsUsed})</span><span>-฿{fmt(pointsUsed)}</span></div>}
              <div className="flex justify-between font-bold text-base border-t pt-1">
                <span>ยอดสุทธิ</span><span className="text-gold-700">฿{fmt(netTotal)}</span>
              </div>
              <div className="flex gap-2 pt-1">
                <Button variant="outline" size="sm" className="flex-1 text-xs"
                  onClick={() => { setGlobalDiscountInput(globalDiscount > 0 ? String(globalDiscount) : ''); setGlobalDiscountTypeInput(globalDiscountType); setGlobalDiscountOpen(true) }}>
                  <Tag className="h-3 w-3 mr-1" />ส่วนลดท้ายบิล
                </Button>
                {selectedCustomer && customerPoints > 0 && (
                  <Button variant="outline" size="sm" className="flex-1 text-xs"
                    onClick={() => { setPointsInput(pointsUsed > 0 ? String(pointsUsed) : ''); setPointsOpen(true) }}>
                    <Sparkles className="h-3 w-3 mr-1" />ใช้คะแนน
                  </Button>
                )}
              </div>
              <div className="flex gap-2 pt-1">
                <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={clearCart}><Trash2 className="h-4 w-4" /></Button>
                <Button className="flex-1 bg-gold-500 hover:bg-gold-600 text-white"
                  disabled={saving || (cart.length === 0 && saleType !== 'buy_old')}
                  onClick={() => { setPayAmount(String(netTotal)); setPaymentOpen(true) }}>
                  ชำระเงิน ฿{fmt(netTotal)}
                </Button>
              </div>
            </div>
          </aside>
        </TabsContent>

        {/* ── History Tab ── */}
        <TabsContent value="history" className="flex-1 min-h-0 overflow-y-auto mt-0">
          <div className="flex items-center justify-between mb-3">
            <p className="font-semibold">ประวัติการขาย ({salesHistory?.length ?? 0})</p>
            <Button variant="outline" size="sm" onClick={() => mutateSales()}><RefreshCw className="h-4 w-4 mr-1" />โหลดใหม่</Button>
          </div>
          {histLoading ? (
            <p className="text-center text-muted-foreground py-10">กำลังโหลด...</p>
          ) : !salesHistory?.length ? (
            <div className="flex flex-col items-center py-16 text-muted-foreground">
              <Receipt className="h-12 w-12 mb-2 opacity-20" /><p>ไม่มีประวัติการขาย</p>
            </div>
          ) : (
            <div className="space-y-2">
              {salesHistory.map(s => (
                <div key={s.id} className={`rounded-lg border bg-white p-3 flex items-center gap-3 ${s.status === 'cancelled' ? 'opacity-60' : ''}`}>
                  <div className={`rounded-full p-2 shrink-0 ${s.status === 'cancelled' ? 'bg-red-50' : 'bg-gold-50'}`}>
                    <Receipt className={`h-4 w-4 ${s.status === 'cancelled' ? 'text-red-400' : 'text-gold-600'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold text-sm ${s.status === 'cancelled' ? 'line-through text-gray-400' : ''}`}>{s.sale_number}</p>
                    <p className="text-xs text-muted-foreground">{typeLabel[s.sale_type]} · {s.items.length} รายการ · {format(new Date(s.created_at), 'dd/MM/yy HH:mm')}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-sm">฿{fmt(s.net_total)}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[s.status]}`}>{statusLabel[s.status]}</span>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setDetailSale(s)}><Receipt className="h-4 w-4" /></Button>
                    {s.status !== 'cancelled' && (
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500" onClick={() => handleCancelSale(s.id)}><XCircle className="h-4 w-4" /></Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ── Dialogs ── */}
      <CustomerSearchDialog
        open={customerSearchOpen} onClose={() => setCustomerSearchOpen(false)}
        customers={customers ?? []} searchQ={customerSearchQ} setSearchQ={setCustomerSearchQ}
        onSelect={c => { setSelectedCustomer(c); setCustomerSearchOpen(false); setCustomerSearchQ('') }}
      />
      <EditPriceDialog
        open={editPriceIdx !== null} value={editPriceVal} onChange={setEditPriceVal}
        onClose={() => setEditPriceIdx(null)}
        onSave={() => {
          if (editPriceIdx !== null) {
            setCart(prev => prev.map((item, i) => i === editPriceIdx ? { ...item, unitPrice: parseFloat(editPriceVal) || item.unitPrice } : item))
            setEditPriceIdx(null)
          }
        }}
      />
      <ItemDiscountDialog
        open={itemDiscountIdx !== null} value={itemDiscountVal} discountType={itemDiscountType}
        onValueChange={setItemDiscountVal} onTypeChange={setItemDiscountType}
        onClose={() => setItemDiscountIdx(null)}
        onSave={() => {
          if (itemDiscountIdx !== null) {
            setCart(prev => prev.map((item, i) => i === itemDiscountIdx ? { ...item, discount: parseFloat(itemDiscountVal) || 0, discountType: itemDiscountType } : item))
            setItemDiscountIdx(null)
          }
        }}
      />
      <GlobalDiscountDialog
        open={globalDiscountOpen} value={globalDiscountInput} discountType={globalDiscountTypeInput}
        onValueChange={setGlobalDiscountInput} onTypeChange={setGlobalDiscountTypeInput}
        onClose={() => setGlobalDiscountOpen(false)}
        onSave={() => { setGlobalDiscount(parseFloat(globalDiscountInput) || 0); setGlobalDiscountType(globalDiscountTypeInput); setGlobalDiscountOpen(false) }}
      />
      <PointsDialog
        open={pointsOpen} maxPoints={customerPoints} value={pointsInput} onChange={setPointsInput}
        onClose={() => setPointsOpen(false)}
        onSave={() => { setPointsUsed(Math.min(parseFloat(pointsInput) || 0, customerPoints)); setPointsOpen(false) }}
      />
      <OldGoldDialog
        open={oldGoldOpen} desc={ogDesc} goldType={ogGoldType} weight={ogWeight} price={ogPrice}
        defaultPricePerGram={goldBarBuyPerGram}
        onDescChange={setOgDesc} onGoldTypeChange={setOgGoldType} onWeightChange={setOgWeight} onPriceChange={setOgPrice}
        onClose={() => setOldGoldOpen(false)}
        onAdd={() => {
          const w = parseFloat(ogWeight); const pr = parseFloat(ogPrice)
          if (!w || !pr) return
          setOldGoldItems(prev => [...prev, { description: ogDesc, gold_type: ogGoldType, weight: w, price_per_unit: pr, total: w * pr }])
          setOgDesc(''); setOgWeight(''); setOgPrice(''); setOldGoldOpen(false)
        }}
      />
      <PaymentDialog
        open={paymentOpen} netTotal={netTotal} payMethod={payMethod} payAmount={payAmount}
        onMethodChange={setPayMethod} onAmountChange={setPayAmount}
        onClose={() => setPaymentOpen(false)} onConfirm={completeSale} saving={saving}
      />
      <ReceiptDialog open={receiptOpen} sale={lastSale} onClose={() => setReceiptOpen(false)} />
      <SaleDetailDialog open={!!detailSale} sale={detailSale} onClose={() => setDetailSale(null)} />
    </div>
  )
}
