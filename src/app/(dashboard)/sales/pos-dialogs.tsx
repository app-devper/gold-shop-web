'use client'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Customer, Sale, Product, ProductItem, ProductKind, OldGoldCondition } from '@/types/gold'
import { OLD_GOLD_CONDITION_LABELS } from '@/types/gold'
import { fmt, fmtDec, calcGoldPrice, statusLabel, typeLabel } from './pos-types'
import { format } from 'date-fns'

type DialogDiscountType = 'amount' | 'percent'

// ─── Product Item Picker (piece-based products) ──────────────────────────────
// Shows the list of available physical items for a product so the cashier can
// pick which exact piece is being sold (each piece has its own barcode and
// possibly different weight / labor cost).
export function ProductItemPickerDialog({
  product, open, onClose, onPick, goldSellPricePerBaht,
}: {
  product: Product | null
  open: boolean
  onClose: () => void
  onPick: (item: ProductItem) => void
  goldSellPricePerBaht: number
}) {
  const items = product?.items ?? []
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>เลือกชิ้น — {product?.name}</DialogTitle>
        </DialogHeader>
        {items.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground text-sm">ไม่มีสินค้าคงเหลือ</p>
        ) : (
          <div className="max-h-80 overflow-y-auto divide-y rounded-md border">
            {items.map(item => {
              const price = calcGoldPrice(item.weight_grams, item.labor_cost, goldSellPricePerBaht, product?.kind)
              return (
                <button
                  key={item.id}
                  onClick={() => onPick(item)}
                  className="w-full text-left px-3 py-2.5 hover:bg-gold-50 transition-colors flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="font-mono text-xs text-muted-foreground">{item.barcode}</p>
                    <p className="text-sm">
                      {fmtDec(item.weight_grams)} g
                      {item.labor_cost > 0 && <span className="text-muted-foreground"> · ค่ากำเหน็จ ฿{fmt(item.labor_cost)}</span>}
                    </p>
                  </div>
                  <p className="font-bold text-gold-700 shrink-0">฿{fmt(price > 0 ? price : 0)}</p>
                </button>
              )
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ─── Customer Search ──────────────────────────────────────────────────────────
export function CustomerSearchDialog({ open, onClose, customers, searchQ, setSearchQ, onSelect }: {
  open: boolean; onClose: () => void
  customers: Customer[]; searchQ: string; setSearchQ: (v: string) => void
  onSelect: (c: Customer) => void
}) {
  const filtered = customers.filter(c =>
    c.full_name.toLowerCase().includes(searchQ.toLowerCase()) || c.phone?.includes(searchQ)
  )
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>เลือกลูกค้า</DialogTitle></DialogHeader>
        <Input placeholder="ค้นหาชื่อ, เบอร์โทร..." value={searchQ} onChange={e => setSearchQ(e.target.value)} />
        <div className="max-h-64 overflow-y-auto space-y-1 mt-2">
          {filtered.map(c => (
            <button key={c.id} onClick={() => onSelect(c)}
              className="w-full text-left rounded-lg px-3 py-2 hover:bg-gold-50 border transition-colors">
              <p className="font-semibold text-sm">{c.full_name}</p>
              <p className="text-xs text-muted-foreground">{c.phone}{c.membership ? ` · ${c.membership.points} คะแนน` : ''}</p>
            </button>
          ))}
          {filtered.length === 0 && <p className="text-center text-muted-foreground text-sm py-4">ไม่พบลูกค้า</p>}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Edit Price ───────────────────────────────────────────────────────────────
export function EditPriceDialog({ open, value, onChange, onClose, onSave }: {
  open: boolean; value: string; onChange: (v: string) => void; onClose: () => void; onSave: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader><DialogTitle>แก้ไขราคา</DialogTitle></DialogHeader>
        <div><Label>ราคาก่อนส่วนลด รวมค่ากำเหน็จ (บาท)</Label><Input type="number" value={value} onChange={e => onChange(e.target.value)} /></div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>ยกเลิก</Button>
          <Button onClick={onSave}>บันทึก</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Item Discount ────────────────────────────────────────────────────────────
export function ItemDiscountDialog({ open, value, discountType, onValueChange, onTypeChange, onClose, onSave }: {
  open: boolean; value: string; discountType: 'amount' | 'percent'
  onValueChange: (v: string) => void; onTypeChange: (v: 'amount' | 'percent') => void
  onClose: () => void; onSave: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader><DialogTitle>ส่วนลดรายชิ้น</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>ประเภทส่วนลด</Label>
            <Select value={discountType} onValueChange={v => onTypeChange(v as DialogDiscountType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="amount">จำนวนเงิน (บาท)</SelectItem>
                <SelectItem value="percent">เปอร์เซ็นต์ (%)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label>ส่วนลด</Label><Input type="number" min="0" value={value} onChange={e => { const v = e.target.value; if (v && parseFloat(v) < 0) return; onValueChange(v) }} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>ยกเลิก</Button>
          <Button onClick={onSave}>บันทึก</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Global Discount ──────────────────────────────────────────────────────────
export function GlobalDiscountDialog({ open, value, discountType, onValueChange, onTypeChange, onClose, onSave }: {
  open: boolean; value: string; discountType: 'amount' | 'percent'
  onValueChange: (v: string) => void; onTypeChange: (v: 'amount' | 'percent') => void
  onClose: () => void; onSave: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader><DialogTitle>ส่วนลดท้ายบิล</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>ประเภทส่วนลด</Label>
            <Select value={discountType} onValueChange={v => onTypeChange(v as DialogDiscountType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="amount">จำนวนเงิน (บาท)</SelectItem>
                <SelectItem value="percent">เปอร์เซ็นต์ (%)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label>ส่วนลด</Label><Input type="number" min="0" value={value} onChange={e => { const v = e.target.value; if (v && parseFloat(v) < 0) return; onValueChange(v) }} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>ยกเลิก</Button>
          <Button onClick={onSave}>บันทึก</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Points ───────────────────────────────────────────────────────────────────
export function PointsDialog({ open, maxPoints, value, onChange, onClose, onSave }: {
  open: boolean; maxPoints: number; value: string; onChange: (v: string) => void; onClose: () => void; onSave: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader><DialogTitle>ใช้คะแนนสะสม</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">คะแนนที่มี: <span className="font-bold text-foreground">{maxPoints} คะแนน</span></p>
          <div><Label>จำนวนคะแนนที่ต้องการใช้</Label><Input type="number" max={maxPoints} value={value} onChange={e => onChange(e.target.value)} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>ยกเลิก</Button>
          <Button onClick={onSave}>บันทึก</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Old Gold ─────────────────────────────────────────────────────────────────
export function OldGoldDialog({
  open, desc, goldType, kind, condition, weight, price, deductionPercent, defaultPricePerGram,
  onDescChange, onGoldTypeChange, onKindChange, onConditionChange, onWeightChange, onPriceChange, onDeductionPercentChange, onClose, onAdd,
}: {
  open: boolean; desc: string; goldType: string; kind: ProductKind; condition: OldGoldCondition
  weight: string; price: string; deductionPercent: string
  defaultPricePerGram?: number
  onDescChange: (v: string) => void; onGoldTypeChange: (v: string) => void
  onKindChange: (v: ProductKind) => void
  onConditionChange: (v: OldGoldCondition) => void
  onWeightChange: (v: string) => void; onPriceChange: (v: string) => void
  onDeductionPercentChange: (v: string) => void
  onClose: () => void; onAdd: () => void
}) {
  const pricePerGram = parseFloat(price) || defaultPricePerGram || 0
  const grossTotal = (parseFloat(weight) || 0) * pricePerGram
  const deduction = grossTotal * ((parseFloat(deductionPercent) || 0) / 100)
  const total = Math.max(0, grossTotal - deduction)
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader><DialogTitle>เพิ่มทองเก่า</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>รายละเอียด</Label><Input value={desc} onChange={e => onDescChange(e.target.value)} placeholder="เช่น สร้อยคอ 96.5%" /></div>
          <div><Label>ประเภททอง</Label>
            <Select value={goldType} onValueChange={onGoldTypeChange}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{['99.99%', '96.5%', '90%', '75%'].map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>รูปแบบ</Label>
            <Select value={kind} onValueChange={v => onKindChange(v as ProductKind)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ornament">ทองรูปพรรณ</SelectItem>
                <SelectItem value="bar">ทองแท่ง</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label>สภาพ</Label>
            <Select value={condition} onValueChange={v => onConditionChange(v as OldGoldCondition)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(OLD_GOLD_CONDITION_LABELS) as OldGoldCondition[]).map(k => (
                  <SelectItem key={k} value={k}>{OLD_GOLD_CONDITION_LABELS[k]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div><Label>น้ำหนัก (กรัม)</Label><Input type="number" value={weight} onChange={e => onWeightChange(e.target.value)} /></div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <Label>ราคารับซื้อ/กรัม (บาท)</Label>
              {defaultPricePerGram && defaultPricePerGram > 0 && (
                <button type="button" onClick={() => onPriceChange(String(Math.round(defaultPricePerGram)))}
                  className="text-xs text-gold-600 hover:text-gold-800 underline">
                  ใช้ราคาปัจจุบัน (฿{Math.round(defaultPricePerGram).toLocaleString('th-TH')})
                </button>
              )}
            </div>
            <Input type="number" value={price} onChange={e => onPriceChange(e.target.value)}
              placeholder={defaultPricePerGram ? String(Math.round(defaultPricePerGram)) : ''} />
          </div>
          <div><Label>เปอร์เซ็นต์หักร้าน (%)</Label><Input type="number" min={0} max={100} value={deductionPercent} onChange={e => onDeductionPercentChange(e.target.value)} /></div>
          {weight && pricePerGram > 0 && !isNaN(total) && (
            <div className="rounded-lg border bg-muted/40 p-3 text-sm space-y-1">
              <div className="flex justify-between text-muted-foreground"><span>มูลค่าก่อนหัก</span><span>฿{fmt(grossTotal)}</span></div>
              {deduction > 0 && <div className="flex justify-between text-orange-600"><span>หักร้าน</span><span>-฿{fmt(deduction)}</span></div>}
              <div className="flex justify-between font-semibold text-gold-700 border-t pt-1"><span>ราคารับซื้อสุทธิ</span><span>฿{fmt(total)}</span></div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>ยกเลิก</Button>
          <Button onClick={onAdd}>เพิ่ม</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Payment ──────────────────────────────────────────────────────────────────
export function PaymentDialog({ open, netTotal, payMethod, payAmount, onMethodChange, onAmountChange, onClose, onConfirm, saving }: {
  open: boolean; netTotal: number; payMethod: string; payAmount: string
  onMethodChange: (v: 'cash' | 'transfer' | 'credit_card') => void
  onAmountChange: (v: string) => void; onClose: () => void; onConfirm: () => void; saving: boolean
}) {
  const methods: { key: 'cash' | 'transfer' | 'credit_card'; label: string }[] = [
    { key: 'cash', label: 'เงินสด' }, { key: 'transfer', label: 'โอนเงิน' }, { key: 'credit_card', label: 'บัตรเครดิต' },
  ]
  const paid = parseFloat(payAmount) || 0
  const change = paid - netTotal
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader><DialogTitle>ชำระเงิน</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="rounded-lg bg-gold-50 border border-gold-200 p-3 text-center">
            <p className="text-sm text-muted-foreground">ยอดที่ต้องชำระ</p>
            <p className="text-3xl font-bold text-gold-700">฿{fmt(netTotal)}</p>
          </div>
          <div>
            <Label className="mb-2 block">ช่องทางชำระเงิน</Label>
            <div className="grid grid-cols-3 gap-2">
              {methods.map(m => (
                <button key={m.key} onClick={() => onMethodChange(m.key)}
                  className={`py-2 text-xs font-medium rounded-lg border transition-colors ${payMethod === m.key ? 'bg-gold-500 text-white border-gold-500' : 'border-gray-200 hover:bg-gray-50'}`}>
                  {m.label}
                </button>
              ))}
            </div>
          </div>
          {payMethod === 'cash' && (
            <div>
              <Label>รับเงินมา (บาท)</Label>
              <Input type="number" value={payAmount} onChange={e => onAmountChange(e.target.value)} />
              {change >= 0 && <p className="text-sm text-green-600 mt-1 font-semibold">เงินทอน: ฿{fmt(change)}</p>}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>ยกเลิก</Button>
          <Button className="bg-gold-500 hover:bg-gold-600 text-white" onClick={onConfirm} disabled={saving}>
            {saving ? 'กำลังบันทึก...' : 'ยืนยันการชำระเงิน'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Receipt ──────────────────────────────────────────────────────────────────
export function ReceiptDialog({ open, sale, onClose }: { open: boolean; sale: Sale | null; onClose: () => void }) {
  if (!sale) return null
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader><DialogTitle>ใบเสร็จรับเงิน</DialogTitle></DialogHeader>
        <div className="space-y-3 text-sm">
          <div className="text-center border-b pb-3">
            <p className="font-bold text-lg">ร้านทอง</p>
            <p className="text-muted-foreground text-xs">{format(new Date(sale.created_at), 'dd/MM/yyyy HH:mm')}</p>
            <p className="font-mono text-xs mt-1">#{sale.sale_number}</p>
          </div>
          {sale.gold_price && (
            <div className="rounded-md bg-gold-50 border border-gold-100 p-2 text-xs text-muted-foreground">
              <p className="font-semibold text-gold-700">ราคาทองที่ใช้ในบิล</p>
              <p>แท่งขาย ฿{fmt(sale.gold_price.gold_bar_sell)} · รูปพรรณขาย ฿{fmt(sale.gold_price.gold_ornament_sell)}</p>
            </div>
          )}
          <div className="space-y-1">
            {sale.items.map((item, i) => (
              <div key={i} className="flex justify-between">
                <div className="flex-1 min-w-0">
                  <p className="truncate">{item.product_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {fmtDec(item.weight)}g · {item.gold_type}
                    {item.barcode && <span className="font-mono"> · {item.barcode}</span>}
                  </p>
                  <p className="text-[11px] text-muted-foreground">ทอง ฿{fmt(item.unit_price ?? 0)} · กำเหน็จ ฿{fmt(item.labor_cost ?? 0)}</p>
                </div>
                <span className="font-medium ml-2">฿{fmt(item.total)}</span>
              </div>
            ))}
          </div>
          {sale.old_gold_items?.length > 0 && (
            <div className="border-t pt-2 space-y-1">
              <p className="font-semibold text-xs text-orange-700">ทองเก่าที่รับซื้อ</p>
              {sale.old_gold_items.map((item, i) => (
                <div key={i} className="flex justify-between text-xs">
                  <span className="truncate">{item.description || `${item.gold_type} ${fmtDec(item.weight)}g`}</span>
                  <span>฿{fmt(item.total)}</span>
                </div>
              ))}
            </div>
          )}
          <div className="border-t pt-2 space-y-1">
            <div className="flex justify-between text-muted-foreground"><span>ยอดรวม</span><span>฿{fmt(sale.subtotal)}</span></div>
            {sale.discount > 0 && <div className="flex justify-between text-red-600"><span>ส่วนลด</span><span>-฿{fmt(sale.discount)}</span></div>}
            {sale.old_gold_value > 0 && <div className="flex justify-between text-orange-600"><span>ทองเก่า</span><span>-฿{fmt(sale.old_gold_value)}</span></div>}
            {sale.points_used > 0 && <div className="flex justify-between text-blue-600"><span>คะแนน</span><span>-฿{fmt(sale.points_used)}</span></div>}
            <div className="flex justify-between font-bold text-base border-t pt-1"><span>ยอดสุทธิ</span><span className="text-gold-700">฿{fmt(sale.net_total)}</span></div>
          </div>
          {sale.points_earned > 0 && <p className="text-center text-xs text-green-600">ได้รับคะแนน {sale.points_earned} คะแนน</p>}
        </div>
        <DialogFooter>
          <Button className="w-full" onClick={onClose}>ปิด</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Sale Detail ──────────────────────────────────────────────────────────────
export function SaleDetailDialog({ open, sale, onClose }: { open: boolean; sale: Sale | null; onClose: () => void }) {
  if (!sale) return null
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>รายละเอียดการขาย #{sale.sale_number}</DialogTitle></DialogHeader>
        <div className="space-y-3 text-sm">
          <div className="grid grid-cols-3 gap-2 text-muted-foreground">
            <div><span className="font-medium text-foreground">ประเภท:</span> {typeLabel[sale.sale_type]}</div>
            <div><span className="font-medium text-foreground">สถานะ:</span> {statusLabel[sale.status]}</div>
            <div><span className="font-medium text-foreground">วันที่:</span> {format(new Date(sale.created_at), 'dd/MM/yyyy')}</div>
          </div>
          {sale.gold_price && (
            <div className="rounded border bg-gold-50/60 p-3 text-xs">
              <p className="font-semibold text-gold-700 mb-1">Snapshot ราคาทอง</p>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-muted-foreground">
                <span>แท่งรับซื้อ ฿{fmt(sale.gold_price.gold_bar_buy)}</span>
                <span>แท่งขาย ฿{fmt(sale.gold_price.gold_bar_sell)}</span>
                <span>รูปพรรณรับซื้อ ฿{fmt(sale.gold_price.gold_ornament_buy)}</span>
                <span>รูปพรรณขาย ฿{fmt(sale.gold_price.gold_ornament_sell)}</span>
              </div>
            </div>
          )}
          <div className="rounded border divide-y">
            {sale.items.map((item, i) => (
              <div key={i} className="flex justify-between px-3 py-2">
                <div>
                  <p className="font-medium">{item.product_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.gold_type} · {fmtDec(item.weight)}g
                    {item.barcode && <span className="font-mono"> · {item.barcode}</span>}
                  </p>
                  <p className="text-[11px] text-muted-foreground">ทอง ฿{fmt(item.unit_price ?? 0)} · กำเหน็จ ฿{fmt(item.labor_cost ?? 0)} · ฿{fmt(item.price_per_gram ?? 0)}/g</p>
                </div>
                <p className="font-medium">฿{fmt(item.total)}</p>
              </div>
            ))}
          </div>
          {sale.old_gold_items?.length > 0 && (
            <div className="rounded border divide-y">
              {sale.old_gold_items.map((item, i) => (
                <div key={i} className="flex justify-between px-3 py-2">
                  <div>
                    <p className="font-medium">{item.description || 'ทองเก่า'}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.kind === 'bar' ? 'ทองแท่ง' : 'รูปพรรณ'} · {item.gold_type} · {fmtDec(item.weight)}g · หัก {item.deduction_percent ?? 0}%
                    </p>
                  </div>
                  <p className="font-medium text-orange-700">฿{fmt(item.total)}</p>
                </div>
              ))}
            </div>
          )}
          <div className="rounded border p-3 space-y-1">
            <div className="flex justify-between"><span>ยอดรวม</span><span>฿{fmt(sale.subtotal)}</span></div>
            {sale.discount > 0 && <div className="flex justify-between text-red-600"><span>ส่วนลด</span><span>-฿{fmt(sale.discount)}</span></div>}
            {sale.old_gold_value > 0 && <div className="flex justify-between text-orange-600"><span>ทองเก่า</span><span>-฿{fmt(sale.old_gold_value)}</span></div>}
            <div className="flex justify-between font-bold border-t pt-1"><span>ยอดสุทธิ</span><span>฿{fmt(sale.net_total)}</span></div>
          </div>
        </div>
        <DialogFooter><Button variant="outline" onClick={onClose}>ปิด</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
