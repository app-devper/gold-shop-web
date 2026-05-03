'use client'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Customer, Sale } from '@/types/gold'
import { fmt, fmtDec, statusLabel, typeLabel } from './pos-types'
import { format } from 'date-fns'

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
        <div><Label>ราคา (บาท)</Label><Input type="number" value={value} onChange={e => onChange(e.target.value)} /></div>
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
            <Select value={discountType} onValueChange={v => onTypeChange(v as any)}>
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
            <Select value={discountType} onValueChange={v => onTypeChange(v as any)}>
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
export function OldGoldDialog({ open, desc, goldType, weight, price, defaultPricePerGram, onDescChange, onGoldTypeChange, onWeightChange, onPriceChange, onClose, onAdd }: {
  open: boolean; desc: string; goldType: string; weight: string; price: string
  defaultPricePerGram?: number
  onDescChange: (v: string) => void; onGoldTypeChange: (v: string) => void
  onWeightChange: (v: string) => void; onPriceChange: (v: string) => void
  onClose: () => void; onAdd: () => void
}) {
  const total = parseFloat(weight) * parseFloat(price)
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
          {weight && price && !isNaN(total) && <p className="text-sm font-semibold text-gold-700">มูลค่ารวม: ฿{fmt(total)}</p>}
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
          <div className="space-y-1">
            {sale.items.map((item, i) => (
              <div key={i} className="flex justify-between">
                <div className="flex-1 min-w-0">
                  <p className="truncate">{item.product_name}</p>
                  <p className="text-xs text-muted-foreground">{fmtDec(item.weight)}g · {item.gold_type}</p>
                </div>
                <span className="font-medium ml-2">฿{fmt(item.total)}</span>
              </div>
            ))}
          </div>
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
          <div className="rounded border divide-y">
            {sale.items.map((item, i) => (
              <div key={i} className="flex justify-between px-3 py-2">
                <div><p className="font-medium">{item.product_name}</p><p className="text-xs text-muted-foreground">{item.gold_type} · {fmtDec(item.weight)}g</p></div>
                <p className="font-medium">฿{fmt(item.total)}</p>
              </div>
            ))}
          </div>
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
