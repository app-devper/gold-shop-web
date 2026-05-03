'use client'

import { useEffect, useState } from 'react'
import useSWR from 'swr'
import { Plus, Pencil, Trash2, MoreHorizontal, Package, Layers, Boxes } from 'lucide-react'
import { toast } from 'sonner'

import { productApi } from '@/lib/gold-api'
import { apiToastError } from '@/lib/api-toast'
import type { Product, ProductCategory, ProductItem, ProductKind } from '@/types/gold'
import { PRODUCT_CATEGORY_LABELS } from '@/types/gold'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { EmptyState } from '@/components/empty-state'
import { TableSkeleton } from '@/components/table-skeleton'

const fmt = (n: number) => new Intl.NumberFormat('th-TH', { maximumFractionDigits: 2 }).format(n)
const fmtBaht = (n: number) => new Intl.NumberFormat('th-TH', { maximumFractionDigits: 0 }).format(n)
const BAHT_GRAM = 15.244

const statusLabel: Record<string, string> = {
  available: 'พร้อมขาย',
  sold: 'ขายแล้ว',
  reserved: 'จอง',
  pawned: 'จำนำ',
}
const statusColor: Record<string, string> = {
  available: 'bg-green-100 text-green-700',
  sold: 'bg-gray-100 text-gray-500',
  reserved: 'bg-blue-100 text-blue-700',
  pawned: 'bg-orange-100 text-orange-700',
}

