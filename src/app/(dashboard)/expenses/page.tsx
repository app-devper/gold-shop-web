'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { format } from 'date-fns'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'

import { expenseApi } from '@/lib/gold-api'
import { apiToastError } from '@/lib/api-toast'
import { useAuthStore } from '@/store/auth'
import type { Expense, ExpenseCategory } from '@/types/gold'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const schema = z.object({
  category_id: z.string().min(1, 'Category is required'),
  description: z.string().min(1, 'Description is required'),
  amount: z.coerce.number().positive('Amount must be positive'),
  expense_date: z.string().min(1, 'Date is required'),
  receipt_number: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
})

type FormValues = {
  category_id: string; description: string; amount: number
  expense_date: string; receipt_number: string; notes: string
}

const statusColor: Record<string, string> = {
  pending: 'bg-gold-100 text-gold-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
}

const fmt = (n: number) => new Intl.NumberFormat('th-TH', { maximumFractionDigits: 0 }).format(n)

export default function ExpensesPage() {
  const branchId = useAuthStore(s => s.branchId)
  const { data: expenses, isLoading, mutate } = useSWR<Expense[]>(
    branchId ? ['expenses', branchId] : null,
    () => expenseApi.list({ branch_id: branchId! }),
  )
  const { data: categories } = useSWR<ExpenseCategory[]>('expense-categories', expenseApi.categories)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      category_id: '', description: '', amount: 0,
      expense_date: new Date().toISOString().split('T')[0],
      receipt_number: '', notes: '',
    },
  })

  const onSubmit = async (values: FormValues) => {
    try {
      setSaving(true)
      await expenseApi.create(values)
      toast.success('บันทึกค่าใช้จ่ายสำเร็จ')
      mutate(); setOpen(false)
    } catch (e) { apiToastError(e) }
    finally { setSaving(false) }
  }

  const getCategoryName = (id: string) => categories?.find(c => c.id === id)?.name ?? '—'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">ค่าใช้จ่าย</h1>
        <Button onClick={() => { form.reset({ category_id: '', description: '', amount: 0, expense_date: new Date().toISOString().split('T')[0], receipt_number: '', notes: '' }); setOpen(true) }} className="gap-2">
          <Plus className="h-4 w-4" />เพิ่มค่าใช้จ่าย
        </Button>
      </div>

      <Card>
        <CardHeader><CardTitle>ค่าใช้จ่ายทั้งหมด ({expenses?.length ?? 0})</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? <div className="py-10 text-center text-muted-foreground">กำลังโหลด...</div> : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>เลขที่</TableHead><TableHead>หมวดหมู่</TableHead><TableHead>รายละเอียด</TableHead>
                    <TableHead>จำนวนเงิน</TableHead><TableHead>วันที่</TableHead><TableHead>สถานะ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!expenses?.length ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">ไม่มีรายการค่าใช้จ่าย</TableCell></TableRow>
                  ) : expenses.map(e => (
                    <TableRow key={e.id}>
                      <TableCell className="font-mono text-sm">{e.expense_number}</TableCell>
                      <TableCell>{getCategoryName(e.category_id)}</TableCell>
                      <TableCell>{e.description}</TableCell>
                      <TableCell className="font-medium">฿{fmt(e.amount)}</TableCell>
                      <TableCell>{format(new Date(e.expense_date), 'dd MMM yyyy')}</TableCell>
                      <TableCell>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[e.status]}`}>{e.status}</span>
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
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader><DialogTitle>เพิ่มค่าใช้จ่าย</DialogTitle></DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-4">
              <FormField control={form.control} name="category_id" render={({ field }) => (
                <FormItem><FormLabel>หมวดหมู่</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="เลือกหมวดหมู่" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {categories?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select><FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem><FormLabel>รายละเอียด</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="amount" render={({ field }) => (
                  <FormItem><FormLabel>จำนวนเงิน (฿)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="expense_date" render={({ field }) => (
                  <FormItem><FormLabel>วันที่</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={form.control} name="receipt_number" render={({ field }) => (
                <FormItem><FormLabel>เลขที่ใบเสร็จ</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="notes" render={({ field }) => (
                <FormItem><FormLabel>หมายเหตุ</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
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
