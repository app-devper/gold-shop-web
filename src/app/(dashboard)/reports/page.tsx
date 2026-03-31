'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { format, subDays } from 'date-fns'
import { reportApi } from '@/lib/gold-api'
import type { ProfitLossReport, TopProduct, EmployeePerformance, SalesTrend } from '@/types/gold'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

const fmt = (n: number) => new Intl.NumberFormat('th-TH', { maximumFractionDigits: 0 }).format(n)
const fmtPct = (n: number, total: number) => total > 0 ? `${((n / total) * 100).toFixed(1)}%` : '—'

export default function ReportsPage() {
  const today = format(new Date(), 'yyyy-MM-dd')
  const monthStart = format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd')

  const [from, setFrom] = useState(monthStart)
  const [to, setTo] = useState(today)
  const [query, setQuery] = useState({ from: monthStart, to: today })

  const { data: pl, isLoading: plLoading } = useSWR<ProfitLossReport>(
    ['report-pl', query.from, query.to],
    () => reportApi.profitLoss({ from: query.from, to: query.to })
  )
  const { data: topProducts } = useSWR<TopProduct[]>(
    ['report-top', query.from, query.to],
    () => reportApi.topProducts({ from: query.from, to: query.to, limit: 10 })
  )
  const { data: empPerf } = useSWR<EmployeePerformance[]>(
    ['report-emp', query.from, query.to],
    () => reportApi.employeePerformance({ from: query.from, to: query.to })
  )
  const { data: trends } = useSWR<SalesTrend[]>(
    ['report-trends', query.from, query.to],
    () => reportApi.trends({ from: query.from, to: query.to })
  )

  const applyFilter = () => setQuery({ from, to })

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">รายงาน</h1>

      {/* Date Filter */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-end gap-4">
            <div className="space-y-1">
              <Label>ตั้งแต่วันที่</Label>
              <Input type="date" value={from} onChange={e => setFrom(e.target.value)} className="w-40" />
            </div>
            <div className="space-y-1">
              <Label>ถึงวันที่</Label>
              <Input type="date" value={to} onChange={e => setTo(e.target.value)} className="w-40" />
            </div>
            <div className="flex gap-2">
              <Button onClick={applyFilter}>ค้นหา</Button>
              <Button variant="outline" onClick={() => { const d = format(subDays(new Date(), 7), 'yyyy-MM-dd'); setFrom(d); setTo(today); setQuery({ from: d, to: today }) }}>7 วันล่าสุด</Button>
              <Button variant="outline" onClick={() => { setFrom(monthStart); setTo(today); setQuery({ from: monthStart, to: today }) }}>เดือนนี้</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profit & Loss Summary */}
      {plLoading ? (
        <div className="py-10 text-center text-muted-foreground">กำลังโหลดรายงาน...</div>
      ) : pl ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: 'รายได้รวม', value: pl.total_revenue, color: 'text-green-700' },
            { label: 'ต้นทุนทอง', value: pl.cost_of_gold_sold, color: 'text-red-600' },
            { label: 'ค่าใช้จ่าย', value: pl.total_expenses, color: 'text-orange-600' },
            { label: 'กำไรขั้นต้น', value: pl.gross_profit, color: 'text-blue-700' },
            { label: 'กำไรสุทธิ', value: pl.net_profit, color: 'text-purple-700' },
            { label: 'รายได้จำนำ', value: pl.pawn_interest_revenue, color: 'text-gray-700' },
          ].map(({ label, value, color }) => (
            <Card key={label}>
              <CardHeader className="pb-1"><CardTitle className="text-xs text-muted-foreground">{label}</CardTitle></CardHeader>
              <CardContent><p className={`text-xl font-bold ${color}`}>฿{fmt(value)}</p></CardContent>
            </Card>
          ))}
        </div>
      ) : null}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <Card>
          <CardHeader><CardTitle>สินค้าขายดี</CardTitle></CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead><TableHead>สินค้า</TableHead>
                    <TableHead>จำนวน</TableHead><TableHead>รายได้</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topProducts?.map((p, i) => (
                    <TableRow key={p.product_id}>
                      <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                      <TableCell className="font-medium">{p.product_name}</TableCell>
                      <TableCell>{p.total_qty}</TableCell>
                      <TableCell>฿{fmt(p.total_rev)}</TableCell>
                    </TableRow>
                  ))}
                  {!topProducts?.length && (
                    <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-6">ไม่มีข้อมูล</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Employee Performance */}
        <Card>
          <CardHeader><CardTitle>ผลงานพนักงาน</CardTitle></CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>พนักงาน</TableHead><TableHead>ยอดขาย</TableHead>
                    <TableHead>จำนวนบิล</TableHead><TableHead>เฉลี่ย/บิล</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {empPerf?.map(e => (
                    <TableRow key={e.user_id}>
                      <TableCell className="font-medium">{e.full_name}</TableCell>
                      <TableCell>฿{fmt(e.total_sales)}</TableCell>
                      <TableCell>{e.sale_count}</TableCell>
                      <TableCell>฿{fmt(e.avg_sale_value)}</TableCell>
                    </TableRow>
                  ))}
                  {!empPerf?.length && (
                    <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-6">ไม่มีข้อมูล</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sales Trends */}
      <Card>
        <CardHeader><CardTitle>แนวโน้มยอดขายรายวัน</CardTitle></CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>วันที่</TableHead><TableHead>รายได้</TableHead><TableHead>ต้นทุน</TableHead>
                  <TableHead>กำไร</TableHead><TableHead>มาร์จิ้น</TableHead><TableHead>บิล</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trends?.map(t => (
                  <TableRow key={t.date}>
                    <TableCell>{t.date}</TableCell>
                    <TableCell>฿{fmt(t.revenue)}</TableCell>
                    <TableCell>฿{fmt(t.cost)}</TableCell>
                    <TableCell className={t.profit >= 0 ? 'text-green-700 font-medium' : 'text-red-600 font-medium'}>
                      ฿{fmt(t.profit)}
                    </TableCell>
                    <TableCell>{fmtPct(t.profit, t.revenue)}</TableCell>
                    <TableCell>{t.sale_count}</TableCell>
                  </TableRow>
                ))}
                {!trends?.length && (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-6">ไม่มีข้อมูล</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
