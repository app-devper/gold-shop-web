'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { format } from 'date-fns'
import {
  Eye, MoreHorizontal, PiggyBank, Scale, Plus, Gem,
  TrendingUp, TrendingDown, Banknote,
} from 'lucide-react'
import { toast } from 'sonner'

import { goldSavingApi, customerApi, goldPriceApi } from '@/lib/gold-api'
import { apiToastError } from '@/lib/api-toast'
import { useAuthStore } from '@/store/auth'
import type { GoldSaving, Customer, GoldSavingTransaction } from '@/types/gold'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { EmptyState } from '@/components/empty-state'

const BAHT_GRAM = 15.244 // bar (99.99%) — gold savings hold bar gold, not ornament
const fmtBaht = (n: number) => new Intl.NumberFormat('th-TH', { maximumFractionDigits: 0 }).format(n)
const fmtGram = (n: number) => new Intl.NumberFormat('th-TH', { maximumFractionDigits: 4 }).format(n)
const fmtPct = (n: number) => `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`

const statusColor: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  closed: 'bg-gray-100 text-gray-500',
}
const statusLabel: Record<string, string> = { active: 'เปิดใช้งาน', closed: 'ปิดบัญชีแล้ว' }
const txTypeLabel: Record<string, string> = { deposit: 'ฝาก', withdraw: 'ถอน', adjust: 'ปรับยอด' }
const txModeLabel: Record<string, string> = { cash: 'เงินสด', physical: 'ทอง' }

