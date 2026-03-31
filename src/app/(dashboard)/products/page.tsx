'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Plus, Pencil, Trash2, MoreHorizontal } from 'lucide-react'
import { toast } from 'sonner'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'

import { productApi, categoryApi } from '@/lib/gold-api'
import type { Product, ProductCategory } from '@/types/gold'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const schema = z.object({
  sku: z.string().min(1),
  name: z.string().min(1),
  category_id: z.string().min(1),
  gold_type: z.string().min(1),
  stock_type: z.enum(['piece', 'weight']),
  weight: z.coerce.number().min(0),
  labor_cost: z.coerce.number().min(0),
  description: z.string().optional().or(z.literal('')),
})

type FormValues = {
  sku: string; name: string; category_id: string; gold_type: string
  stock_type: 'piece' | 'weight'; weight: number; labor_cost: number; description: string
}

const statusColor: Record<string, string> = {
  available: 'bg-green-100 text-green-700',
  sold: 'bg-gray-100 text-gray-500',
  reserved: 'bg-blue-100 text-blue-700',
  pawned: 'bg-orange-100 text-orange-700',
}

const fmt = (n: number) => new Intl.NumberFormat('th-TH', { maximumFractionDigits: 2 }).format(n)

export default function ProductsPage() {
  const { data: products, isLoading, mutate } = useSWR<Product[]>('products', () => productApi.list())
  const { data: categories } = useSWR<ProductCategory[]>('categories', categoryApi.list)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [saving, setSaving] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as any,
    defaultValues: { sku: '', name: '', category_id: '', gold_type: '96.5%', stock_type: 'piece', weight: 0, labor_cost: 0, description: '' },
  })

  const openCreate = () => {
    setEditing(null)
    form.reset({ sku: '', name: '', category_id: '', gold_type: '96.5%', stock_type: 'piece', weight: 0, labor_cost: 0, description: '' })
    setOpen(true)
  }
  const openEdit = (p: Product) => {
    setEditing(p)
    form.reset({ sku: p.sku, name: p.name, category_id: p.category_id, gold_type: p.gold_type, stock_type: p.stock_type, weight: p.weight, labor_cost: p.labor_cost, description: p.description ?? '' })
    setOpen(true)
  }

  const onSubmit = async (values: FormValues) => {
    try {
      setSaving(true)
      if (editing) await productApi.update(editing.id, values)
      else await productApi.create(values)
      toast.success(editing ? 'แก้ไขสินค้าสำเร็จ' : 'เพิ่มสินค้าสำเร็จ')
      mutate(); setOpen(false)
    } catch (e: any) { toast.error(e.response?.data?.message || 'เกิดข้อผิดพลาด') }
    finally { setSaving(false) }
  }

  const onDelete = async (id: string) => {
    if (!confirm('ยืนยันลบสินค้านี้?')) return
    try { await productApi.delete(id); toast.success('ลบสินค้าแล้ว'); mutate() }
    catch (e: any) { toast.error(e.response?.data?.message || 'เกิดข้อผิดพลาด') }
  }

  const getCategoryName = (id: string) => categories?.find(c => c.id === id)?.name ?? '—'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">สินค้า</h1>
        <Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" />เพิ่มสินค้า</Button>
      </div>
      <Card>
        <CardHeader><CardTitle>สินค้าทั้งหมด ({products?.length ?? 0})</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? <div className="py-10 text-center text-muted-foreground">กำลังโหลด...</div> : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>รหัสสินค้า</TableHead><TableHead>ชื่อสินค้า</TableHead><TableHead>หมวดหมู่</TableHead>
                    <TableHead>ประเภททอง</TableHead><TableHead>น้ำหนัก</TableHead><TableHead>ค่าแรง</TableHead>
                    <TableHead>สถานะ</TableHead><TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products?.map(p => (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono text-sm">{p.sku}</TableCell>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell>{getCategoryName(p.category_id)}</TableCell>
                      <TableCell>{p.gold_type}</TableCell>
                      <TableCell>{fmt(p.weight)}g</TableCell>
                      <TableCell>฿{fmt(p.labor_cost)}</TableCell>
                      <TableCell><span className={`text-xs px-2 py-0.5 rounded-full ${statusColor[p.status]}`}>{p.status}</span></TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEdit(p)}><Pencil className="mr-2 h-4 w-4" />แก้ไข</DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600" onClick={() => onDelete(p.id)}><Trash2 className="mr-2 h-4 w-4" />ลบ</DropdownMenuItem>
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
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader><DialogTitle>{editing ? 'แก้ไขสินค้า' : 'เพิ่มสินค้า'}</DialogTitle></DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="sku" render={({ field }) => (
                  <FormItem><FormLabel>รหัสสินค้า</FormLabel><FormControl><Input disabled={!!editing} {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem><FormLabel>ชื่อสินค้า</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="category_id" render={({ field }) => (
                  <FormItem><FormLabel>หมวดหมู่</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="เลือก" /></SelectTrigger></FormControl>
                      <SelectContent>{categories?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                    </Select><FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="gold_type" render={({ field }) => (
                  <FormItem><FormLabel>ประเภททอง</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="96.5%">96.5% (ทองรูปพรรณ)</SelectItem>
                        <SelectItem value="99.99%">99.99% (ทองคำแท่ง)</SelectItem>
                      </SelectContent>
                    </Select><FormMessage />
                  </FormItem>
                )} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <FormField control={form.control} name="stock_type" render={({ field }) => (
                  <FormItem><FormLabel>ประเภทสต็อก</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="piece">ชิ้น</SelectItem>
                        <SelectItem value="weight">น้ำหนัก</SelectItem>
                      </SelectContent>
                    </Select><FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="weight" render={({ field }) => (
                  <FormItem><FormLabel>น้ำหนัก (g)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="labor_cost" render={({ field }) => (
                  <FormItem><FormLabel>ค่าแรง (฿)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem><FormLabel>รายละเอียด</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
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
