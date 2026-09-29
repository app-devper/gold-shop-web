'use client'

import { useState, useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { toast } from 'sonner'
import { umApi } from '@/lib/api'
import { apiErrorMessage } from '@/lib/utils'
import { useAuthStore } from '@/store/auth'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const formSchema = z.object({
  id: z.string().optional(),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  role: z.string().min(1),
  status: z.enum(['ACTIVE', 'INACTIVE']),
  password: z.string().optional(),
}).refine(data => {
  if (!data.id && !data.password) {
    return false
  }
  return true
}, {
  message: "Password is required for new users",
  path: ["password"]
})

export interface UmUser {
  id: string
  firstName?: string
  lastName?: string
  username?: string
  email?: string
  phone?: string
  role?: string
  status?: string
  /** What the signed-in user may do to this user, as UM decides it (um-api ADR-0006). */
  can?: UmUserPermissions
}

export interface UmUserPermissions {
  edit: boolean
  delete: boolean
  setStatus: boolean
  setRole: boolean
  setPassword: boolean
  unlock: boolean
  assignableRoles: string[]
}

export function UserDialog({
  user,
  open,
  onOpenChange,
  onSuccess,
  creatableRoles,
}: {
  user: UmUser | null
  /** Roles UM lets the signed-in user create (GET /user/rules). */
  creatableRoles: string[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}) {
  const [isLoading, setIsLoading] = useState(false)
  const clientId = useAuthStore((s) => s.clientId) ?? ''
  const isEditing = !!user
  // Roles offered: what UM allows for this user (plus its current role), or
  // what the signed-in user may create. SUPER is never offered in the UI.
  const offerable = (roles: string[]) => roles.filter((r) => r !== 'SUPER')
  const roleOptions = user
    ? Array.from(new Set([user.role ?? '', ...(user.can?.setRole ? offerable(user.can.assignableRoles) : [])])).filter(Boolean)
    : offerable(creatableRoles)
  const canSetRole = user ? !!user.can?.setRole : roleOptions.length > 1
  const canSetStatus = !user || !!user.can?.setStatus
  const defaultRole = roleOptions.includes('USER') ? 'USER' : roleOptions[0] ?? 'USER'

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      username: '',
      email: '',
      phone: '',
      role: 'USER',
      status: 'ACTIVE',
      password: '',
    },
  })

  useEffect(() => {
    if (open) {
      if (user) {
        form.reset({
          id: user.id,
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          username: user.username || '',
          email: user.email || '',
          phone: user.phone || '',
          role: user.role || 'USER',
          status: user.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
          password: '',
        })
      } else {
        form.reset({
          firstName: '',
          lastName: '',
          username: '',
          email: '',
          phone: '',
          role: defaultRole,
          status: 'ACTIVE',
          password: '',
        })
      }
    }
  }, [user, open, form, defaultRole])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsLoading(true)
      
      if (user) {
        await umApi.put(`/user/${user.id}`, {
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email || undefined,
          phone: values.phone || undefined,
        })

        if (canSetRole && values.role !== user.role) {
          await umApi.patch(`/user/${user.id}/role`, { role: values.role })
        }

        if (canSetStatus && values.status !== user.status) {
          await umApi.patch(`/user/${user.id}/status`, { status: values.status })
        }

        toast.success('แก้ไขผู้ใช้สำเร็จ')
      } else {
        await umApi.post('/user', {
          firstName: values.firstName,
          lastName: values.lastName,
          username: values.username,
          email: values.email || undefined,
          phone: values.phone || undefined,
          clientId: clientId,
          password: values.password,
          role: values.role,
        })
        toast.success('เพิ่มผู้ใช้สำเร็จ')
      }
      
      onSuccess()
      onOpenChange(false)
    } catch (error) {
      toast.error(apiErrorMessage(error, `ไม่สามารถ${isEditing ? 'แก้ไข' : 'เพิ่ม'}ผู้ใช้ได้`))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'แก้ไขผู้ใช้' : 'เพิ่มผู้ใช้'}</DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'แก้ไขข้อมูลผู้ใช้' 
              : 'เพิ่มผู้ใช้ใหม่เข้าสู่ระบบ'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ชื่อ</FormLabel>
                    <FormControl>
                      <Input placeholder="สมชาย" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>นามสกุล</FormLabel>
                    <FormControl>
                      <Input placeholder="ใจดี" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ชื่อผู้ใช้</FormLabel>
                  <FormControl>
                    <Input placeholder="username" disabled={isEditing} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!isEditing && (
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>รหัสผ่าน</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>อีเมล</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="example@email.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>เบอร์โทรศัพท์</FormLabel>
                    <FormControl>
                      <Input placeholder="0812345678" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ตำแหน่ง</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!canSetRole}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="เลือกตำแหน่ง" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {roleOptions.map((r) => (
                          <SelectItem key={r} value={r}>{r}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>สถานะ</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!canSetStatus}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="เลือกสถานะ" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                        <SelectItem value="INACTIVE">INACTIVE</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                ยกเลิก
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'กำลังบันทึก...' : 'บันทึก'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