export default function GoldSavingsPage() {
  const userRole = useAuthStore(s => s.userRole)
  const isAdmin = userRole === 'SUPER' || userRole === 'ADMIN'

  const { data: accounts, isLoading, mutate } = useSWR<GoldSaving[]>('gold-savings', goldSavingApi.list)
  const { data: customers } = useSWR<Customer[]>('customers', () => customerApi.list())
  const { data: currentGoldPrice } = useSWR('gold-price-current', () => goldPriceApi.current())

  // Dialog state
  const [detail, setDetail] = useState<GoldSaving | null>(null)
  const [actionDialog, setActionDialog] = useState<{ type: 'deposit' | 'withdraw'; account: GoldSaving } | null>(null)
  const [openAccountOpen, setOpenAccountOpen] = useState(false)
  const [adjustDialog, setAdjustDialog] = useState<GoldSaving | null>(null)

  // Action form state
  const [txMode, setTxMode] = useState<'cash' | 'physical'>('cash')
  const [amountInput, setAmountInput] = useState('')
  const [saving, setSaving] = useState(false)

  // Open account form state
  const [newCustomerQ, setNewCustomerQ] = useState('')
  const [newCustomer, setNewCustomer] = useState<Customer | null>(null)

  // Adjust form state
  const [adjustWeight, setAdjustWeight] = useState('')
  const [adjustNote, setAdjustNote] = useState('')

  const sellPerGram = currentGoldPrice ? currentGoldPrice.gold_bar_sell / BAHT_GRAM : 0
  const buyPerGram = currentGoldPrice ? currentGoldPrice.gold_bar_buy / BAHT_GRAM : 0

  const getCustomerName = (id: string) => customers?.find(c => c.id === id)?.full_name ?? id
  const activeAccounts = accounts?.filter(a => a.status === 'active') ?? []
  const totalGold = activeAccounts.reduce((s, a) => s + a.gold_weight, 0)
  const totalMarkValue = totalGold * buyPerGram

  const filteredCustomers = customers?.filter(c =>
    c.full_name.toLowerCase().includes(newCustomerQ.toLowerCase()) || c.phone?.includes(newCustomerQ)
  ) ?? []

  // ── Tx preview math ────────────────────────────────────────────────────────
  const amountNum = parseFloat(amountInput) || 0
  const previewWeight = (() => {
    if (!actionDialog || amountNum <= 0) return 0
    if (txMode === 'physical') return amountNum
    // cash
    const price = actionDialog.type === 'deposit' ? sellPerGram : buyPerGram
    return price > 0 ? amountNum / price : 0
  })()
  const previewCash = (() => {
    if (!actionDialog || amountNum <= 0) return 0
    if (txMode === 'cash') return amountNum
    // physical
    const price = actionDialog.type === 'deposit' ? sellPerGram : buyPerGram
    return amountNum * price
  })()

  const openAction = (type: 'deposit' | 'withdraw', account: GoldSaving) => {
    setActionDialog({ type, account })
    setAmountInput('')
    setTxMode('cash')
  }

  // ── Submit handlers ───────────────────────────────────────────────────────
  const submitTx = async () => {
    if (!actionDialog) return
    if (amountNum <= 0) { toast.error('กรุณากรอกจำนวนที่มากกว่า 0'); return }
    if (!currentGoldPrice || sellPerGram <= 0 || buyPerGram <= 0) {
      toast.error('ยังไม่มีราคาทองปัจจุบัน — ตั้งราคาที่หน้า "ราคาทอง" ก่อน'); return
    }
    try {
      setSaving(true)
      const fn = actionDialog.type === 'deposit' ? goldSavingApi.deposit : goldSavingApi.withdraw
      await fn(actionDialog.account.id, { mode: txMode, amount: amountNum })
      toast.success(actionDialog.type === 'deposit' ? 'ฝากสำเร็จ' : 'ถอนสำเร็จ')
      mutate(); setActionDialog(null); setAmountInput('')
    } catch (e) { apiToastError(e) }
    finally { setSaving(false) }
  }

  const submitOpen = async () => {
    if (!newCustomer) { toast.error('กรุณาเลือกลูกค้า'); return }
    try {
      setSaving(true)
      await goldSavingApi.open({ customer_id: newCustomer.id })
      toast.success('เปิดบัญชีออมทองสำเร็จ')
      mutate(); setOpenAccountOpen(false); setNewCustomer(null); setNewCustomerQ('')
    } catch (e) { apiToastError(e) }
    finally { setSaving(false) }
  }

  const submitAdjust = async () => {
    if (!adjustDialog) return
    const delta = parseFloat(adjustWeight)
    if (!delta || delta === 0) { toast.error('กรอกค่าเปลี่ยนแปลง (ลบ = หักออก / บวก = เพิ่ม)'); return }
    if (!adjustNote.trim()) { toast.error('กรุณาระบุเหตุผล (ทุกการปรับยอดมี audit log)'); return }
    try {
      setSaving(true)
      await goldSavingApi.adjust(adjustDialog.id, { weight_delta: delta, note: adjustNote })
      toast.success('ปรับยอดสำเร็จ')
      mutate(); setAdjustDialog(null); setAdjustWeight(''); setAdjustNote('')
    } catch (e) { apiToastError(e) }
    finally { setSaving(false) }
  }

  const handleClose = async (id: string) => {
    if (!confirm('ยืนยันปิดบัญชี? ต้องถอนทองให้หมดก่อน')) return
    try { await goldSavingApi.close(id); toast.success('ปิดบัญชีแล้ว'); mutate() }
    catch (e) { apiToastError(e) }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">ออมทอง</h1>
        <Button onClick={() => setOpenAccountOpen(true)} className="bg-gold-500 hover:bg-gold-600 text-white">
          <Plus className="h-4 w-4 mr-2" />เปิดบัญชีใหม่
        </Button>
      </div>

      {/* Gold price banner — savings price uses gold bar (99.99%) */}
      {currentGoldPrice && (
        <div className="rounded-xl p-4 text-white bg-gradient-to-br from-gold-700 via-gold-500 to-gold-700 flex flex-wrap gap-x-6 gap-y-2 items-center">
          <div className="flex items-center gap-2"><Gem className="h-5 w-5" /><span className="font-semibold">ราคาทองแท่ง (96.5%)</span></div>
          <div className="text-sm flex flex-wrap gap-x-5 gap-y-1">
            <div><span className="text-white/70">รับซื้อ </span>฿{fmtBaht(currentGoldPrice.gold_bar_buy)}/บาท · ฿{fmtBaht(buyPerGram)}/g</div>
            <div><span className="text-white/70">ขายออก </span>฿{fmtBaht(currentGoldPrice.gold_bar_sell)}/บาท · ฿{fmtBaht(sellPerGram)}/g</div>
            <div className="text-white/80">spread {currentGoldPrice.gold_bar_sell - currentGoldPrice.gold_bar_buy > 0
              ? `฿${fmtBaht(currentGoldPrice.gold_bar_sell - currentGoldPrice.gold_bar_buy)}/บาท` : '—'}</div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="pt-5">
          <div className="inline-flex rounded-lg p-2 mb-3 bg-gold-500"><PiggyBank className="h-5 w-5 text-white" /></div>
          <p className="text-2xl font-bold">{activeAccounts.length}</p>
          <p className="text-sm text-muted-foreground">บัญชีที่เปิดอยู่</p>
        </CardContent></Card>
        <Card><CardContent className="pt-5">
          <div className="inline-flex rounded-lg p-2 mb-3 bg-gold-600"><Scale className="h-5 w-5 text-white" /></div>
          <p className="text-2xl font-bold">{fmtGram(totalGold)} g</p>
          <p className="text-xs text-muted-foreground">{fmtGram(totalGold / BAHT_GRAM)} บาททอง</p>
          <p className="text-sm text-muted-foreground mt-1">ยอดทองรวม</p>
        </CardContent></Card>
        <Card><CardContent className="pt-5">
          <div className="inline-flex rounded-lg p-2 mb-3 bg-green-500"><Banknote className="h-5 w-5 text-white" /></div>
          <p className="text-2xl font-bold">฿{fmtBaht(totalMarkValue)}</p>
          <p className="text-sm text-muted-foreground">มูลค่ารวม (mark-to-market)</p>
        </CardContent></Card>
      </div>

      {/* Account list */}
      <Card>
        <CardHeader><CardTitle>บัญชีออมทองทั้งหมด</CardTitle></CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>เลขบัญชี</TableHead>
                  <TableHead>ลูกค้า</TableHead>
                  <TableHead className="text-right">ยอดทอง</TableHead>
                  <TableHead className="text-right">มูลค่าปัจจุบัน</TableHead>
                  <TableHead className="text-right">กำไร/ขาดทุน</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">กำลังโหลด...</TableCell></TableRow>}
                {!isLoading && !accounts?.length && (
                  <TableRow><TableCell colSpan={7} className="p-0">
                    <EmptyState icon={PiggyBank} title="ยังไม่มีบัญชี" description="กดเปิดบัญชีใหม่เพื่อเริ่มต้น" />
                  </TableCell></TableRow>
                )}
                {!isLoading && accounts?.map(a => {
                  const value = a.gold_weight * buyPerGram
                  const cost = a.total_deposit_value - a.total_withdraw_value
                  const pnl = value - cost
                  const pnlPct = cost > 0 ? (pnl / cost) * 100 : 0
                  return (
                    <TableRow key={a.id}>
                      <TableCell className="font-mono font-medium">{a.account_number}</TableCell>
                      <TableCell>{getCustomerName(a.customer_id)}</TableCell>
                      <TableCell className="text-right font-medium text-gold-700">
                        <p>{fmtGram(a.gold_weight)} g</p>
                        <p className="text-xs text-gold-600/70">{fmtGram(a.gold_weight / BAHT_GRAM)} บาททอง</p>
                      </TableCell>
                      <TableCell className="text-right">฿{fmtBaht(value)}</TableCell>
                      <TableCell className={`text-right font-medium ${pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {a.gold_weight > 0 && cost > 0 ? (
                          <span className="inline-flex items-center gap-1 justify-end">
                            {pnl >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                            ฿{fmtBaht(Math.abs(pnl))} ({fmtPct(pnlPct)})
                          </span>
                        ) : <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[a.status]}`}>{statusLabel[a.status]}</span></TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setDetail(a)}><Eye className="mr-2 h-4 w-4" />ดูรายละเอียด</DropdownMenuItem>
                            {a.status === 'active' && (<>
                              <DropdownMenuItem onClick={() => openAction('deposit', a)}>ฝาก</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openAction('withdraw', a)}>ถอน</DropdownMenuItem>
                              {isAdmin && (
                                <DropdownMenuItem onClick={() => { setAdjustDialog(a); setAdjustWeight(''); setAdjustNote('') }}>
                                  ปรับยอด (ADMIN)
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem className="text-red-600" onClick={() => handleClose(a.id)}>ปิดบัญชี</DropdownMenuItem>
                            </>)}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Statement / Detail dialog */}
      <Dialog open={!!detail} onOpenChange={() => setDetail(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>{detail?.account_number} · {getCustomerName(detail?.customer_id ?? '')}</DialogTitle></DialogHeader>
          {detail && <StatementView account={detail} buyPerGram={buyPerGram} sellPerGram={sellPerGram} />}
        </DialogContent>
      </Dialog>

      {/* Deposit / Withdraw dialog */}
      <Dialog open={!!actionDialog} onOpenChange={() => setActionDialog(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {actionDialog?.type === 'deposit' ? 'ฝาก' : 'ถอน'}
              {' · '}
              {txMode === 'cash' ? 'เงินสด' : 'ทองจริง'}
            </DialogTitle>
          </DialogHeader>
          {actionDialog && (
            <div className="space-y-4">
              <div className="rounded-lg bg-gold-50 border border-gold-200 p-3 text-sm">
                <p className="font-semibold">{actionDialog.account.account_number}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  ยอดคงเหลือ: <span className="font-bold text-gold-700">{fmtGram(actionDialog.account.gold_weight)} g</span>
                  {' '}({fmtGram(actionDialog.account.gold_weight / BAHT_GRAM)} บาททอง)
                </p>
              </div>

              <div>
                <Label className="mb-2 block">รูปแบบรายการ</Label>
                <div className="flex gap-1">
                  <button onClick={() => setTxMode('cash')}
                    className={`flex-1 py-2 text-sm font-medium rounded-lg border transition-colors ${txMode === 'cash' ? 'bg-gold-500 text-white border-gold-500' : 'border-border hover:bg-muted'}`}>
                    {actionDialog.type === 'deposit' ? 'ฝากเงินสด' : 'ถอนเป็นเงินสด'}
                  </button>
                  <button onClick={() => setTxMode('physical')}
                    className={`flex-1 py-2 text-sm font-medium rounded-lg border transition-colors ${txMode === 'physical' ? 'bg-gold-500 text-white border-gold-500' : 'border-border hover:bg-muted'}`}>
                    {actionDialog.type === 'deposit' ? 'ฝากทองจริง' : 'ถอนทองจริง'}
                  </button>
                </div>
              </div>

              <div>
                <Label>{txMode === 'cash' ? 'จำนวนเงิน (฿)' : 'น้ำหนักทอง (กรัม)'}</Label>
                <Input
                  type="number"
                  min="0"
                  step={txMode === 'cash' ? '1' : '0.0001'}
                  value={amountInput}
                  onChange={e => { const v = e.target.value; if (v && parseFloat(v) < 0) return; setAmountInput(v) }}
                  className="mt-1"
                />
              </div>

              {amountNum > 0 && (
                <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm space-y-1">
                  <p className="text-xs font-semibold text-amber-800">
                    ราคาที่ใช้: {actionDialog.type === 'deposit' ? 'ขายออก' : 'รับซื้อ'} ฿{fmtBaht(actionDialog.type === 'deposit' ? sellPerGram : buyPerGram)}/g
                  </p>
                  <div className="flex justify-between"><span className="text-muted-foreground">น้ำหนักทอง</span><span className="font-bold text-gold-700">{fmtGram(previewWeight)} g</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">เทียบบาททอง</span><span>{fmtGram(previewWeight / BAHT_GRAM)} บาททอง</span></div>
                  <div className="flex justify-between border-t border-amber-200 pt-1"><span className="text-muted-foreground">มูลค่าเงิน</span><span className="font-bold text-green-700">฿{fmtBaht(previewCash)}</span></div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog(null)}>ยกเลิก</Button>
            <Button onClick={submitTx} disabled={saving || !amountNum} className="bg-gold-500 hover:bg-gold-600 text-white">
              {saving ? 'กำลังบันทึก...' : 'ยืนยัน'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Open account dialog */}
      <Dialog open={openAccountOpen} onOpenChange={setOpenAccountOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>เปิดบัญชีออมทองใหม่</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground rounded-lg bg-muted p-2">
              บัญชีออมทองรับฝาก/ถอนได้ทั้ง <b>เงินสด</b> และ <b>ทองจริง</b> ในบัญชีเดียว · บันทึกเป็นน้ำหนักทอง (g) · ราคาที่ใช้จะเป็นราคา ณ ตอนทำธุรกรรม
            </p>
            <div>
              <Label className="mb-2 block">ลูกค้า</Label>
              {newCustomer ? (
                <div className="flex items-center gap-2 rounded-lg bg-gold-50 border border-gold-200 px-3 py-2">
                  <div className="flex-1"><p className="font-semibold text-sm">{newCustomer.full_name}</p><p className="text-xs text-muted-foreground">{newCustomer.phone}</p></div>
                  <button onClick={() => setNewCustomer(null)} className="text-muted-foreground hover:text-foreground text-lg leading-none">×</button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Input placeholder="ค้นหาลูกค้า..." value={newCustomerQ} onChange={e => setNewCustomerQ(e.target.value)} />
                  {newCustomerQ && (
                    <div className="rounded-lg border divide-y max-h-40 overflow-y-auto">
                      {filteredCustomers.length === 0
                        ? <p className="text-center text-sm text-muted-foreground py-3">ไม่พบลูกค้า</p>
                        : filteredCustomers.map(c => (
                          <button key={c.id} onClick={() => { setNewCustomer(c); setNewCustomerQ('') }} className="w-full text-left px-3 py-2 hover:bg-gold-50 text-sm">
                            <p className="font-medium">{c.full_name}</p><p className="text-xs text-muted-foreground">{c.phone}</p>
                          </button>
                        ))
                      }
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenAccountOpen(false)}>ยกเลิก</Button>
            <Button onClick={submitOpen} disabled={saving || !newCustomer} className="bg-gold-500 hover:bg-gold-600 text-white">
              {saving ? 'กำลังบันทึก...' : 'เปิดบัญชี'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Adjust dialog (ADMIN) */}
      <Dialog open={!!adjustDialog} onOpenChange={() => setAdjustDialog(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>ปรับยอด — {adjustDialog?.account_number}</DialogTitle></DialogHeader>
          {adjustDialog && (
            <div className="space-y-3 text-sm">
              <p className="rounded-lg bg-amber-50 border border-amber-200 p-2 text-xs text-amber-900">
                ยอดทองปัจจุบัน <b>{fmtGram(adjustDialog.gold_weight)} g</b> · กรอกค่าเปลี่ยนแปลง (ลบ = หัก, บวก = เพิ่ม) · บันทึก audit ทุกครั้ง
              </p>
              <div>
                <Label>ค่าเปลี่ยนแปลง (กรัม)</Label>
                <Input type="number" step="0.0001" value={adjustWeight} onChange={e => setAdjustWeight(e.target.value)} placeholder="เช่น -0.05 หรือ 1.0" />
              </div>
              <div>
                <Label>เหตุผล (จำเป็น)</Label>
                <Input value={adjustNote} onChange={e => setAdjustNote(e.target.value)} placeholder="เช่น สูญหายระหว่างขนย้าย" />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustDialog(null)}>ยกเลิก</Button>
            <Button onClick={submitAdjust} disabled={saving} className="bg-red-500 hover:bg-red-600 text-white">
              {saving ? 'กำลังบันทึก...' : 'ปรับยอด'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ── Statement view (used inside detail dialog) ────────────────────────────────
function StatementView({ account, buyPerGram }: { account: GoldSaving; buyPerGram: number; sellPerGram: number }) {
  const value = account.gold_weight * buyPerGram
  const cost = account.total_deposit_value - account.total_withdraw_value
  const pnl = value - cost
  const pnlPct = cost > 0 ? (pnl / cost) * 100 : 0

  return (
    <div className="space-y-4 text-sm">
      <div className="grid grid-cols-2 gap-3">
        <Stat label="ยอดทอง" value={`${fmtGram(account.gold_weight)} g`} sub={`${fmtGram(account.gold_weight / BAHT_GRAM)} บาททอง`} highlight="gold" />
        <Stat label="มูลค่าปัจจุบัน" value={`฿${fmtBaht(value)}`} sub="mark-to-market" highlight="green" />
        <Stat label="ทุนสะสม (สุทธิ)" value={`฿${fmtBaht(cost)}`} sub={`ฝาก ฿${fmtBaht(account.total_deposit_value)} · ถอน ฿${fmtBaht(account.total_withdraw_value)}`} />
        <Stat
          label="กำไร/ขาดทุน"
          value={`${pnl >= 0 ? '+' : '−'}฿${fmtBaht(Math.abs(pnl))}`}
          sub={cost > 0 ? fmtPct(pnlPct) : '—'}
          highlight={pnl >= 0 ? 'green' : 'red'}
        />
      </div>

      <div>
        <p className="font-semibold mb-2">รายการเคลื่อนไหว ({account.transactions.length})</p>
        <div className="rounded border divide-y max-h-72 overflow-y-auto">
          {account.transactions.length === 0
            ? <p className="px-3 py-4 text-center text-muted-foreground text-xs">ยังไม่มีรายการ</p>
            : [...account.transactions].reverse().map((t, i) => <TxRow key={i} tx={t} />)
          }
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value, sub, highlight }: { label: string; value: string; sub?: string; highlight?: 'gold' | 'green' | 'red' }) {
  const color = highlight === 'gold' ? 'text-gold-700'
    : highlight === 'green' ? 'text-green-700'
    : highlight === 'red' ? 'text-red-600'
    : 'text-foreground'
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`font-bold text-lg ${color}`}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  )
}

function TxRow({ tx }: { tx: GoldSavingTransaction }) {
  const isCredit = tx.gold_weight_delta > 0
  const dirColor = isCredit ? 'text-green-700' : 'text-red-600'
  const sign = isCredit ? '+' : '−'
  return (
    <div className="flex justify-between items-start px-3 py-2 text-xs">
      <div>
        <p className={`font-semibold ${dirColor}`}>
          {txTypeLabel[tx.type] ?? tx.type} · {txModeLabel[tx.mode] ?? tx.mode}
        </p>
        <p className="text-muted-foreground">{format(new Date(tx.date), 'dd/MM/yy HH:mm')}</p>
        {tx.note && <p className="italic text-muted-foreground">หมายเหตุ: {tx.note}</p>}
      </div>
      <div className="text-right">
        <p className={`font-bold ${dirColor}`}>{sign}{fmtGram(Math.abs(tx.gold_weight_delta))} g</p>
        <p className="text-muted-foreground">฿{fmtBaht(tx.cash_equivalent)} @ ฿{fmtBaht(tx.gold_price_per_gram)}/g</p>
        <p className="text-muted-foreground">คงเหลือ {fmtGram(tx.balance_after)} g</p>
      </div>
    </div>
  )
}
