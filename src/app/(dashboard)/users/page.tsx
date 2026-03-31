'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { format } from 'date-fns'
import { Plus, MoreHorizontal, Pencil, Trash2, KeyRound } from 'lucide-react'

import { umApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { UserDialog } from '@/components/users/user-dialog'
import { PasswordDialog } from '@/components/users/password-dialog'

// Types
export interface User {
  id: string
  firstName: string
  lastName: string
  username: string
  clientId: string
  role: string
  status: string
  phone: string
  email: string
  createdDate: string
}

// Fetcher for SWR
const fetcher = (url: string) => umApi.get(url).then((res) => res.data)

export default function UsersPage() {
  const { data: users, error, isLoading, mutate } = useSWR<User[]>('/user', fetcher)
  
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false)
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  const handleCreate = () => {
    setSelectedUser(null)
    setIsUserDialogOpen(true)
  }

  const handleEdit = (user: User) => {
    setSelectedUser(user)
    setIsUserDialogOpen(true)
  }

  const handlePassword = (user: User) => {
    setSelectedUser(user)
    setIsPasswordDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('ยืนยันลบผู้ใช้นี้?')) return
    
    try {
      await umApi.delete(`/user/${id}`)
      mutate()
    } catch (error) {
      console.error('Failed to delete user', error)
      alert('ไม่สามารถลบผู้ใช้ได้')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">จัดการผู้ใช้</h1>
        <Button onClick={handleCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          เพิ่มผู้ใช้
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>ผู้ใช้ทั้งหมด</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-10 text-center text-muted-foreground">กำลังโหลด...</div>
          ) : error ? (
            <div className="py-10 text-center text-red-500">ไม่สามารถโหลดข้อมูลได้</div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ชื่อ-นามสกุล</TableHead>
                    <TableHead>ชื่อผู้ใช้</TableHead>
                    <TableHead>ตำแหน่ง</TableHead>
                    <TableHead>สถานะ</TableHead>
                    <TableHead>วันที่สร้าง</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users?.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.firstName} {user.lastName}
                      </TableCell>
                      <TableCell>{user.username}</TableCell>
                      <TableCell>{user.role}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                          user.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {user.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        {format(new Date(user.createdDate), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>การดำเนินการ</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleEdit(user)}>
                              <Pencil className="mr-2 h-4 w-4" /> แก้ไขข้อมูล
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handlePassword(user)}>
                              <KeyRound className="mr-2 h-4 w-4" /> ตั้งรหัสผ่าน
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => handleDelete(user.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> ลบ
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                  {users?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                        ไม่พบผู้ใช้
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <UserDialog 
        user={selectedUser} 
        open={isUserDialogOpen} 
        onOpenChange={setIsUserDialogOpen}
        onSuccess={() => mutate()}
      />

      <PasswordDialog
        user={selectedUser}
        open={isPasswordDialogOpen}
        onOpenChange={setIsPasswordDialogOpen}
      />
    </div>
  )
}
