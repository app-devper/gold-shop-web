'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Plus, Pencil, Trash2, MoreHorizontal, Star, Users } from 'lucide-react'
import { toast } from 'sonner'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'

import { customerApi } from '@/lib/gold-api'
import { apiToastError } from '@/lib/api-toast'
import type { Customer } from '@/types/gold'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { EmptyState } from '@/components/empty-state'
import { TableSkeleton } from '@/components/table-skeleton'
import { Pagination } from '@/components/pagination'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'

const schema = z.object({
  full_name: z.string().min(1, 'Name is required'),
  phone: z.string().min(1, 'Phone is required'),
  id_card: z.string().optional().or(z.literal('')),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  is_member: z.boolean(),
})

const tierColor: Record<string, string> = {
  bronze: 'bg-orange-100 text-orange-700',
  silver: 'bg-gray-100 text-gray-700',
  gold: 'bg-gold-100 text-gold-700',
  platinum: 'bg-purple-100 text-purple-700',
}

const fmt = (n: number) => new Intl.NumberFormat('th-TH', { maximumFractionDigits: 0 }).format(n)

const PAGE_SIZE = 20

export default function CustomersPage() {
  const [page, setPage] = useState(0)
  const { data: customers, isLoading, mutate } = useSWR<Customer[]>(
    ['customers', page],
    () => customerApi.list({ limit: PAGE_SIZE, offset: page * PAGE_SIZE }),
  )
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Customer | null>(null)
  const [saving, setSaving] = useState(false)

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { full_name: '', phone: '', id_card: '', email: '', address: '', is_member: false },
  })

  const openCreate = () => { setEditing(null); form.reset({ full_name: '', phone: '', id_card: '', email: '', address: '', is_member: false }); setOpen(true) }
  const openEdit = (c: Customer) => {
    setEditing(c)
    form.reset({ full_name: c.full_name, phone: c.phone, id_card: c.id_card ?? '', email: c.email ?? '', address: c.address ?? '', is_member: c.is_member })
    setOpen(true)
  }

  const onSubmit = async (values: z.infer<typeof schema>) => {
    try {
      setSaving(true)
      if (editing) await customerApi.update(editing.id, values)
      else await customerApi.create(values)
      toast.success(editing ? 'แก้ไขลูกค้าสำเร็จ' : 'เพิ่มลูกค้าสำเร็จ')
      mutate(); setOpen(false)
    } catch (e) { apiToastError(e) }
    finally { setSaving(false) }
  }

  const onDelete = async (id: string) => {
    if (!confirm('ยืนยันลบลูกค้านี้?')) return
    try { await customerApi.delete(id); toast.success('ลบลูกค้าแล้ว'); mutate() }
    catch (e) { apiToastError(e) }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">ลูกค้า</h1>
        <Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" />เพิ่มลูกค้า</Button>
      </div>
      <Card>
        <CardHeader><CardTitle>ลูกค้าทั้งหมด</CardTitle></CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ชื่อ</TableHead><TableHead>เบอร์โทร</TableHead><TableHead>สมาชิก</TableHead>
                  <TableHead>คะแนน</TableHead><TableHead>ยอดซื้อรวม</TableHead><TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              {isLoading ? <TableSkeleton rows={5} cols={6} /> : (
                <TableBody>
                  {!customers?.length ? (
                    <TableRow><TableCell colSpan={6} className="p-0">
                      <EmptyState icon={Users} title="ยังไม่มีลูกค้า" description="กดปุ่มเพิ่มลูกค้าเพื่อเริ่มต้น" />
                    </TableCell></TableRow>
                  ) : customers.map(c => (
                    <TableRow key={c.id}>
                      <TableCell>
                        <div className="font-medium">{c.full_name}</div>
                        {c.member_code && <div className="text-xs text-muted-foreground">{c.member_code}</div>}
                      </TableCell>
                      <TableCell>{c.phone}</TableCell>
                      <TableCell>
                        {c.is_member && c.membership ? (
                          <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${tierColor[c.membership.tier]}`}>
                            <Star className="h-3 w-3" />{c.membership.tier}
                          </span>
                        ) : <span className="text-xs text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell>{c.membership ? fmt(c.membership.points) : '—'}</TableCell>
                      <TableCell>฿{fmt(c.total_spent)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEdit(c)}><Pencil className="mr-2 h-4 w-4" />แก้ไข</DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600" onClick={() => onDelete(c.id)}><Trash2 className="mr-2 h-4 w-4" />ลบ</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              )}
            </Table>
          </div>
          <Pagination
            page={page}
            pageSize={PAGE_SIZE}
            hasNext={(customers?.length ?? 0) === PAGE_SIZE}
            onPageChange={setPage}
          />
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader><DialogTitle>{editing ? 'แก้ไขลูกค้า' : 'เพิ่มลูกค้า'}</DialogTitle></DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="full_name" render={({ field }) => (
                <FormItem><FormLabel>ชื่อ-นามสกุล</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="phone" render={({ field }) => (
                  <FormItem><FormLabel>เบอร์โทร</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="id_card" render={({ field }) => (
                  <FormItem><FormLabel>เลขบัตรประชาชน</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem><FormLabel>อีเมล</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="address" render={({ field }) => (
                <FormItem><FormLabel>ที่อยู่</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="is_member" render={({ field }) => (
                <FormItem className="flex items-center gap-3">
                  <FormControl>
                    <input type="checkbox" checked={field.value} onChange={field.onChange} className="h-4 w-4 rounded border-gray-300" />
                  </FormControl>
                  <FormLabel className="!mt-0">สมัครสมาชิก</FormLabel>
                </FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>ยกเลิก</Button>
                <Button type="submit" disabled={saving}>{saving ? 'กำลังบันทึก...' : 'บันทึก'}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
