'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { RefreshCw, PenLine } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'

import { goldPriceApi } from '@/lib/gold-api'
import { apiToastError } from '@/lib/api-toast'
import type { GoldPrice } from '@/types/gold'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'

const schema = z.object({
  gold_bar_buy: z.coerce.number().positive(),
  gold_bar_sell: z.coerce.number().positive(),
  gold_ornament_buy: z.coerce.number().positive(),
  gold_ornament_sell: z.coerce.number().positive(),
})

type FormValues = {
  gold_bar_buy: number
  gold_bar_sell: number
  gold_ornament_buy: number
  gold_ornament_sell: number
}

const fmt = (n: number) => new Intl.NumberFormat('th-TH', { maximumFractionDigits: 2 }).format(n)
const fmtInt = (n: number) => new Intl.NumberFormat('th-TH', { maximumFractionDigits: 0 }).format(n)
const BAHT_GRAM = 15.244

function GoldCalculator({ current }: { current: GoldPrice }) {
  const [goldType, setGoldType] = useState<'bar' | 'ornament'>('bar')
  const [inputUnit, setInputUnit] = useState<'baht' | 'gram'>('baht')
  const [weight, setWeight] = useState('')
  const [makingFee, setMakingFee] = useState('')
  const [mode, setMode] = useState<'buy' | 'sell'>('sell')

  const weightNum = parseFloat(weight) || 0
  const makingFeeNum = parseFloat(makingFee) || 0

  // แปลงเป็นบาทไทยเสมอ
  const weightInBaht = inputUnit === 'gram' ? weightNum / BAHT_GRAM : weightNum
  const weightInGram = inputUnit === 'baht' ? weightNum * BAHT_GRAM : weightNum

  const buyPrice = goldType === 'bar' ? current.gold_bar_buy : current.gold_ornament_buy
  const sellPrice = goldType === 'bar' ? current.gold_bar_sell : current.gold_ornament_sell
  const pricePerBaht = mode === 'sell' ? sellPrice : buyPrice

  // สูตรคำนวณ
  const baseAmount = weightInBaht * pricePerBaht
  const totalAmount = goldType === 'ornament' && mode === 'sell' ? baseAmount + makingFeeNum : baseAmount

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          🧮 เครื่องคำนวณราคาทอง
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* ประเภทและโหมด */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-muted-foreground mb-1.5">ประเภทการซื้อขาย</p>
            <div className="flex gap-1">
              <button onClick={() => setMode('sell')} className={`flex-1 py-1.5 text-xs font-medium rounded-lg border transition-colors ${mode === 'sell' ? 'bg-gold-500 text-white border-gold-500' : 'border-gray-200 hover:bg-gray-50'}`}>ซื้อ (ลูกค้าซื้อ)</button>
              <button onClick={() => setMode('buy')} className={`flex-1 py-1.5 text-xs font-medium rounded-lg border transition-colors ${mode === 'buy' ? 'bg-green-500 text-white border-green-500' : 'border-gray-200 hover:bg-gray-50'}`}>รับซื้อคืน</button>
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1.5">ประเภททอง</p>
            <div className="flex gap-1">
              <button onClick={() => setGoldType('bar')} className={`flex-1 py-1.5 text-xs font-medium rounded-lg border transition-colors ${goldType === 'bar' ? 'bg-gold-500 text-white border-gold-500' : 'border-gray-200 hover:bg-gray-50'}`}>ทองแท่ง</button>
              <button onClick={() => setGoldType('ornament')} className={`flex-1 py-1.5 text-xs font-medium rounded-lg border transition-colors ${goldType === 'ornament' ? 'bg-gold-500 text-white border-gold-500' : 'border-gray-200 hover:bg-gray-50'}`}>ทองรูปพรรณ</button>
            </div>
          </div>
        </div>

        {/* น้ำหนัก */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-muted-foreground mb-1.5">หน่วยน้ำหนัก</p>
            <div className="flex gap-1">
              <button onClick={() => setInputUnit('baht')} className={`flex-1 py-1.5 text-xs font-medium rounded-lg border transition-colors ${inputUnit === 'baht' ? 'bg-gold-500 text-white border-gold-500' : 'border-gray-200 hover:bg-gray-50'}`}>บาท</button>
              <button onClick={() => setInputUnit('gram')} className={`flex-1 py-1.5 text-xs font-medium rounded-lg border transition-colors ${inputUnit === 'gram' ? 'bg-gold-500 text-white border-gold-500' : 'border-gray-200 hover:bg-gray-50'}`}>กรัม</button>
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1.5">น้ำหนัก ({inputUnit === 'baht' ? 'บาท' : 'กรัม'})</p>
            <Input type="number" step="0.01" placeholder={inputUnit === 'baht' ? 'เช่น 2' : 'เช่น 15.244'} value={weight} onChange={e => setWeight(e.target.value)} />
          </div>
        </div>

        {/* ค่ากำเหน็จ (เฉพาะทองรูปพรรณ ซื้อ) */}
        {goldType === 'ornament' && mode === 'sell' && (
          <div>
            <p className="text-xs text-muted-foreground mb-1.5">ค่ากำเหน็จ (บาท)</p>
            <Input type="number" step="1" placeholder="เช่น 1000" value={makingFee} onChange={e => setMakingFee(e.target.value)} />
          </div>
        )}

        {/* ผลลัพธ์ */}
        {weightNum > 0 && (
          <div className="rounded-xl border-2 border-gold-200 bg-gold-50 p-4 space-y-2">
            <p className="text-xs font-semibold text-gold-800 uppercase tracking-wide">ผลการคำนวณ</p>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">น้ำหนัก</span>
                <span className="font-medium">{fmt(weightInBaht)} บาท = {fmt(weightInGram)} กรัม</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">ราคา{mode === 'sell' ? 'ขาย' : 'รับซื้อ'}/บาท</span>
                <span className="font-medium">฿{fmtInt(pricePerBaht)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{fmt(weightInBaht)} × ฿{fmtInt(pricePerBaht)}</span>
                <span className="font-medium">฿{fmtInt(baseAmount)}</span>
              </div>
              {goldType === 'ornament' && mode === 'sell' && makingFeeNum > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">+ ค่ากำเหน็จ</span>
                  <span className="font-medium">฿{fmtInt(makingFeeNum)}</span>
                </div>
              )}
            </div>
            <div className="border-t border-gold-200 pt-2 flex justify-between items-center">
              <span className="font-semibold text-gold-800">{mode === 'sell' ? 'ลูกค้าจ่าย' : 'ร้านจ่ายคืน'}</span>
              <span className="text-2xl font-bold text-gold-700">฿{fmtInt(totalAmount)}</span>
            </div>
          </div>
        )}

        {/* สูตรอ้างอิง */}
        <div className="rounded-lg bg-gray-50 border p-3 text-xs text-muted-foreground space-y-1">
          <p className="font-semibold text-gray-600">สูตรอ้างอิง (1 บาทไทย = {BAHT_GRAM} กรัม)</p>
          <p>• ทองแท่ง: น้ำหนัก(บาท) × ราคา/บาท</p>
          <p>• ทองรูปพรรณ (ซื้อ): น้ำหนัก(บาท) × ราคา/บาท + ค่ากำเหน็จ</p>
          <p>• ราคา/กรัม = ราคา/บาท ÷ {BAHT_GRAM}</p>
        </div>
      </CardContent>
    </Card>
  )
}

