'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { UserCircle, KeyRound, Save } from 'lucide-react'
import { umApi } from '@/lib/api'
import { useAuthStore } from '@/store/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

interface UserInfo {
  id: string
  firstName: string
  lastName: string
  username: string
  phone: string
  email: string
  role: string
  status: string
}

export default function ProfilePage() {
  const role = useAuthStore((state) => state.userRole)
  const [user, setUser] = useState<UserInfo | null>(null)
  const [loading, setLoading] = useState(true)

  const [infoForm, setInfoForm] = useState({ firstName: '', lastName: '', phone: '', email: '' })
  const [savingInfo, setSavingInfo] = useState(false)

  const [pwForm, setPwForm] = useState({ oldPassword: '', newPassword: '', confirm: '' })
  const [savingPw, setSavingPw] = useState(false)

  useEffect(() => {
    umApi.get('/user/info')
      .then(r => {
        const u: UserInfo = r.data
        setUser(u)
        setInfoForm({ firstName: u.firstName ?? '', lastName: u.lastName ?? '', phone: u.phone ?? '', email: u.email ?? '' })
      })
      .catch(() => toast.error('โหลดข้อมูลไม่สำเร็จ'))
      .finally(() => setLoading(false))
  }, [])

  async function handleSaveInfo() {
    if (!user) return
    setSavingInfo(true)
    try {
      await umApi.put(`/user/${user.id}`, infoForm)
      setUser(prev => prev ? { ...prev, ...infoForm } : prev)
      toast.success('อัปเดตข้อมูลแล้ว')
    } catch {
      toast.error('บันทึกไม่สำเร็จ')
    } finally {
      setSavingInfo(false)
    }
  }

  async function handleChangePassword() {
    if (!pwForm.oldPassword || !pwForm.newPassword) return toast.error('กรุณากรอกรหัสผ่านให้ครบ')
    if (pwForm.newPassword.length < 8) return toast.error('รหัสผ่านใหม่ต้องอย่างน้อย 8 ตัวอักษร')
    if (pwForm.newPassword !== pwForm.confirm) return toast.error('รหัสผ่านใหม่ไม่ตรงกัน')
    setSavingPw(true)
    try {
      await umApi.put('/user/change-password', { oldPassword: pwForm.oldPassword, newPassword: pwForm.newPassword })
      toast.success('เปลี่ยนรหัสผ่านแล้ว')
      setPwForm({ oldPassword: '', newPassword: '', confirm: '' })
    } catch (e: any) {
      toast.error(e.response?.data?.message ?? 'เปลี่ยนรหัสผ่านไม่สำเร็จ')
    } finally {
      setSavingPw(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500" />
      </div>
    )
  }

  const roleColor: Record<string, 'default' | 'secondary' | 'destructive'> = {
    SUPER: 'destructive',
    ADMIN: 'default',
    USER: 'secondary',
  }

  const displayRole = user?.role ?? role ?? 'USER'

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">โปรไฟล์ของฉัน</h1>

      {/* User summary */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-yellow-100 flex items-center justify-center">
              <UserCircle className="h-10 w-10 text-yellow-600" />
            </div>
            <div>
              <p className="text-lg font-semibold">
                {[user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.username}
              </p>
              <p className="text-sm text-muted-foreground">@{user?.username}</p>
              <div className="flex gap-2 mt-1">
                <Badge variant={roleColor[displayRole] ?? 'secondary'}>{displayRole}</Badge>
                <Badge variant={user?.status === 'ACTIVE' ? 'default' : 'secondary'}>
                  {user?.status}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <UserCircle className="h-4 w-4" />
            ข้อมูลส่วนตัว
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>ชื่อ</Label>
              <Input value={infoForm.firstName} onChange={e => setInfoForm(f => ({ ...f, firstName: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>นามสกุล</Label>
              <Input value={infoForm.lastName} onChange={e => setInfoForm(f => ({ ...f, lastName: e.target.value }))} />
            </div>
          </div>
          <div className="space-y-1">
            <Label>โทรศัพท์</Label>
            <Input value={infoForm.phone} onChange={e => setInfoForm(f => ({ ...f, phone: e.target.value }))} />
          </div>
          <div className="space-y-1">
            <Label>อีเมล</Label>
            <Input type="email" value={infoForm.email} onChange={e => setInfoForm(f => ({ ...f, email: e.target.value }))} />
          </div>
          <Separator />
          <div className="flex justify-end">
            <Button onClick={handleSaveInfo} disabled={savingInfo} className="bg-yellow-500 hover:bg-yellow-600 text-white">
              <Save className="h-4 w-4 mr-2" />
              {savingInfo ? 'กำลังบันทึก…' : 'บันทึก'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Change password */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <KeyRound className="h-4 w-4" />
            เปลี่ยนรหัสผ่าน
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label>รหัสผ่านเดิม</Label>
            <Input type="password" value={pwForm.oldPassword} onChange={e => setPwForm(f => ({ ...f, oldPassword: e.target.value }))} />
          </div>
          <div className="space-y-1">
            <Label>รหัสผ่านใหม่ (อย่างน้อย 8 ตัว)</Label>
            <Input type="password" value={pwForm.newPassword} onChange={e => setPwForm(f => ({ ...f, newPassword: e.target.value }))} />
          </div>
          <div className="space-y-1">
            <Label>ยืนยันรหัสผ่านใหม่</Label>
            <Input
              type="password"
              value={pwForm.confirm}
              onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && handleChangePassword()}
            />
          </div>
          <Separator />
          <div className="flex justify-end">
            <Button onClick={handleChangePassword} disabled={savingPw} variant="outline">
              <KeyRound className="h-4 w-4 mr-2" />
              {savingPw ? 'กำลังเปลี่ยน…' : 'เปลี่ยนรหัสผ่าน'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
