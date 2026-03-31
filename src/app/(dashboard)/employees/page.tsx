'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Plus, Pencil, Trash2, MoreHorizontal, Search } from 'lucide-react'
import { toast } from 'sonner'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'

import { employeeApi, branchApi } from '@/lib/gold-api'
import { umApi } from '@/lib/api'
import type { Employee, Branch } from '@/types/gold'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface UmUser {
  id: string
  firstName: string
  lastName: string
  username: string
  role: string
  status: string
}

const schema = z.object({
  userId: z.string().min(1, 'กรุณาเลือก User'),
  branchId: z.string().min(1, 'กรุณาเลือกสาขา'),
  role: z.enum(['ADMIN', 'MANAGER', 'STAFF']),
})

export default function EmployeesPage() {
  const { data: employees, isLoading, mutate } = useSWR<Employee[]>('employees', employeeApi.list)
  const { data: branches } = useSWR<Branch[]>('branches', branchApi.list)
  const { data: umUsers } = useSWR<UmUser[]>('um-users', () => umApi.get('/user').then(r => r.data))
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Employee | null>(null)
  const [saving, setSaving] = useState(false)
  const [userSearch, setUserSearch] = useState('')

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { userId: '', branchId: '', role: 'STAFF' },
  })

  const openCreate = () => {
    setEditing(null)
    form.reset({ userId: '', branchId: '', role: 'STAFF' })
    setUserSearch('')
    setOpen(true)
  }
  const openEdit = (e: Employee) => {
    setEditing(e)
    form.reset({ userId: e.userId, branchId: e.branchId, role: e.role })
    setUserSearch('')
    setOpen(true)
  }

  const onSubmit = async (values: z.infer<typeof schema>) => {
    try {
      setSaving(true)
      if (editing) await employeeApi.update(editing.id, values)
      else await employeeApi.create(values)
      toast.success(editing ? 'แก้ไขพนักงานสำเร็จ' : 'เพิ่มพนักงานสำเร็จ')
      mutate(); setOpen(false)
    } catch (e: any) { toast.error(e.response?.data?.message || 'เกิดข้อผิดพลาด') }
    finally { setSaving(false) }
  }

  const onDelete = async (id: string) => {
    if (!confirm('ยืนยันลบพนักงานนี้?')) return
    try { await employeeApi.delete(id); toast.success('ลบพนักงานแล้ว'); mutate() }
    catch (e: any) { toast.error(e.response?.data?.message || 'เกิดข้อผิดพลาด') }
  }

  const getBranchName = (id: string) => branches?.find(b => b.id === id)?.name ?? id
  const getUserName = (userId: string) => {
    const u = umUsers?.find(u => u.id === userId)
    return u ? `${u.firstName} ${u.lastName} (${u.username})` : userId
  }

  const filteredUsers = umUsers?.filter(u =>
    u.status === 'ACTIVE' &&
    (`${u.firstName} ${u.lastName} ${u.username}`).toLowerCase().includes(userSearch.toLowerCase())
  ) ?? []

  const roleColor: Record<string, string> = {
    ADMIN: 'bg-red-100 text-red-700',
    MANAGER: 'bg-blue-100 text-blue-700',
    STAFF: 'bg-gray-100 text-gray-600',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">พนักงาน</h1>
        <Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" />เพิ่มพนักงาน</Button>
      </div>
      <Card>
        <CardHeader><CardTitle>พนักงานทั้งหมด ({employees?.length ?? 0})</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? <div className="py-10 text-center text-muted-foreground">กำลังโหลด...</div> : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ชื่อ-นามสกุล</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>สาขา</TableHead>
                    <TableHead>ตำแหน่ง</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!employees?.length ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">ไม่มีพนักงาน</TableCell></TableRow>
                  ) : employees.map(e => {
                    const u = umUsers?.find(u => u.id === e.userId)
                    return (
                      <TableRow key={e.id}>
                        <TableCell className="font-medium">{u ? `${u.firstName} ${u.lastName}` : '—'}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{u?.username ?? e.userId}</TableCell>
                        <TableCell>{getBranchName(e.branchId)}</TableCell>
                        <TableCell>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleColor[e.role] ?? ''}`}>{e.role}</span>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEdit(e)}><Pencil className="mr-2 h-4 w-4" />แก้ไข</DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600" onClick={() => onDelete(e.id)}><Trash2 className="mr-2 h-4 w-4" />ลบ</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editing ? 'แก้ไขพนักงาน' : 'เพิ่มพนักงาน'}</DialogTitle></DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* User picker */}
              <FormField control={form.control} name="userId" render={({ field }) => (
                <FormItem>
                  <FormLabel>ผู้ใช้ (จากระบบ UM)</FormLabel>
                  {editing ? (
                    <div className="rounded-lg border bg-muted/50 px-3 py-2 text-sm">{getUserName(field.value)}</div>
                  ) : (
                    <div className="space-y-2">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="ค้นหาชื่อ หรือ username..."
                          className="pl-8"
                          value={userSearch}
                          onChange={e => setUserSearch(e.target.value)}
                        />
                      </div>
                      {field.value && (
                        <div className="rounded-lg bg-yellow-50 border border-yellow-200 px-3 py-2 text-sm font-medium">
                          ✓ {getUserName(field.value)}
                        </div>
                      )}
                      {userSearch && (
                        <div className="rounded-lg border divide-y max-h-48 overflow-y-auto">
                          {filteredUsers.length === 0
                            ? <p className="text-center text-sm text-muted-foreground py-3">ไม่พบผู้ใช้</p>
                            : filteredUsers.map(u => (
                              <button key={u.id} type="button"
                                onClick={() => { field.onChange(u.id); setUserSearch('') }}
                                className="w-full text-left px-3 py-2 hover:bg-yellow-50 transition-colors">
                                <p className="font-medium text-sm">{u.firstName} {u.lastName}</p>
                                <p className="text-xs text-muted-foreground">{u.username} · {u.role}</p>
                              </button>
                            ))
                          }
                        </div>
                      )}
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="branchId" render={({ field }) => (
                <FormItem><FormLabel>สาขา</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="เลือกสาขา" /></SelectTrigger></FormControl>
                    <SelectContent>{branches?.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
                  </Select><FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="role" render={({ field }) => (
                <FormItem><FormLabel>ตำแหน่ง</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="ADMIN">ADMIN</SelectItem>
                      <SelectItem value="MANAGER">MANAGER</SelectItem>
                      <SelectItem value="STAFF">STAFF</SelectItem>
                    </SelectContent>
                  </Select><FormMessage />
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
