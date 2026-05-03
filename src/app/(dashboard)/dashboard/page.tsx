'use client'

import Link from 'next/link'
import useSWR from 'swr'
import { format } from 'date-fns'
import { th } from 'date-fns/locale'
import { TrendingUp, ShoppingCart, Landmark, PiggyBank, AlertTriangle, CheckCircle, RefreshCw, ArrowDownLeft, ArrowUpRight, Gem } from 'lucide-react'
import { reportApi, goldPriceApi } from '@/lib/gold-api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { DashboardData, GoldPrice } from '@/types/gold'

const fmt = (n: number) => new Intl.NumberFormat('th-TH', { maximumFractionDigits: 0 }).format(n)

function KpiCard({ title, value, icon: Icon, color }: { title: string; value: string; icon: any; color: string }) {
  return (
    <Card>
      <CardContent className="pt-5">
        <div className={`inline-flex rounded-lg p-2 mb-3 ${color}`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-sm text-muted-foreground mt-0.5">{title}</p>
      </CardContent>
    </Card>
  )
}

const BAHT_GRAM = 15.244

function GoldPriceItem({ label, price, isUp }: { label: string; price: number; isUp: boolean }) {
  const perGram = price > 0 ? Math.round(price / BAHT_GRAM) : 0
  return (
    <div className="rounded-lg bg-white/20 px-3 py-2.5">
      <div className="flex items-center gap-1 mb-1">
        {isUp
          ? <ArrowUpRight className="h-3 w-3 text-white/80" />
          : <ArrowDownLeft className="h-3 w-3 text-white/80" />
        }
        <span className="text-white/90 text-xs truncate">{label}</span>
      </div>
      <p className="text-white font-bold text-base">฿{fmt(price)}</p>
      <p className="text-white/70 text-xs">฿{fmt(perGram)}/กรัม</p>
    </div>
  )
}

export default function DashboardPage() {
  const { data, isLoading, error, mutate } = useSWR<DashboardData>('dashboard', reportApi.dashboard)
  const { data: goldPrice, mutate: mutateGold } = useSWR<GoldPrice>('gold-price-current', goldPriceApi.current)

  const today = format(new Date(), 'EEEE d MMMM yyyy', { locale: th })

  if (isLoading) return <div className="py-20 text-center text-muted-foreground">กำลังโหลด...</div>
  if (error) return (
    <div className="py-20 text-center space-y-3">
      <p className="text-red-500">เกิดข้อผิดพลาด ไม่สามารถโหลดข้อมูลได้</p>
      <button onClick={() => mutate()} className="text-sm text-primary underline">ลองใหม่</button>
    </div>
  )

  const dueSoon = data?.due_soon_pawns ?? 0
  const activePawns = data?.active_pawns ?? 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">แดชบอร์ด</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{today}</p>
        </div>
        <button
          onClick={() => { mutate(); mutateGold() }}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          รีเฟรช
        </button>
      </div>

      {/* Gold Price Banner */}
      {goldPrice && (
        <div className="rounded-xl p-5 text-white bg-gradient-to-br from-gold-700 via-gold-500 to-gold-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Gem className="h-5 w-5" />
              <span className="font-bold text-lg">ราคาทองวันนี้ (ต่อบาท = 15.244 ก.)</span>
            </div>
            <div className="text-right">
              <p className="text-white/80 text-xs">อัปเดต: {format(new Date(goldPrice.date), 'HH:mm')}</p>
              {goldPrice.source && <p className="text-white/70 text-xs">แหล่ง: {goldPrice.source}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <GoldPriceItem label="ทองแท่ง รับซื้อ" price={goldPrice.gold_bar_buy} isUp={false} />
            <GoldPriceItem label="ทองแท่ง ขายออก" price={goldPrice.gold_bar_sell} isUp={true} />
            <GoldPriceItem label="ทองรูปพรรณ รับซื้อ" price={goldPrice.gold_ornament_buy} isUp={false} />
            <GoldPriceItem label="ทองรูปพรรณ ขายออก" price={goldPrice.gold_ornament_sell} isUp={true} />
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard title="ยอดขายวันนี้" value={`฿${fmt(data?.total_sales_today ?? 0)}`} icon={TrendingUp} color="bg-gold-500" />
        <KpiCard title="รายการวันนี้" value={String(data?.transaction_count ?? 0)} icon={ShoppingCart} color="bg-blue-500" />
        <KpiCard title="จำนำที่ยังเปิดอยู่" value={String(activePawns)} icon={Landmark} color="bg-orange-500" />
        <KpiCard title="ออมทองรวม" value={`฿${fmt(data?.gold_saving_total ?? 0)}`} icon={PiggyBank} color="bg-green-500" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Alerts */}
        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">การแจ้งเตือน</CardTitle>
            <Link href="/pawns" className="text-xs text-primary hover:underline">ดูทั้งหมด</Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {dueSoon > 0 && (
              <div className="flex items-start gap-3 rounded-lg border border-gold-200 bg-gold-50 p-3">
                <div className="rounded-lg bg-gold-500 p-2 shrink-0">
                  <AlertTriangle className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gold-800">จำนำใกล้ครบกำหนด</p>
                  <p className="text-xs text-gold-700">{dueSoon} รายการภายใน 7 วัน</p>
                </div>
              </div>
            )}
            {activePawns > 0 && (
              <div className="flex items-start gap-3 rounded-lg border border-gold-200 bg-gold-50/50 p-3">
                <div className="rounded-lg bg-gold-600 p-2 shrink-0">
                  <Landmark className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold">จำนำที่ยังเปิดอยู่</p>
                  <p className="text-xs text-muted-foreground">{activePawns} รายการ</p>
                </div>
              </div>
            )}
            {dueSoon === 0 && activePawns === 0 && (
              <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-3">
                <div className="rounded-lg bg-green-500 p-2 shrink-0">
                  <CheckCircle className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-green-800">ไม่มีรายการแจ้งเตือน</p>
                  <p className="text-xs text-green-700">ทุกอย่างเรียบร้อย</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">สรุปวันนี้</CardTitle>
            <Link href="/reports" className="text-xs text-primary hover:underline">ดูรายงาน</Link>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-gold-50 border border-gold-100 p-4">
                <p className="text-xs text-muted-foreground mb-1">ยอดขายวันนี้</p>
                <p className="text-2xl font-bold text-gold-700">฿{fmt(data?.total_sales_today ?? 0)}</p>
                <p className="text-xs text-muted-foreground mt-1">{data?.transaction_count ?? 0} รายการ</p>
              </div>
              <div className="rounded-lg bg-blue-50 border border-blue-100 p-4">
                <p className="text-xs text-muted-foreground mb-1">จำนำคงค้าง</p>
                <p className="text-2xl font-bold text-blue-700">{activePawns}</p>
                <p className="text-xs text-muted-foreground mt-1">ใกล้ครบกำหนด {dueSoon} รายการ</p>
              </div>
              <div className="rounded-lg bg-green-50 border border-green-100 p-4 col-span-2">
                <p className="text-xs text-muted-foreground mb-1">ยอดออมทองรวม</p>
                <p className="text-2xl font-bold text-green-700">฿{fmt(data?.gold_saving_total ?? 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