export default function ProductsPage() {
  const [kind, setKind] = useState<ProductKind>('ornament')
  const [search, setSearch] = useState('')

  const { data: products, isLoading, mutate } = useSWR<Product[]>(
    ['products', kind, search],
    () => productApi.list({ kind, search }),
  )

  const [productDialog, setProductDialog] = useState<{ mode: 'create' | 'edit'; product?: Product } | null>(null)
  const [itemDialog, setItemDialog] = useState<{ mode: 'add' | 'bulk'; product: Product } | null>(null)
  const [itemsView, setItemsView] = useState<Product | null>(null)

  const onDelete = async (id: string) => {
    if (!confirm('ยืนยันลบสินค้า? (ปิดการใช้งาน)')) return
    try { await productApi.delete(id); toast.success('ลบสำเร็จ'); mutate() }
    catch (e) { apiToastError(e) }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">สินค้า</h1>
        <Button onClick={() => setProductDialog({ mode: 'create' })} className="gap-2 bg-gold-500 hover:bg-gold-600 text-white">
          <Plus className="h-4 w-4" />เพิ่มสินค้า
        </Button>
      </div>

      <Tabs value={kind} onValueChange={(v) => setKind(v as ProductKind)}>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <TabsList>
            <TabsTrigger value="ornament" className="gap-2"><Package className="h-4 w-4" />ทองรูปพรรณ</TabsTrigger>
            <TabsTrigger value="bar" className="gap-2"><Layers className="h-4 w-4" />ทองคำแท่ง</TabsTrigger>
          </TabsList>
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="ค้นหา ชื่อ, SKU, ลายแบบ..."
            className="max-w-xs"
          />
        </div>

        {(['ornament', 'bar'] as const).map(k => (
          <TabsContent key={k} value={k} className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>{k === 'ornament' ? 'ทองรูปพรรณ' : 'ทองคำแท่ง'} ({products?.length ?? 0})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>SKU</TableHead>
                        <TableHead>ชื่อสินค้า</TableHead>
                        <TableHead>{k === 'ornament' ? 'ลายแบบ' : 'ขนาด'}</TableHead>
                        <TableHead>ทอง</TableHead>
                        <TableHead className="text-right">คงเหลือ</TableHead>
                        <TableHead className="text-right">{k === 'ornament' ? 'ค่ากำเหน็จ' : 'น้ำหนัก'}</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    {isLoading ? <TableSkeleton rows={5} cols={7} /> : (
                      <TableBody>
                        {!products?.length ? (
                          <TableRow>
                            <TableCell colSpan={7} className="p-0">
                              <EmptyState icon={k === 'ornament' ? Package : Layers} title={`ไม่มี${k === 'ornament' ? 'ทองรูปพรรณ' : 'ทองคำแท่ง'}`} description="กดเพิ่มสินค้าเพื่อสร้างรายการแรก" />
                            </TableCell>
                          </TableRow>
                        ) : products.map(p => {
                          const stock = p.items?.length ?? 0
                          return (
                            <TableRow key={p.id}>
                              <TableCell className="font-mono text-sm">{p.sku}</TableCell>
                              <TableCell className="font-medium">{p.name}</TableCell>
                              <TableCell>{p.kind === 'ornament' ? (p.design || '—') : (p.bar_size_baht ? `${p.bar_size_baht} บาททอง` : '—')}</TableCell>
                              <TableCell>{p.gold_type}</TableCell>
                              <TableCell className="text-right">
                                <button onClick={() => setItemsView(p)} className="hover:underline">
                                  <span className="font-medium">{stock}</span> ชิ้น
                                </button>
                              </TableCell>
                              <TableCell className="text-right">
                                {p.kind === 'ornament'
                                  ? (p.default_labor_cost > 0 ? `฿${fmtBaht(p.default_labor_cost)}` : '—')
                                  : (p.bar_size_baht ? `${fmt(p.bar_size_baht * BAHT_GRAM)}g` : '—')}
                              </TableCell>
                              <TableCell>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => setItemsView(p)}>
                                      <Boxes className="mr-2 h-4 w-4" />ดูชิ้นในสต็อก
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setItemDialog({ mode: 'add', product: p })}>
                                      <Plus className="mr-2 h-4 w-4" />เพิ่มชิ้น
                                    </DropdownMenuItem>
                                    {p.kind === 'bar' && (
                                      <DropdownMenuItem onClick={() => setItemDialog({ mode: 'bulk', product: p })}>
                                        <Plus className="mr-2 h-4 w-4" />เพิ่มหลายชิ้น
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem onClick={() => setProductDialog({ mode: 'edit', product: p })}>
                                      <Pencil className="mr-2 h-4 w-4" />แก้ไข
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="text-red-600" onClick={() => onDelete(p.id)}>
                                      <Trash2 className="mr-2 h-4 w-4" />ลบ
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    )}
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      <ProductFormDialog
        key={productDialog?.product?.id ?? 'new'}
        state={productDialog}
        defaultKind={kind}
        onClose={() => setProductDialog(null)}
        onSaved={() => { setProductDialog(null); mutate() }}
      />
      <ItemFormDialog
        state={itemDialog}
        onClose={() => setItemDialog(null)}
        onSaved={() => { setItemDialog(null); mutate() }}
      />
      <ItemsListDialog
        product={itemsView}
        onClose={() => setItemsView(null)}
        onChange={() => mutate()}
      />
    </div>
  )
}

// ── Create / Edit Product master ───────────────────────────────────────────────
function ProductFormDialog({
  state, defaultKind, onClose, onSaved,
}: {
  state: { mode: 'create' | 'edit'; product?: Product } | null
  defaultKind: ProductKind
  onClose: () => void
  onSaved: () => void
}) {
  const open = !!state
  const isEdit = state?.mode === 'edit'
  const editing = state?.product
  const [kind, setKind] = useState<ProductKind>(editing?.kind ?? defaultKind)
  const [sku, setSku] = useState(editing?.sku ?? '')
  const [name, setName] = useState(editing?.name ?? '')
  const [goldType, setGoldType] = useState(editing?.gold_type ?? '96.5%')
  const [category, setCategory] = useState<ProductCategory | ''>(editing?.category ?? '')
  const [design, setDesign] = useState(editing?.design ?? '')
  const [defaultLabor, setDefaultLabor] = useState(String(editing?.default_labor_cost ?? 0))
  const [barSize, setBarSize] = useState(String(editing?.bar_size_baht ?? ''))
  const [description, setDescription] = useState(editing?.description ?? '')
  const [note, setNote] = useState(editing?.note ?? '')
  const [saving, setSaving] = useState(false)

  // Reset form when dialog opens for a different product.
  useState(() => { /* no-op: state is recomputed via key */ })

  const submit = async () => {
    if (!sku.trim()) { toast.error('กรอก SKU'); return }
    if (!name.trim()) { toast.error('กรอกชื่อสินค้า'); return }
    if (kind === 'bar' && (!barSize || parseFloat(barSize) <= 0)) { toast.error('ระบุขนาดทองคำแท่ง (บาท)'); return }
    try {
      setSaving(true)
      if (isEdit && editing) {
        await productApi.update(editing.id, {
          name,
          description,
          note,
          category: kind === 'ornament' && category ? category : undefined,
          design: kind === 'ornament' ? design : undefined,
          default_labor_cost: kind === 'ornament' ? parseFloat(defaultLabor) || 0 : undefined,
          bar_size_baht: kind === 'bar' ? parseFloat(barSize) : undefined,
        })
        toast.success('แก้ไขสำเร็จ')
      } else {
        await productApi.create({
          sku,
          kind,
          gold_type: goldType,
          name,
          description,
          note,
          category: kind === 'ornament' && category ? category : undefined,
          design: kind === 'ornament' ? design : undefined,
          default_labor_cost: kind === 'ornament' ? parseFloat(defaultLabor) || 0 : undefined,
          bar_size_baht: kind === 'bar' ? parseFloat(barSize) : undefined,
        })
        toast.success('เพิ่มสินค้าสำเร็จ')
      }
      onSaved()
    } catch (e) { apiToastError(e) }
    finally { setSaving(false) }
  }

  return (
    <Dialog open={open} onOpenChange={onClose} key={editing?.id ?? 'new'}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>{isEdit ? 'แก้ไขสินค้า' : 'เพิ่มสินค้า'}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="mb-1.5 block">ประเภท</Label>
            <Select value={kind} onValueChange={v => setKind(v as ProductKind)} disabled={isEdit}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ornament">ทองรูปพรรณ</SelectItem>
                <SelectItem value="bar">ทองคำแท่ง</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1.5 block">SKU</Label>
              <Input value={sku} onChange={e => setSku(e.target.value)} disabled={isEdit} placeholder="GOLD-RING-001" />
            </div>
            <div>
              <Label className="mb-1.5 block">ความบริสุทธิ์</Label>
              <Select value={goldType} onValueChange={setGoldType} disabled={isEdit}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="96.5%">96.5%</SelectItem>
                  <SelectItem value="99.99%">99.99%</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="mb-1.5 block">ชื่อสินค้า</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder={kind === 'ornament' ? 'แหวนทองคำลายเชือก' : 'ทองคำแท่ง 1 บาท'} />
          </div>
          {kind === 'ornament' ? (
            <>
              <div>
                <Label className="mb-1.5 block">หมวดหมู่</Label>
                <Select value={category || 'none'} onValueChange={v => setCategory(v === 'none' ? '' : v as ProductCategory)}>
                  <SelectTrigger><SelectValue placeholder="เลือกหมวดหมู่" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— ไม่ระบุ —</SelectItem>
                    {(Object.keys(PRODUCT_CATEGORY_LABELS) as ProductCategory[]).map(k => (
                      <SelectItem key={k} value={k}>{PRODUCT_CATEGORY_LABELS[k]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-1.5 block">ลายแบบ (free text)</Label>
                <Input value={design} onChange={e => setDesign(e.target.value)} placeholder="สร้อยคอลายโซ่, แหวนเกลี้ยง..." />
              </div>
              <div>
                <Label className="mb-1.5 block">ค่ากำเหน็จเริ่มต้นต่อชิ้น (฿)</Label>
                <Input type="number" min="0" value={defaultLabor} onChange={e => setDefaultLabor(e.target.value)} />
              </div>
            </>
          ) : (
            <div>
              <Label className="mb-1.5 block">ขนาดทองคำแท่ง (บาท)</Label>
              <Input type="number" step="0.01" min="0.01" value={barSize} onChange={e => setBarSize(e.target.value)} placeholder="1, 2, 5, 10..." />
              {parseFloat(barSize) > 0 && (
                <p className="text-xs text-muted-foreground mt-1">≈ {fmt(parseFloat(barSize) * BAHT_GRAM)} กรัม</p>
              )}
            </div>
          )}
          <div>
            <Label className="mb-1.5 block">คำอธิบาย</Label>
            <Input value={description} onChange={e => setDescription(e.target.value)} />
          </div>
          <div>
            <Label className="mb-1.5 block">หมายเหตุ (ภายใน)</Label>
            <Input value={note} onChange={e => setNote(e.target.value)} placeholder="หมายเหตุภายในสำหรับร้าน" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>ยกเลิก</Button>
          <Button onClick={submit} disabled={saving} className="bg-gold-500 hover:bg-gold-600 text-white">
            {saving ? 'กำลังบันทึก...' : 'บันทึก'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Add ProductItem (single or bulk) ──────────────────────────────────────────
function ItemFormDialog({
  state, onClose, onSaved,
}: {
  state: { mode: 'add' | 'bulk'; product: Product } | null
  onClose: () => void
  onSaved: () => void
}) {
  const open = !!state
  const product = state?.product
  const isBulk = state?.mode === 'bulk'

  const [barcode, setBarcode] = useState('')
  const [serial, setSerial] = useState('')
  const [weight, setWeight] = useState('')
  const [labor, setLabor] = useState('')
  const [cost, setCost] = useState('')
  const [count, setCount] = useState('1')
  const [seed, setSeed] = useState('')
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    if (!product) return
    try {
      setSaving(true)
      if (isBulk) {
        await productApi.bulkCreateItems(product.id, {
          count: parseInt(count) || 1,
          weight_grams: parseFloat(weight) || undefined,
          labor_cost: labor ? parseFloat(labor) : undefined,
          cost: parseFloat(cost) || 0,
          barcode_seed: seed || undefined,
        })
        toast.success('เพิ่มชิ้นสำเร็จ')
      } else {
        if (!barcode.trim()) { toast.error('กรอก barcode'); setSaving(false); return }
        await productApi.createItem(product.id, {
          barcode,
          serial_number: serial || undefined,
          weight_grams: parseFloat(weight) || undefined,
          labor_cost: labor ? parseFloat(labor) : undefined,
          cost: parseFloat(cost) || 0,
        })
        toast.success('เพิ่มชิ้นสำเร็จ')
      }
      // reset
      setBarcode(''); setSerial(''); setWeight(''); setLabor(''); setCost(''); setCount('1'); setSeed('')
      onSaved()
    } catch (e) { apiToastError(e) }
    finally { setSaving(false) }
  }

  if (!product) return null
  const defaultBarWeight = product.kind === 'bar' && product.bar_size_baht
    ? product.bar_size_baht * BAHT_GRAM : 0

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isBulk ? 'เพิ่มหลายชิ้น' : 'เพิ่มชิ้น'} — {product.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {!isBulk ? (
            <>
              <div>
                <Label className="mb-1.5 block">Barcode</Label>
                <Input value={barcode} onChange={e => setBarcode(e.target.value)} placeholder="สแกน หรือพิมพ์" />
              </div>
              <div>
                <Label className="mb-1.5 block">Serial number (ถ้ามี)</Label>
                <Input value={serial} onChange={e => setSerial(e.target.value)} />
              </div>
            </>
          ) : (
            <>
              <div>
                <Label className="mb-1.5 block">จำนวน</Label>
                <Input type="number" min="1" value={count} onChange={e => setCount(e.target.value)} />
              </div>
              <div>
                <Label className="mb-1.5 block">Barcode seed (เว้นว่าง = ใช้ SKU + วันที่)</Label>
                <Input value={seed} onChange={e => setSeed(e.target.value)} placeholder={`${product.sku}-YYMMDD`} />
                <p className="text-xs text-muted-foreground mt-1">ระบบจะตามด้วย -001, -002, ...</p>
              </div>
            </>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1.5 block">น้ำหนัก (กรัม){product.kind === 'bar' && defaultBarWeight > 0 ? ` · default ${fmt(defaultBarWeight)}` : ''}</Label>
              <Input type="number" step="0.0001" min="0" value={weight} onChange={e => setWeight(e.target.value)} placeholder={product.kind === 'bar' ? `${fmt(defaultBarWeight)}` : ''} />
            </div>
            <div>
              <Label className="mb-1.5 block">ค่ากำเหน็จ (฿) — ตัวนี้</Label>
              <Input type="number" min="0" value={labor} onChange={e => setLabor(e.target.value)} placeholder={product.kind === 'ornament' ? `default ${product.default_labor_cost}` : '0'} disabled={product.kind === 'bar'} />
            </div>
          </div>
          <div>
            <Label className="mb-1.5 block">ต้นทุนต่อชิ้น (฿)</Label>
            <Input type="number" min="0" value={cost} onChange={e => setCost(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>ยกเลิก</Button>
          <Button onClick={submit} disabled={saving} className="bg-gold-500 hover:bg-gold-600 text-white">
            {saving ? 'กำลังบันทึก...' : 'บันทึก'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── List items in stock ──────────────────────────────────────────────────────
//
// Outer wrapper keeps the Dialog mounted so it can animate close cleanly. The
// data-fetching component is split into ItemsListBody so its hooks only run
// when `product` is non-null — avoids a Turbopack/React 19 quirk where the
// ternary `product ? ['items', product.id] : null` could still trigger
// `product.id` evaluation during a closing render.
function ItemsListDialog({
  product, onClose, onChange,
}: {
  product: Product | null
  onClose: () => void
  onChange: () => void
}) {
  return (
    <Dialog open={!!product} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader><DialogTitle>{product?.name} · ชิ้นในสต็อก</DialogTitle></DialogHeader>
        {product && <ItemsListBody product={product} onChange={onChange} />}
      </DialogContent>
    </Dialog>
  )
}

function ItemsListBody({ product, onChange }: { product: Product; onChange: () => void }) {
  const { data: items, mutate } = useSWR<ProductItem[]>(
    ['items', product.id],
    () => productApi.listItems(product.id),
  )
  const [editing, setEditing] = useState<ProductItem | null>(null)

  const onDelete = async (itemID: string) => {
    if (!confirm('ลบชิ้นนี้?')) return
    try {
      await productApi.deleteItem(product.id, itemID)
      toast.success('ลบสำเร็จ')
      mutate()
      onChange()
    } catch (e) { apiToastError(e) }
  }

  return (
    <>
      <div className="rounded-md border max-h-[60vh] overflow-y-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Barcode</TableHead>
              <TableHead>Serial</TableHead>
              <TableHead className="text-right">น้ำหนัก</TableHead>
              <TableHead className="text-right">ค่ากำเหน็จ</TableHead>
              <TableHead className="text-right">ต้นทุน</TableHead>
              <TableHead>สถานะ</TableHead>
              <TableHead className="w-20"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!items?.length ? (
              <TableRow><TableCell colSpan={7} className="p-0">
                <EmptyState icon={Boxes} title="ยังไม่มีชิ้นในสต็อก" description="กดเพิ่มชิ้นเพื่อรับสินค้าเข้าสต็อก" />
              </TableCell></TableRow>
            ) : items.map(it => (
              <TableRow key={it.id}>
                <TableCell className="font-mono text-sm">{it.barcode}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{it.serial_number || '—'}</TableCell>
                <TableCell className="text-right">{fmt(it.weight_grams)} g</TableCell>
                <TableCell className="text-right">{it.labor_cost > 0 ? `฿${fmtBaht(it.labor_cost)}` : '—'}</TableCell>
                <TableCell className="text-right">฿{fmtBaht(it.cost)}</TableCell>
                <TableCell><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[it.status]}`}>{statusLabel[it.status] ?? it.status}</span></TableCell>
                <TableCell>
                  {it.status === 'available' && (
                    <div className="flex items-center justify-end gap-0.5">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setEditing(it)} title="แก้ไข">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-600" onClick={() => onDelete(it.id)} title="ลบ">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <ItemEditDialog
        item={editing}
        product={product}
        onClose={() => setEditing(null)}
        onSaved={() => { setEditing(null); mutate(); onChange() }}
      />
    </>
  )
}

function ItemEditDialog({
  item, product, onClose, onSaved,
}: {
  item: ProductItem | null
  product: Product
  onClose: () => void
  onSaved: () => void
}) {
  const open = !!item
  const [weight, setWeight] = useState('')
  const [labor, setLabor] = useState('')
  const [cost, setCost] = useState('')
  const [serial, setSerial] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  // Re-seed form when opening for a new item (key forces remount, but explicit
  // sync also lets the inputs stay populated through the closing animation).
  useEffect(() => {
    if (item) {
      setWeight(String(item.weight_grams ?? ''))
      setLabor(String(item.labor_cost ?? ''))
      setCost(String(item.cost ?? ''))
      setSerial(item.serial_number ?? '')
      setNote(item.note ?? '')
    }
  }, [item])

  const submit = async () => {
    if (!item) return
    try {
      setSaving(true)
      await productApi.updateItem(product.id, item.id, {
        weight_grams: weight !== '' ? parseFloat(weight) : undefined,
        labor_cost: labor !== '' ? parseFloat(labor) : undefined,
        cost: cost !== '' ? parseFloat(cost) : undefined,
        serial_number: serial,
        note,
      })
      toast.success('แก้ไขชิ้นสำเร็จ')
      onSaved()
    } catch (e) { apiToastError(e) }
    finally { setSaving(false) }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>แก้ไขชิ้น{item ? ` · ${item.barcode}` : ''}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="mb-1.5 block">Serial number</Label>
            <Input value={serial} onChange={e => setSerial(e.target.value)} placeholder="ถ้ามี" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1.5 block">น้ำหนัก (กรัม)</Label>
              <Input type="number" step="0.0001" min="0" value={weight} onChange={e => setWeight(e.target.value)} />
            </div>
            <div>
              <Label className="mb-1.5 block">ค่ากำเหน็จ (฿)</Label>
              <Input type="number" min="0" value={labor} onChange={e => setLabor(e.target.value)} disabled={product.kind === 'bar'} />
            </div>
          </div>
          <div>
            <Label className="mb-1.5 block">ต้นทุนต่อชิ้น (฿)</Label>
            <Input type="number" min="0" value={cost} onChange={e => setCost(e.target.value)} />
          </div>
          <div>
            <Label className="mb-1.5 block">หมายเหตุ</Label>
            <Input value={note} onChange={e => setNote(e.target.value)} placeholder="หมายเหตุชิ้นนี้" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>ยกเลิก</Button>
          <Button onClick={submit} disabled={saving} className="bg-gold-500 hover:bg-gold-600 text-white">
            {saving ? 'กำลังบันทึก...' : 'บันทึก'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
