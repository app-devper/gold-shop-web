'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'

import { rewardApi, customerApi } from '@/lib/gold-api'
import type { Reward, Customer } from '@/types/gold'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'

const schema = z.object({
  name: z.string().min(1),
  description: z.string().optional().or(z.literal('')),
  points_required: z.coerce.number().min(1),
  quantity: z.coerce.number().min(1),
  valid_from: z.string().min(1),
  valid_until: z.string().min(1),
})

type FormValues = { name: string; description: string; points_required: number; quantity: number; valid_from: string; valid_until: string }

const fmt = (n: number) => new Intl.NumberFormat('th-TH', { maximumFractionDigits: 0 }).format(n)

export default function RewardsPage() {
  const { data: rewards, isLoading, mutate } = useSWR<Reward[]>('rewards', rewardApi.list)
  const { data: customers } = useSWR<Customer[]>('customers', () => customerApi.list())
  const [open, setOpen] = useState(false)
  const [redeemOpen, setRedeemOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [redeemCustomerId, setRedeemCustomerId] = useState('')
  const [redeemRewardId, setRedeemRewardId] = useState('')

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as any,
    defaultValues: { name: '', description: '', points_required: 100, quantity: 10, valid_from: new Date().toISOString().split('T')[0], valid_until: '' },
  })

  const onSubmit = async (values: FormValues) => {
    try {
      setSaving(true)
      await rewardApi.create(values)
      toast.success('เพิ่มรางวัลสำเร็จ')
      mutate(); setOpen(false)
    } catch (e: any) { toast.error(e.response?.data?.message || 'เกิดข้อผิดพลาด') }
    finally { setSaving(false) }
  }

  const handleRedeem = async () => {
    if (!redeemCustomerId || !redeemRewardId) return
    try {
      setSaving(true)
      await rewardApi.redeem({ customerId: redeemCustomerId, rewardId: redeemRewardId })
      toast.success('แลกรางวัลสำเร็จ')
      setRedeemOpen(false); setRedeemCustomerId(''); setRedeemRewardId('')
    } catch (e: any) { toast.error(e.response?.data?.message || 'เกิดข้อผิดพลาด') }
    finally { setSaving(false) }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">รางวัล</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setRedeemOpen(true)}>แลกรางวัล</Button>
          <Button onClick={() => { form.reset(); setOpen(true) }} className="gap-2"><Plus className="h-4 w-4" />เพิ่มรางวัล</Button>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>รางวัลทั้งหมด</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? <div className="py-10 text-center text-muted-foreground">กำลังโหลด...</div> : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ชื่อรางวัล</TableHead><TableHead>คะแนนที่ใช้</TableHead>
                    <TableHead>จำนวน</TableHead><TableHead>สถานะ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rewards?.map(r => (
                    <TableRow key={r.id}>
                      <TableCell>
                        <p className="font-medium">{r.name}</p>
                        {r.description && <p className="text-xs text-muted-foreground">{r.description}</p>}
                      </TableCell>
                      <TableCell>{fmt(r.points_required)} pts</TableCell>
                      <TableCell>{r.quantity} ชิ้น</TableCell>
                      <TableCell>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${r.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {r.is_active ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>เพิ่มรางวัล</DialogTitle></DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>ชื่อรางวัล</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem><FormLabel>รายละเอียด</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="points_required" render={({ field }) => (
                  <FormItem><FormLabel>คะแนนที่ใช้</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="quantity" render={({ field }) => (
                  <FormItem><FormLabel>จำนวน</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="valid_from" render={({ field }) => (
                  <FormItem><FormLabel>เริ่มใช้วันที่</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="valid_until" render={({ field }) => (
                  <FormItem><FormLabel>หมดอายุวันที่</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>ยกเลิก</Button>
                <Button type="submit" disabled={saving}>{saving ? 'กำลังบันทึก...' : 'บันทึก'}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Redeem Dialog */}
      <Dialog open={redeemOpen} onOpenChange={setRedeemOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>แลกรางวัล</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>ลูกค้า</Label>
              <Select value={redeemCustomerId} onValueChange={setRedeemCustomerId}>
                <SelectTrigger><SelectValue placeholder="เลือกลูกค้า" /></SelectTrigger>
                <SelectContent>
                  {customers?.filter(c => c.is_member).map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.full_name} ({c.membership?.points ?? 0} pts)</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>รางวัล</Label>
              <Select value={redeemRewardId} onValueChange={setRedeemRewardId}>
                <SelectTrigger><SelectValue placeholder="เลือกรางวัล" /></SelectTrigger>
                <SelectContent>
                  {rewards?.filter(r => r.is_active).map(r => (
                    <SelectItem key={r.id} value={r.id}>{r.name} ({fmt(r.points_required)} pts)</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRedeemOpen(false)}>ยกเลิก</Button>
            <Button onClick={handleRedeem} disabled={saving || !redeemCustomerId || !redeemRewardId}>
              {saving ? 'กำลังดำเนินการ...' : 'แลกรางวัล'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
