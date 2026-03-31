'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { format } from 'date-fns'
import { Plus, Eye, MoreHorizontal, Landmark, AlertTriangle, Banknote } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

import { pawnApi, customerApi } from '@/lib/gold-api'
import type { Pawn, Customer } from '@/types/gold'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const statusColor: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  redeemed: 'bg-blue-100 text-blue-700',
  forfeited: 'bg-red-100 text-red-700',
  extended: 'bg-yellow-100 text-yellow-700',
}
const statusLabel: Record<string, string> = {
  active: 'กำลังจำนำ', redeemed: 'ไถ่ถอนแล้ว', forfeited: 'หลุดจำนำ', extended: 'ต่อสัญญา',
}
const fmt = (n: number) => new Intl.NumberFormat('th-TH', { maximumFractionDigits: 0 }).format(n)

function StatCard({ title, value, icon: Icon, color }: { title: string; value: string; icon: any; color: string }) {
  return (
    <Card>
      <CardContent className="pt-5">
        <div className={`inline-flex rounded-lg p-2 mb-3 ${color}`}><Icon className="h-5 w-5 text-white" /></div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-sm text-muted-foreground mt-0.5">{title}</p>
      </CardContent>
    </Card>
  )
}

export default function PawnsPage() {
  const { data: pawns, isLoading, mutate } = useSWR<Pawn[]>('pawns', () => pawnApi.list())
  const { data: customers } = useSWR<Customer[]>('customers', () => customerApi.list())
  const [detail, setDetail] = useState<Pawn | null>(null)
  const [actionDialog, setActionDialog] = useState<{ type: 'interest' | 'redeem' | 'extend'; pawn: Pawn } | null>(null)
  const [amount, setAmount] = useState('')
  const [discount, setDiscount] = useState('0')
  const [months, setMonths] = useState('1')
  const [saving, setSaving] = useState(false)

  const getCustomerName = (id: string) => customers?.find(c => c.id === id)?.full_name ?? id

  const now = new Date()
  const active = pawns?.filter(p => p.status === 'active' || p.status === 'extended') ?? []
  const dueSoon = active.filter(p => {
    const diff = (new Date(p.due_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    return diff <= 7 && diff >= 0
  })
  const totalPrincipal = active.reduce((s, p) => s + p.principal, 0)

  const handleAction = async () => {
    if (!actionDialog) return
    try {
      setSaving(true)
      const { type, pawn } = actionDialog
      if (type === 'interest') {
        await pawnApi.payInterest(pawn.id, { amount: parseFloat(amount) })
        toast.success('บันทึกการจ่ายดอกเบี้ยแล้ว')
      } else if (type === 'redeem') {
        await pawnApi.redeem(pawn.id, { interest: parseFloat(amount), discount: parseFloat(discount) || 0 })
        toast.success('ไถ่ถอนสำเร็จ')
      } else if (type === 'extend') {
        await pawnApi.extend(pawn.id, { additionalMonths: parseInt(months) })
        toast.success('ต่อสัญญาสำเร็จ')
      }
      mutate(); setActionDialog(null); setAmount(''); setDiscount('0'); setMonths('1')
    } catch (e: any) { toast.error(e.response?.data?.message || 'เกิดข้อผิดพลาด') }
    finally { setSaving(false) }
  }

  const handleForfeit = async (id: string) => {
    if (!confirm('ยืนยันหลุดจำนำ?')) return
    try { await pawnApi.forfeit(id); toast.success('บันทึกหลุดจำนำแล้ว'); mutate() }
    catch (e: any) { toast.error(e.response?.data?.message || 'เกิดข้อผิดพลาด') }
  }

  const PawnTable = ({ items }: { items: Pawn[] }) => (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>เลขที่จำนำ</TableHead>
            <TableHead>ลูกค้า</TableHead>
            <TableHead>เงินต้น</TableHead>
            <TableHead>ดอกเบี้ย</TableHead>
            <TableHead>ครบกำหนด</TableHead>
            <TableHead>สถานะ</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 ? (
            <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">ไม่มีรายการ</TableCell></TableRow>
          ) : items.map(p => {
            const overdue = new Date(p.due_date) < now && (p.status === 'active' || p.status === 'extended')
            return (
              <TableRow key={p.id}>
                <TableCell className="font-mono font-medium">{p.pawn_number}</TableCell>
                <TableCell>{getCustomerName(p.customer_id)}</TableCell>
                <TableCell className="font-medium">฿{fmt(p.principal)}</TableCell>
                <TableCell>{p.interest_rate}%/เดือน</TableCell>
                <TableCell className={overdue ? 'text-red-600 font-semibold' : ''}>
                  {format(new Date(p.due_date), 'dd/MM/yyyy')}
                  {overdue && <span className="ml-1 text-xs">(เกินกำหนด)</span>}
                </TableCell>
                <TableCell>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[p.status]}`}>{statusLabel[p.status]}</span>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setDetail(p)}><Eye className="mr-2 h-4 w-4" />ดูรายละเอียด</DropdownMenuItem>
                      {(p.status === 'active' || p.status === 'extended') && (<>
                        <DropdownMenuItem onClick={() => { setActionDialog({ type: 'interest', pawn: p }); setAmount('') }}>จ่ายดอกเบี้ย</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { setActionDialog({ type: 'redeem', pawn: p }); setAmount('') }}>ไถ่ถอน</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { setActionDialog({ type: 'extend', pawn: p }); setMonths('1') }}>ต่อสัญญา</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600" onClick={() => handleForfeit(p.id)}>หลุดจำนำ</DropdownMenuItem>
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
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">จำนำทอง</h1>
        <Button asChild className="bg-yellow-500 hover:bg-yellow-600 text-white">
          <Link href="/pawns/create"><Plus className="h-4 w-4 mr-2" />รับจำนำใหม่</Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard title="จำนำทั้งหมด" value={String(active.length)} icon={Landmark} color="bg-yellow-500" />
        <StatCard title="ใกล้ครบกำหนด (7 วัน)" value={String(dueSoon.length)} icon={AlertTriangle} color="bg-orange-500" />
        <StatCard title="ยอดเงินต้นคงค้าง" value={`฿${fmt(totalPrincipal)}`} icon={Banknote} color="bg-blue-500" />
      </div>

      {/* Tabs */}
      {isLoading ? (
        <div className="py-10 text-center text-muted-foreground">กำลังโหลด...</div>
      ) : (
        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">ทั้งหมด ({pawns?.length ?? 0})</TabsTrigger>
            <TabsTrigger value="active">กำลังจำนำ ({active.length})</TabsTrigger>
            <TabsTrigger value="redeemed">ไถ่ถอนแล้ว ({pawns?.filter(p => p.status === 'redeemed').length ?? 0})</TabsTrigger>
            <TabsTrigger value="forfeited">หลุดจำนำ ({pawns?.filter(p => p.status === 'forfeited').length ?? 0})</TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="mt-4"><PawnTable items={pawns ?? []} /></TabsContent>
          <TabsContent value="active" className="mt-4"><PawnTable items={active} /></TabsContent>
          <TabsContent value="redeemed" className="mt-4"><PawnTable items={pawns?.filter(p => p.status === 'redeemed') ?? []} /></TabsContent>
          <TabsContent value="forfeited" className="mt-4"><PawnTable items={pawns?.filter(p => p.status === 'forfeited') ?? []} /></TabsContent>
        </Tabs>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!detail} onOpenChange={() => setDetail(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>จำนำ #{detail?.pawn_number}</DialogTitle></DialogHeader>
          {detail && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><p className="text-muted-foreground text-xs">ลูกค้า</p><p className="font-semibold">{getCustomerName(detail.customer_id)}</p></div>
                <div><p className="text-muted-foreground text-xs">สถานะ</p><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[detail.status]}`}>{statusLabel[detail.status]}</span></div>
                <div><p className="text-muted-foreground text-xs">เงินต้น</p><p className="font-semibold">฿{fmt(detail.principal)}</p></div>
                <div><p className="text-muted-foreground text-xs">อัตราดอกเบี้ย</p><p className="font-semibold">{detail.interest_rate}%/เดือน</p></div>
                <div><p className="text-muted-foreground text-xs">ระยะเวลา</p><p className="font-semibold">{detail.term_months} เดือน</p></div>
                <div><p className="text-muted-foreground text-xs">ครบกำหนด</p><p className={`font-semibold ${new Date(detail.due_date) < now ? 'text-red-600' : ''}`}>{format(new Date(detail.due_date), 'dd/MM/yyyy')}</p></div>
              </div>
              <div>
                <p className="font-semibold mb-2">รายการทองจำนำ</p>
                <div className="rounded border divide-y">
                  {detail.items.map((item, i) => (
                    <div key={i} className="px-3 py-2">
                      <p className="font-medium">{item.description}</p>
                      <p className="text-xs text-muted-foreground">{item.gold_type} · {item.weight}g · ราคาประเมิน: ฿{fmt(item.appraised_value)}</p>
                    </div>
                  ))}
                </div>
              </div>
              {detail.interest_payments.length > 0 && (
                <div>
                  <p className="font-semibold mb-2">ประวัติจ่ายดอกเบี้ย</p>
                  <div className="rounded border divide-y">
                    {detail.interest_payments.map((ip, i) => (
                      <div key={i} className="flex justify-between px-3 py-2 text-xs">
                        <span>{format(new Date(ip.payment_date), 'dd/MM/yyyy')}</span>
                        <span className="font-medium">฿{fmt(ip.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {(detail.status === 'active' || detail.status === 'extended') && (
                <div className="flex gap-2 pt-2 border-t">
                  <Button size="sm" variant="outline" onClick={() => { setDetail(null); setActionDialog({ type: 'interest', pawn: detail }); setAmount('') }}>จ่ายดอกเบี้ย</Button>
                  <Button size="sm" variant="outline" onClick={() => { setDetail(null); setActionDialog({ type: 'redeem', pawn: detail }); setAmount('') }}>ไถ่ถอน</Button>
                  <Button size="sm" variant="outline" onClick={() => { setDetail(null); setActionDialog({ type: 'extend', pawn: detail }); setMonths('1') }}>ต่อสัญญา</Button>
                  <Button size="sm" variant="destructive" onClick={() => { setDetail(null); handleForfeit(detail.id) }}>หลุดจำนำ</Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Action Dialog */}
      <Dialog open={!!actionDialog} onOpenChange={() => setActionDialog(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {actionDialog?.type === 'interest' ? 'จ่ายดอกเบี้ย' : actionDialog?.type === 'redeem' ? 'ไถ่ถอนจำนำ' : 'ต่อสัญญาจำนำ'}
            </DialogTitle>
          </DialogHeader>
          {actionDialog && (
            <div className="space-y-3 text-sm">
              <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-3">
                <p className="font-semibold">{actionDialog.pawn.pawn_number}</p>
                <p className="text-muted-foreground">เงินต้น: ฿{fmt(actionDialog.pawn.principal)} · {actionDialog.pawn.interest_rate}%/เดือน</p>
              </div>
              {actionDialog.type === 'extend' ? (
                <div><Label>จำนวนเดือนที่ต่อ</Label><Input type="number" min="1" value={months} onChange={e => setMonths(e.target.value)} /></div>
              ) : (
                <>
                  <div><Label>{actionDialog.type === 'interest' ? 'จำนวนดอกเบี้ย (บาท)' : 'ดอกเบี้ยที่ต้องจ่าย (บาท)'}</Label><Input type="number" value={amount} onChange={e => setAmount(e.target.value)} /></div>
                  {actionDialog.type === 'redeem' && (
                    <div><Label>ส่วนลด (บาท)</Label><Input type="number" value={discount} onChange={e => setDiscount(e.target.value)} /></div>
                  )}
                </>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog(null)}>ยกเลิก</Button>
            <Button onClick={handleAction} disabled={saving} className="bg-yellow-500 hover:bg-yellow-600 text-white">
              {saving ? 'กำลังบันทึก...' : 'ยืนยัน'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
