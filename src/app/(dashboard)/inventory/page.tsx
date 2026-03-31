'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { format } from 'date-fns'
import { Eye, MoreHorizontal } from 'lucide-react'
import { toast } from 'sonner'

import { inventoryApi, branchApi } from '@/lib/gold-api'
import type { InventoryTransfer, Branch } from '@/types/gold'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

const statusColor: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-blue-100 text-blue-700',
  in_transit: 'bg-orange-100 text-orange-700',
  received: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
}

export default function InventoryPage() {
  const { data: transfers, isLoading, mutate } = useSWR<InventoryTransfer[]>('inventory-transfers', inventoryApi.list)
  const { data: branches } = useSWR<Branch[]>('branches', branchApi.list)
  const [detail, setDetail] = useState<InventoryTransfer | null>(null)

  const getBranchName = (id: string) => branches?.find(b => b.id === id)?.name ?? id

  const handleAction = async (id: string, action: 'approve' | 'receive' | 'cancel') => {
    const labels = { approve: 'อนุมัติ', receive: 'รับสินค้า', cancel: 'ยกเลิก' }
    if (!confirm(`${labels[action]}รายการโอนนี้?`)) return
    try {
      if (action === 'approve') await inventoryApi.approve(id)
      else if (action === 'receive') await inventoryApi.receive(id)
      else await inventoryApi.cancel(id)
      toast.success('บันทึกสำเร็จ')
      mutate()
    } catch (e: any) { toast.error(e.response?.data?.message || 'เกิดข้อผิดพลาด') }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">โอนสต็อก</h1>
      </div>

      <Card>
        <CardHeader><CardTitle>รายการโอนทั้งหมด ({transfers?.length ?? 0})</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? <div className="py-10 text-center text-muted-foreground">กำลังโหลด...</div> : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>เลขที่โอน</TableHead><TableHead>จากสาขา</TableHead><TableHead>ไปสาขา</TableHead>
                    <TableHead>รายการ</TableHead><TableHead>สถานะ</TableHead><TableHead>วันที่</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transfers?.map(t => (
                    <TableRow key={t.id}>
                      <TableCell className="font-mono font-medium">{t.transfer_number}</TableCell>
                      <TableCell>{getBranchName(t.from_branch_id)}</TableCell>
                      <TableCell>{getBranchName(t.to_branch_id)}</TableCell>
                      <TableCell>{t.items.length}</TableCell>
                      <TableCell>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[t.status]}`}>{t.status.replace('_', ' ')}</span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{format(new Date(t.created_at), 'dd MMM yy')}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setDetail(t)}><Eye className="mr-2 h-4 w-4" />ดูรายละเอียด</DropdownMenuItem>
                            {t.status === 'pending' && <DropdownMenuItem onClick={() => handleAction(t.id, 'approve')}>อนุมัติ</DropdownMenuItem>}
                            {t.status === 'in_transit' && <DropdownMenuItem onClick={() => handleAction(t.id, 'receive')}>รับสินค้า</DropdownMenuItem>}
                            {(t.status === 'pending' || t.status === 'in_transit') && (
                              <DropdownMenuItem className="text-red-600" onClick={() => handleAction(t.id, 'cancel')}>ยกเลิก</DropdownMenuItem>
                            )}
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

      <Dialog open={!!detail} onOpenChange={() => setDetail(null)}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader><DialogTitle>โอนสต็อค #{detail?.transfer_number}</DialogTitle></DialogHeader>
          {detail && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div><span className="text-muted-foreground">จากสาขา:</span> {getBranchName(detail.from_branch_id)}</div>
                <div><span className="text-muted-foreground">ไปสาขา:</span> {getBranchName(detail.to_branch_id)}</div>
                <div><span className="text-muted-foreground">สถานะ:</span> {detail.status}</div>
                <div><span className="text-muted-foreground">วันที่:</span> {format(new Date(detail.created_at), 'dd/MM/yyyy')}</div>
              </div>
              {detail.notes && <p className="text-muted-foreground">{detail.notes}</p>}
              <div>
                <p className="font-semibold mb-2">รายการสินค้า</p>
                <div className="rounded border divide-y">
                  {detail.items.map((item, i) => (
                    <div key={i} className="flex justify-between px-3 py-2">
                      <span className="font-medium">{item.product_id}</span>
                      <span className="text-muted-foreground">จำนวน: {item.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
