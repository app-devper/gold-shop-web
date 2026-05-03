'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Plus, Pencil, Trash2, MoreHorizontal } from 'lucide-react'
import { toast } from 'sonner'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'

import { branchApi } from '@/lib/gold-api'
import { apiToastError } from '@/lib/api-toast'
import type { Branch } from '@/types/gold'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'

const schema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  address: z.string().optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
})

export default function BranchesPage() {
  const { data: branches, isLoading, mutate } = useSWR<Branch[]>('branches', branchApi.list)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Branch | null>(null)
  const [saving, setSaving] = useState(false)

  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues: { code: '', name: '', address: '', phone: '' } })

  const openCreate = () => { setEditing(null); form.reset({ code: '', name: '', address: '', phone: '' }); setOpen(true) }
  const openEdit = (b: Branch) => { setEditing(b); form.reset({ code: b.code, name: b.name, address: b.address ?? '', phone: b.phone ?? '' }); setOpen(true) }

  const onSubmit = async (values: z.infer<typeof schema>) => {
    try {
      setSaving(true)
      if (editing) await branchApi.update(editing.id, values)
      else await branchApi.create(values)
      toast.success(editing ? 'แก้ไขสาขาสำเร็จ' : 'เพิ่มสาขาสำเร็จ')
      mutate(); setOpen(false)
    } catch (e) { apiToastError(e) }
    finally { setSaving(false) }
  }

  const onDelete = async (id: string) => {
    if (!confirm('ยืนยันลบสาขานี้?')) return
    try { await branchApi.delete(id); toast.success('ลบสาขาแล้ว'); mutate() }
    catch (e) { apiToastError(e) }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">สาขา</h1>
        <Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" />เพิ่มสาขา</Button>
      </div>
      <Card>
        <CardHeader><CardTitle>สาขาทั้งหมด</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? <div className="py-10 text-center text-muted-foreground">กำลังโหลด...</div> : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>รหัส</TableHead><TableHead>ชื่อสาขา</TableHead><TableHead>เบอร์โทร</TableHead>
                    <TableHead>สำนักงานใหญ่</TableHead><TableHead>สถานะ</TableHead><TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {branches?.map(b => (
                    <TableRow key={b.id}>
                      <TableCell className="font-mono font-medium">{b.code}</TableCell>
                      <TableCell>{b.name}</TableCell>
                      <TableCell>{b.phone}</TableCell>
                      <TableCell>{b.code === 'HQ' ? <span className="text-xs bg-gold-100 text-gold-700 px-2 py-0.5 rounded-full">HQ</span> : '—'}</TableCell>
                      <TableCell><span className={`text-xs px-2 py-0.5 rounded-full ${b.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{b.is_active ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}</span></TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEdit(b)}><Pencil className="mr-2 h-4 w-4" />แก้ไข</DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600" onClick={() => onDelete(b.id)}><Trash2 className="mr-2 h-4 w-4" />ลบ</DropdownMenuItem>
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'แก้ไขสาขา' : 'เพิ่มสาขา'}</DialogTitle></DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="code" render={({ field }) => (
                  <FormItem><FormLabel>รหัสสาขา</FormLabel><FormControl><Input placeholder="HQ" disabled={!!editing} {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem><FormLabel>ชื่อสาขา</FormLabel><FormControl><Input placeholder="สำนักงานใหญ่" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={form.control} name="address" render={({ field }) => (
                <FormItem><FormLabel>ที่อยู่</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem><FormLabel>เบอร์โทร</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
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