export default function GoldPricePage() {
  const { data: current, mutate: mutateCurrent } = useSWR<GoldPrice>('gold-price-current', goldPriceApi.current)
  const { data: history, isLoading, mutate: mutateHistory } = useSWR<GoldPrice[]>('gold-price-history', goldPriceApi.history)
  const [open, setOpen] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [saving, setSaving] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      gold_bar_buy: current?.gold_bar_buy ?? 0,
      gold_bar_sell: current?.gold_bar_sell ?? 0,
      gold_ornament_buy: current?.gold_ornament_buy ?? 0,
      gold_ornament_sell: current?.gold_ornament_sell ?? 0,
    },
  })

  const handleSync = async () => {
    try {
      setSyncing(true)
      await goldPriceApi.sync()
      toast.success('ซิงค์ราคาทองสำเร็จ')
      mutateCurrent(); mutateHistory()
    } catch (e: any) { toast.error(e.response?.data?.message || 'ซิงค์ไม่สำเร็จ') }
    finally { setSyncing(false) }
  }

  const openSet = () => {
    form.reset({
      gold_bar_buy: current?.gold_bar_buy ?? 0,
      gold_bar_sell: current?.gold_bar_sell ?? 0,
      gold_ornament_buy: current?.gold_ornament_buy ?? 0,
      gold_ornament_sell: current?.gold_ornament_sell ?? 0,
    })
    setOpen(true)
  }

  const onSubmit = async (values: FormValues) => {
    try {
      setSaving(true)
      await goldPriceApi.set(values)
      toast.success('อัปเดตราคาทองสำเร็จ')
      mutateCurrent(); mutateHistory(); setOpen(false)
    } catch (e) { apiToastError(e) }
    finally { setSaving(false) }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">ราคาทอง</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSync} disabled={syncing} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
            ซิงค์ราคา
          </Button>
          <Button onClick={openSet} className="gap-2"><PenLine className="h-4 w-4" />ตั้งราคา</Button>
        </div>
      </div>

      {/* Current Price */}
      {current && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'ทองคำแท่ง (รับซื้อ)', value: current.gold_bar_buy },
              { label: 'ทองคำแท่ง (ขาย)', value: current.gold_bar_sell },
              { label: 'ทองรูปพรรณ (รับซื้อ)', value: current.gold_ornament_buy },
              { label: 'ทองรูปพรรณ (ขาย)', value: current.gold_ornament_sell },
            ].map(({ label, value }) => (
              <Card key={label}>
                <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">{label}</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-gold-700">฿{fmtInt(value)}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">฿{fmtInt(Math.round(value / BAHT_GRAM))}/กรัม</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <GoldCalculator current={current} />
        </>
      )}

      {/* History */}
      <Card>
        <CardHeader><CardTitle>ประวัติราคาทอง</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? <div className="py-10 text-center text-muted-foreground">กำลังโหลด...</div> : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>วันที่</TableHead><TableHead>แท่ง (รับซื้อ)</TableHead><TableHead>แท่ง (ขาย)</TableHead>
                    <TableHead>รูปพรรณ (รับซื้อ)</TableHead><TableHead>รูปพรรณ (ขาย)</TableHead><TableHead>แหล่งที่มา</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history?.map(p => (
                    <TableRow key={p.id}>
                      <TableCell>{format(new Date(p.date), 'dd MMM yyyy HH:mm')}</TableCell>
                      <TableCell>{fmt(p.gold_bar_buy)}</TableCell>
                      <TableCell>{fmt(p.gold_bar_sell)}</TableCell>
                      <TableCell>{fmt(p.gold_ornament_buy)}</TableCell>
                      <TableCell>{fmt(p.gold_ornament_sell)}</TableCell>
                      <TableCell><span className="text-xs text-muted-foreground">{p.source}</span></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>ตั้งราคาทอง</DialogTitle></DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {(['gold_bar_buy', 'gold_bar_sell', 'gold_ornament_buy', 'gold_ornament_sell'] as const).map(name => (
                  <FormField key={name} control={form.control} name={name} render={({ field }) => (
                    <FormItem>
                      <FormLabel>{name.replace(/_/g, ' ').replace(/^./, s => s.toUpperCase())}</FormLabel>
                      <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                ))}
              </div>
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
