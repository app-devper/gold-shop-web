'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { toast } from 'sonner'
import { umApi } from '@/lib/api'
import { employeeApi } from '@/lib/gold-api'
import { useAuthStore } from '@/store/auth'

import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const formSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
})

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const setAuth = useAuthStore((state) => state.setAuth)
  const setUserInfo = useAuthStore((state) => state.setUserInfo)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsLoading(true)
      const systemCode = process.env.NEXT_PUBLIC_SYSTEM_CODE || 'GOLD'

      // 1. Login
      const loginRes = await umApi.post('/auth/login', {
        username: values.username,
        password: values.password,
        system: systemCode,
      })
      const token = loginRes.data.accessToken

      // 2. Get System Host + clientId
      const sysRes = await umApi.get('/auth/system', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const host = sysRes.data.host
      const clientId = sysRes.data.clientId

      // 3. Get User Info for Role
      const userRes = await umApi.get('/user/info', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const role = userRes.data.role

      // 4. Save auth (sets token+host so goldApi interceptor works)
      setAuth(token, host, role, clientId)

      // 5. Fetch employee /me to get branch name + id
      let branchName = ''
      let branchId = ''
      try {
        const emp = await employeeApi.me()
        branchName = emp.branchName || ''
        // API returns snake_case, type declares camelCase — read raw field directly.
        branchId = (emp as unknown as { branch_id?: string }).branch_id || ''
      } catch {
        // Not an employee (e.g. SUPER admin) — branch fields stay empty
      }

      setUserInfo(values.username, branchName, branchId)

      toast.success('Login successful')
      router.push('/dashboard')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gray-50">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Gold Shop Admin</CardTitle>
          <CardDescription>Enter your credentials to access the system.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="admin" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Signing in...' : 'Sign in'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
