'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { format } from 'date-fns'
import { Eye, MoreHorizontal, PiggyBank, Scale, Plus } from 'lucide-react'
import { toast } from 'sonner'

import { goldSavingApi, customerApi, goldPriceApi } from '@/lib/gold-api'
import type { GoldSaving, Customer } from '@/types/gold'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const statusColor: Record<string, string> = { active: 'bg-green-100 text-green-700', closed: 'bg-gray-100 text-gray-500' }
const statusLabel: Record<string, string> = { active: 'เปิดใช้งาน', closed: 'ปิดบัญชีแล้ว' }
const savingTypeLabel: Record<string, string> = { weight: 'ออมทอง (กรัม)', money: 'ออมเงิน (บาท)' }
const txTypeLabel: Record<string, string> = { deposit: 'ฝาก', withdraw: 'ถอน' }
const fmt = (n: number) => new Intl.NumberFormat('th-TH', { maximumFractionDigits: 4 }).format(n)
const fmtCash = (n: number) => new Intl.NumberFormat('th-TH', { maximumFractionDigits: 0 }).format(n)
const BAHT_GRAM = 15.244

export default function GoldSavingsPage() {
  const { data: accounts, isLoading, mutate } = useSWR<GoldSaving[]>('gold-savings', goldSavingApi.list)
  const { data: customers } = useSWR<Customer[]>('customers', () => customerApi.list())
  const { data: currentGoldPrice } = useSWR('gold-price-current', () => goldPriceApi.current())
  const [detail, setDetail] = useState<GoldSaving | null>(null)
  const [actionDialog, setActionDialog] = useState<{ type: 'deposit' | 'withdraw'; account: GoldSaving } | null>(null)
  const [openAccountOpen, setOpenAccountOpen] = useState(false)
  const [amount, setAmount] = useState('')
  const [inputMode, setInputMode] = useState<'weight' | 'cash' | 'baht'>('weight')
  const [saving, setSaving] = useState(false)
  const [newCustomerQ, setNewCustomerQ] = useState('')
  const [newCustomer, setNewCustomer] = useState<Customer | null>(null)
  const [newSavingType, setNewSavingType] = useState<'weight' | 'money'>('weight')

  const getCustomerName = (id: string) => customers?.find(c => c.id === id)?.full_name ?? id
  // ราคา/บาท (หน่วยทอง) และ ราคา/กรัม
  const goldBuyPricePerBaht = currentGoldPrice?.gold_ornament_buy ?? 0
  const goldBuyPricePerGram = goldBuyPricePerBaht > 0 ? goldBuyPricePerBaht / BAHT_GRAM : 0
  const activeAccounts = accounts?.filter(a => a.status === 'active') ?? []
  const totalGoldBalance = activeAccounts.reduce((s, a) => s + a.gold_balance, 0)
  const totalCashBalance = activeAccounts.reduce((s, a) => s + a.cash_balance, 0)
  // alias สำหรับ UI เดิม
  const goldBuyPrice = goldBuyPricePerBaht
  const goldPricePerGram = goldBuyPricePerGram
  const amountNum = parseFloat(amount) || 0

  // แปลงทุก input mode → กรัม (ส่ง API)
  // สูตร: กรัม = บาท(ทอง) × 15.244
  //        กรัม = เงิน(฿) ÷ ราคา/กรัม
  const goldGrams = inputMode === 'cash'
    ? (goldBuyPricePerGram > 0 ? amountNum / goldBuyPricePerGram : 0)
    : inputMode === 'baht'
    ? amountNum * BAHT_GRAM
    : amountNum

  // มูลค่าเงิน = กรัม × ราคา/กรัม  (= บาท(ทอง) × ราคา/บาท)
  const cashValue = goldGrams * goldBuyPricePerGram
  // บาท(ทอง) = กรัม ÷ 15.244
  const bahtValue = goldGrams / BAHT_GRAM
  const filteredNewCustomers = customers?.filter(c =>
    c.full_name.toLowerCase().includes(newCustomerQ.toLowerCase()) || c.phone?.includes(newCustomerQ)
  ) ?? []

  const handleAction = async () => {
    if (!actionDialog) return
    try {
      setSaving(true)
      const { type, account } = actionDialog
      const sendAmount = goldGrams
      if (type === 'deposit') { await goldSavingApi.deposit(account.id, { amount: sendAmount }); toast.success('ฝากทองสำเร็จ') }
      else { await goldSavingApi.withdraw(account.id, { amount: sendAmount }); toast.success('ถอนทองสำเร็จ') }
      mutate(); setActionDialog(null); setAmount('')
    } catch (e: any) { toast.error(e.response?.data?.message || 'เกิดข้อผิดพลาด') }
    finally { setSaving(false) }
  }

  const handleOpenAccount = async () => {
    if (!newCustomer) { toast.error('กรุณาเลือกลูกค้า'); return }
    try {
      setSaving(true)
      await goldSavingApi.open({ customer_id: newCustomer.id, saving_type: newSavingType })
      toast.success('เปิดบัญชีออมทองสำเร็จ')
      mutate(); setOpenAccountOpen(false); setNewCustomer(null); setNewCustomerQ('')
    } catch (e: any) { toast.error(e.response?.data?.message || 'เกิดข้อผิดพลาด') }
    finally { setSaving(false) }
  }

  const handleClose = async (id: string) => {
    if (!confirm('ยืนยันปิดบัญชีออมทอง?')) return
    try { await goldSavingApi.close(id); toast.success('ปิดบัญชีแล้ว'); mutate() }
    catch (e: any) { toast.error(e.response?.data?.message || 'เกิดข้อผิดพลาด') }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">ออมทอง</h1>
        <Button onClick={() => setOpenAccountOpen(true)} className="bg-yellow-500 hover:bg-yellow-600 text-white">
          <Plus className="h-4 w-4 mr-2" />เปิดบัญชีใหม่
        </Button>
      </div>

      {/* Gold price info bar */}
      {currentGoldPrice && (
        <div className="rounded-xl p-4 text-white flex flex-wrap gap-4 items-center" style={{ background: 'linear-gradient(135deg, #b8860b 0%, #daa520 50%, #b8860b 100%)' }}>
          <div className="flex items-center gap-2">
            <span className="text-lg">💎</span>
            <span className="font-semibold text-sm">ราคาทองปัจจุบัน</span>
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            <div><p className="text-white/70 text-xs">รับซื้อ/บาท</p><p className="font-bold">฿{fmtCash(goldBuyPrice)}</p></div>
            <div><p className="text-white/70 text-xs">รับซื้อ/กรัม</p><p className="font-bold">฿{fmtCash(Math.round(goldPricePerGram))}</p></div>
            <div><p className="text-white/70 text-xs">1 บาททอง</p><p className="font-bold">{BAHT_GRAM} กรัม</p></div>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="pt-5">
          <div className="inline-flex rounded-lg p-2 mb-3 bg-yellow-500"><PiggyBank className="h-5 w-5 text-white" /></div>
          <p className="text-2xl font-bold">{activeAccounts.length}</p>
          <p className="text-sm text-muted-foreground">บัญชีที่เปิดอยู่</p>
        </CardContent></Card>
        <Card><CardContent className="pt-5">
          <div className="inline-flex rounded-lg p-2 mb-3 bg-yellow-600"><Scale className="h-5 w-5 text-white" /></div>
          <p className="text-2xl font-bold">{fmt(totalGoldBalance / BAHT_GRAM)} บาททอง</p>
          <p className="text-xs text-muted-foreground">{fmt(totalGoldBalance)} g</p>
          <p className="text-sm text-muted-foreground mt-1">ยอดทองรวม</p>
        </CardContent></Card>
        <Card><CardContent className="pt-5">
          <div className="inline-flex rounded-lg p-2 mb-3 bg-green-500"><PiggyBank className="h-5 w-5 text-white" /></div>
          <p className="text-2xl font-bold">฿{fmtCash(totalCashBalance)}</p>
          <p className="text-sm text-muted-foreground">ยอดเงินรวม</p>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>บัญชีออมทองทั้งหมด ({accounts?.length ?? 0})</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? <div className="py-10 text-center text-muted-foreground">กำลังโหลด...</div> : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>เลขบัญชี</TableHead><TableHead>ลูกค้า</TableHead><TableHead>ประเภท</TableHead>
                    <TableHead>ยอดทอง (บาททอง)</TableHead><TableHead>ยอดเงิน</TableHead>
                    <TableHead>สถานะ</TableHead><TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!accounts?.length ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">ไม่มีบัญชี</TableCell></TableRow>
                  ) : accounts.map(a => (
                    <TableRow key={a.id}>
                      <TableCell className="font-mono font-medium">{a.account_number}</TableCell>
                      <TableCell>{getCustomerName(a.customer_id)}</TableCell>
                      <TableCell>{savingTypeLabel[a.saving_type] ?? a.saving_type}</TableCell>
                      <TableCell className="font-medium text-yellow-700">
                        <p>{fmt(a.gold_balance / BAHT_GRAM)} บาททอง</p>
                        <p className="text-xs text-yellow-600/70">{fmt(a.gold_balance)} g</p>
                      </TableCell>
                      <TableCell>฿{fmtCash(a.cash_balance)}</TableCell>
                      <TableCell><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[a.status]}`}>{statusLabel[a.status] ?? a.status}</span></TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setDetail(a)}><Eye className="mr-2 h-4 w-4" />ดูรายการเคลื่อนไหว</DropdownMenuItem>
                            {a.status === 'active' && (<>
                              <DropdownMenuItem onClick={() => { setActionDialog({ type: 'deposit', account: a }); setAmount(''); setInputMode('weight') }}>ฝากทอง</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => { setActionDialog({ type: 'withdraw', account: a }); setAmount(''); setInputMode('weight') }}>ถอนทอง</DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600" onClick={() => handleClose(a.id)}>ปิดบัญชี</DropdownMenuItem>
                            </>)}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Statement Dialog */}
      <Dialog open={!!detail} onOpenChange={() => setDetail(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>บัญชี #{detail?.account_number}</DialogTitle></DialogHeader>
          {detail && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><p className="text-xs text-muted-foreground">ลูกค้า</p><p className="font-semibold">{getCustomerName(detail.customer_id)}</p></div>
                <div><p className="text-xs text-muted-foreground">ประเภท</p><p className="font-semibold">{savingTypeLabel[detail.saving_type] ?? detail.saving_type}</p></div>
                <div>
                  <p className="text-xs text-muted-foreground">ยอดทองคงเหลือ</p>
                  <p className="font-bold text-yellow-700 text-lg">{fmt(detail.gold_balance / BAHT_GRAM)} บาททอง</p>
                  <p className="text-xs text-yellow-600">{fmt(detail.gold_balance)} g</p>
                </div>
                <div><p className="text-xs text-muted-foreground">ยอดเงินคงเหลือ</p><p className="font-bold text-green-700 text-lg">฿{fmtCash(detail.cash_balance)}</p></div>
                <div><p className="text-xs text-muted-foreground">วันที่เปิดบัญชี</p><p className="font-semibold">{format(new Date(detail.opened_date), 'dd/MM/yyyy')}</p></div>
              </div>
              <div>
                <p className="font-semibold mb-2">รายการเคลื่อนไหว</p>
                <div className="rounded border divide-y max-h-64 overflow-y-auto">
                  {detail.transactions.length === 0
                    ? <p className="px-3 py-4 text-center text-muted-foreground">ยังไม่มีรายการ</p>
                    : detail.transactions.map((t, i) => (
                      <div key={i} className="flex justify-between items-center px-3 py-2">
                        <div>
                          <p className={`font-medium text-sm ${t.type === 'deposit' ? 'text-green-700' : 'text-red-600'}`}>{txTypeLabel[t.type] ?? t.type}</p>
                          <p className="text-xs text-muted-foreground">{format(new Date(t.date), 'dd/MM/yyyy HH:mm')}</p>
                        </div>
                        <div className="text-right">
                          <p className={`font-semibold ${t.type === 'deposit' ? 'text-green-700' : 'text-red-600'}`}>{t.type === 'deposit' ? '+' : '-'}{fmt(t.gold_weight)}g</p>
                          <p className="text-xs text-muted-foreground">คงเหลือ: {fmt(t.balance_after)}g</p>
                        </div>
                      </div>
                    ))
                  }
                </div>
              </div>
              {detail.status === 'active' && (
                <div className="flex gap-2 pt-2 border-t">
                  <Button size="sm" className="flex-1 bg-green-500 hover:bg-green-600 text-white" onClick={() => { setDetail(null); setActionDialog({ type: 'deposit', account: detail }); setAmount(''); setInputMode('weight') }}>ฝากทอง</Button>
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => { setDetail(null); setActionDialog({ type: 'withdraw', account: detail }); setAmount(''); setInputMode('weight') }}>ถอนทอง</Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Deposit/Withdraw Dialog */}
      <Dialog open={!!actionDialog} onOpenChange={() => setActionDialog(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>{actionDialog?.type === 'deposit' ? 'ฝากทอง' : 'ถอนทอง'}</DialogTitle></DialogHeader>
          {actionDialog && (
            <div className="space-y-4">
              <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-3 text-sm">
                <p className="font-semibold">{actionDialog.account.account_number} · {getCustomerName(actionDialog.account.customer_id)}</p>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-muted-foreground text-xs">ยอดทองคงเหลือ:</span>
                  <span className="font-bold text-yellow-700">{fmt(actionDialog.account.gold_balance / BAHT_GRAM)} บาททอง</span>
                  <span className="text-xs text-yellow-600">({fmt(actionDialog.account.gold_balance)} g)</span>
                </div>
                {goldBuyPrice > 0 && (
                <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                  <span>฿{fmtCash(goldBuyPrice)}/บาท</span>
                  <span>฿{fmtCash(Math.round(goldPricePerGram))}/กรัม</span>
                </div>
                )}
              </div>
              <div>
                <Label className="mb-2 block">กรอกเป็น</Label>
                <div className="flex gap-1">
                  <button onClick={() => setInputMode('weight')} className={`flex-1 py-1.5 text-xs font-medium rounded-lg border transition-colors ${inputMode === 'weight' ? 'bg-yellow-500 text-white border-yellow-500' : 'border-gray-200 hover:bg-gray-50'}`}>กรัม (g)</button>
                  <button onClick={() => setInputMode('baht')} className={`flex-1 py-1.5 text-xs font-medium rounded-lg border transition-colors ${inputMode === 'baht' ? 'bg-yellow-500 text-white border-yellow-500' : 'border-gray-200 hover:bg-gray-50'}`}>บาททอง</button>
                  <button onClick={() => setInputMode('cash')} className={`flex-1 py-1.5 text-xs font-medium rounded-lg border transition-colors ${inputMode === 'cash' ? 'bg-yellow-500 text-white border-yellow-500' : 'border-gray-200 hover:bg-gray-50'}`}>เงินบาท (฿)</button>
                </div>
              </div>
              <div>
                <Label>
                  {inputMode === 'weight' ? 'น้ำหนักทอง (กรัม)' : inputMode === 'baht' ? 'จำนวนทอง (บาททอง = 15.244g)' : 'จำนวนเงิน (บาท ฿)'}
                </Label>
                <Input type="number" step={inputMode === 'weight' ? '0.0001' : inputMode === 'baht' ? '0.01' : '1'} value={amount} onChange={e => setAmount(e.target.value)} className="mt-1" />
              </div>
              {amountNum > 0 && (
                <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm space-y-1.5">
                  <p className="text-xs font-semibold text-amber-800">สรุปการคำนวณ</p>
                  {inputMode === 'baht' && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{fmt(amountNum)} บาททอง × {BAHT_GRAM} g</span>
                      <span className="font-bold text-yellow-700">{fmt(goldGrams)} g</span>
                    </div>
                  )}
                  {inputMode === 'cash' && goldBuyPricePerGram > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">฿{fmtCash(amountNum)} ÷ ฿{fmtCash(Math.round(goldBuyPricePerGram))}/g</span>
                      <span className="font-bold text-yellow-700">{fmt(goldGrams)} g</span>
                    </div>
                  )}
                  {inputMode === 'weight' && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">น้ำหนัก</span>
                      <span className="font-bold text-yellow-700">{fmt(goldGrams)} g</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">= บาททอง</span>
                    <span className="font-semibold text-yellow-600">{fmt(bahtValue)} บาททอง</span>
                  </div>
                  {goldBuyPricePerBaht > 0 && (
                    <div className="flex justify-between border-t border-amber-200 pt-1.5">
                      <span className="text-muted-foreground font-medium">มูลค่าเงิน ({fmt(bahtValue)} บาททอง × ฿{fmtCash(goldBuyPricePerBaht)})</span>
                      <span className="font-bold text-green-700">฿{fmtCash(Math.round(cashValue))}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog(null)}>ยกเลิก</Button>
            <Button onClick={handleAction} disabled={saving || !amountNum} className="bg-yellow-500 hover:bg-yellow-600 text-white">
              {saving ? 'กำลังบันทึก...' : 'ยืนยัน'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Open Account Dialog */}
      <Dialog open={openAccountOpen} onOpenChange={setOpenAccountOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>เปิดบัญชีออมทองใหม่</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="mb-2 block">ลูกค้า</Label>
              {newCustomer ? (
                <div className="flex items-center gap-2 rounded-lg bg-yellow-50 border border-yellow-200 px-3 py-2">
                  <div className="flex-1"><p className="font-semibold text-sm">{newCustomer.full_name}</p><p className="text-xs text-muted-foreground">{newCustomer.phone}</p></div>
                  <button onClick={() => setNewCustomer(null)} className="text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Input placeholder="ค้นหาลูกค้า..." value={newCustomerQ} onChange={e => setNewCustomerQ(e.target.value)} />
                  {newCustomerQ && (
                    <div className="rounded-lg border divide-y max-h-40 overflow-y-auto">
                      {filteredNewCustomers.length === 0
                        ? <p className="text-center text-sm text-muted-foreground py-3">ไม่พบลูกค้า</p>
                        : filteredNewCustomers.map(c => (
                          <button key={c.id} onClick={() => { setNewCustomer(c); setNewCustomerQ('') }} className="w-full text-left px-3 py-2 hover:bg-yellow-50 text-sm">
                            <p className="font-medium">{c.full_name}</p><p className="text-xs text-muted-foreground">{c.phone}</p>
                          </button>
                        ))
                      }
                    </div>
                  )}
                </div>
              )}
            </div>
            <div>
              <Label className="mb-2 block">ประเภทบัญชี</Label>
              <Select value={newSavingType} onValueChange={v => setNewSavingType(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="weight">ออมทอง (กรัม)</SelectItem>
                  <SelectItem value="money">ออมเงิน (บาท)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenAccountOpen(false)}>ยกเลิก</Button>
            <Button onClick={handleOpenAccount} disabled={saving || !newCustomer} className="bg-yellow-500 hover:bg-yellow-600 text-white">
              {saving ? 'กำลังบันทึก...' : 'เปิดบัญชี'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
