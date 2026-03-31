'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import { Plus, X, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'

import { pawnApi, customerApi } from '@/lib/gold-api'
import type { Customer } from '@/types/gold'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface PawnItemForm {
  description: string
  gold_type: string
  weight: string
  appraised_value: string
}

const fmt = (n: number) => new Intl.NumberFormat('th-TH', { maximumFractionDigits: 0 }).format(n)

export default function PawnCreatePage() {
  const router = useRouter()
  const { data: customers } = useSWR<Customer[]>('customers', () => customerApi.list())

  const [customerSearchQ, setCustomerSearchQ] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [items, setItems] = useState<PawnItemForm[]>([{ description: '', gold_type: '96.5%', weight: '', appraised_value: '' }])
  const [principal, setPrincipal] = useState('')
  const [interestRate, setInterestRate] = useState('1.5')
  const [termMonths, setTermMonths] = useState('3')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const filteredCustomers = customers?.filter(c =>
    c.full_name.toLowerCase().includes(customerSearchQ.toLowerCase()) || c.phone?.includes(customerSearchQ)
  ) ?? []

  const addItem = () => setItems(prev => [...prev, { description: '', gold_type: '96.5%', weight: '', appraised_value: '' }])
  const removeItem = (idx: number) => setItems(prev => prev.filter((_, i) => i !== idx))
  const updateItem = (idx: number, field: keyof PawnItemForm, value: string) =>
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item))

  const totalAppraisedValue = items.reduce((s, i) => s + (parseFloat(i.appraised_value) || 0), 0)

  const handleSubmit = async () => {
    if (!selectedCustomer) { toast.error('กรุณาเลือกลูกค้า'); return }
    if (items.some(i => !i.description || !i.weight || !i.appraised_value)) { toast.error('กรุณากรอกข้อมูลรายการทองให้ครบ'); return }
    if (!principal) { toast.error('กรุณากรอกจำนวนเงินต้น'); return }

    const payload = {
      customer_id: selectedCustomer.id,
      items: items.map(i => ({
        description: i.description,
        gold_type: i.gold_type,
        weight: parseFloat(i.weight),
        appraised_value: parseFloat(i.appraised_value),
        images: [],
      })),
      principal: parseFloat(principal),
      interest_rate: parseFloat(interestRate),
      term_months: parseInt(termMonths),
      notes,
    }
    try {
      setSaving(true)
      await pawnApi.create(payload)
      toast.success('บันทึกการรับจำนำสำเร็จ')
      router.push('/pawns')
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'เกิดข้อผิดพลาด')
    } finally { setSaving(false) }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="h-5 w-5" /></Button>
        <h1 className="text-2xl font-bold">รับจำนำใหม่</h1>
      </div>

      {/* Customer */}
      <Card>
        <CardHeader><CardTitle className="text-base">ข้อมูลลูกค้า</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {selectedCustomer ? (
            <div className="flex items-center gap-3 rounded-lg bg-yellow-50 border border-yellow-200 px-4 py-3">
              <div className="flex-1">
                <p className="font-semibold">{selectedCustomer.full_name}</p>
                <p className="text-sm text-muted-foreground">{selectedCustomer.phone} · {selectedCustomer.id_card ?? 'ไม่มีบัตรประชาชน'}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedCustomer(null)}><X className="h-4 w-4" /></Button>
            </div>
          ) : (
            <div className="space-y-2">
              <Input placeholder="ค้นหาลูกค้า (ชื่อ, เบอร์โทร)..." value={customerSearchQ} onChange={e => setCustomerSearchQ(e.target.value)} />
              {customerSearchQ && (
                <div className="rounded-lg border divide-y max-h-48 overflow-y-auto">
                  {filteredCustomers.length === 0 ? (
                    <p className="text-center text-sm text-muted-foreground py-4">ไม่พบลูกค้า</p>
                  ) : filteredCustomers.map(c => (
                    <button key={c.id} onClick={() => { setSelectedCustomer(c); setCustomerSearchQ('') }}
                      className="w-full text-left px-4 py-2.5 hover:bg-yellow-50 transition-colors">
                      <p className="font-medium text-sm">{c.full_name}</p>
                      <p className="text-xs text-muted-foreground">{c.phone}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pawn Items */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">รายการทองจำนำ</CardTitle>
          <Button variant="outline" size="sm" onClick={addItem}><Plus className="h-4 w-4 mr-1" />เพิ่มรายการ</Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {items.map((item, idx) => (
            <div key={idx} className="rounded-lg border p-4 space-y-3 relative">
              {items.length > 1 && (
                <button onClick={() => removeItem(idx)} className="absolute top-3 right-3 text-gray-400 hover:text-red-500">
                  <X className="h-4 w-4" />
                </button>
              )}
              <p className="text-sm font-semibold text-muted-foreground">รายการที่ {idx + 1}</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <Label>รายละเอียด</Label>
                  <Input value={item.description} onChange={e => updateItem(idx, 'description', e.target.value)} placeholder="เช่น สร้อยคอทอง 2 บาท" />
                </div>
                <div>
                  <Label>ประเภททอง</Label>
                  <Select value={item.gold_type} onValueChange={v => updateItem(idx, 'gold_type', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['99.99%', '96.5%', '90%', '75%'].map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>น้ำหนัก (กรัม)</Label>
                  <Input type="number" value={item.weight} onChange={e => updateItem(idx, 'weight', e.target.value)} />
                </div>
                <div className="col-span-2">
                  <Label>ราคาประเมิน (บาท)</Label>
                  <Input type="number" value={item.appraised_value} onChange={e => updateItem(idx, 'appraised_value', e.target.value)} />
                </div>
              </div>
            </div>
          ))}
          {totalAppraisedValue > 0 && (
            <p className="text-sm font-semibold text-yellow-700 text-right">ราคาประเมินรวม: ฿{fmt(totalAppraisedValue)}</p>
          )}
        </CardContent>
      </Card>

      {/* Terms */}
      <Card>
        <CardHeader><CardTitle className="text-base">เงื่อนไขการจำนำ</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Label>เงินต้น (บาท)</Label>
            <Input type="number" value={principal} onChange={e => setPrincipal(e.target.value)} placeholder="จำนวนเงินที่ให้ยืม" />
          </div>
          <div>
            <Label>อัตราดอกเบี้ย (%/เดือน)</Label>
            <Input type="number" step="0.1" value={interestRate} onChange={e => setInterestRate(e.target.value)} />
          </div>
          <div>
            <Label>ระยะเวลา (เดือน)</Label>
            <Input type="number" min="1" value={termMonths} onChange={e => setTermMonths(e.target.value)} />
          </div>
          {principal && interestRate && termMonths && (
            <div className="col-span-2 rounded-lg bg-yellow-50 border border-yellow-200 p-3 text-sm space-y-1">
              <div className="flex justify-between"><span className="text-muted-foreground">เงินต้น</span><span className="font-semibold">฿{fmt(parseFloat(principal) || 0)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">ดอกเบี้ย/เดือน</span><span className="font-semibold">฿{fmt((parseFloat(principal) || 0) * (parseFloat(interestRate) || 0) / 100)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">ดอกเบี้ยรวม ({termMonths} เดือน)</span><span className="font-semibold">฿{fmt((parseFloat(principal) || 0) * (parseFloat(interestRate) || 0) / 100 * parseInt(termMonths))}</span></div>
            </div>
          )}
          <div className="col-span-2">
            <Label>หมายเหตุ</Label>
            <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="หมายเหตุเพิ่มเติม (ถ้ามี)" />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3 justify-end">
        <Button variant="outline" onClick={() => router.back()}>ยกเลิก</Button>
        <Button onClick={handleSubmit} disabled={saving} className="bg-yellow-500 hover:bg-yellow-600 text-white px-8">
          {saving ? 'กำลังบันทึก...' : 'บันทึกการรับจำนำ'}
        </Button>
      </div>
    </div>
  )
}
