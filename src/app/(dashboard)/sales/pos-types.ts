import type { Product, OldGoldItem } from '@/types/gold'

export interface CartItem {
  product: Product
  unitPrice: number
  discount: number
  discountType: 'amount' | 'percent'
  discountAmount: number
  total: number
}

const BAHT_GRAM = 15.244

export function calcGoldPrice(product: Product, goldSellPricePerBaht: number): number {
  if (!goldSellPricePerBaht || !product.weight) return product.price
  const weightInBaht = product.weight / BAHT_GRAM
  return Math.round(weightInBaht * goldSellPricePerBaht + (product.labor_cost ?? 0))
}

export function makeCartItem(product: Product, goldSellPricePerBaht = 0): CartItem {
  const unitPrice = goldSellPricePerBaht > 0
    ? calcGoldPrice(product, goldSellPricePerBaht)
    : product.price
  return {
    product,
    unitPrice,
    discount: 0,
    discountType: 'amount',
    get discountAmount() {
      return this.discountType === 'percent'
        ? this.unitPrice * (this.discount / 100)
        : this.discount
    },
    get total() { return Math.max(0, this.unitPrice - this.discountAmount) },
  }
}

export const saleTypeLabels: Record<string, string> = { sell: 'ขาย', exchange: 'เปลี่ยน', buy_old: 'รับซื้อ' }
export const statusColor: Record<string, string> = {
  completed: 'bg-green-100 text-green-700',
  pending: 'bg-gold-100 text-gold-700',
  cancelled: 'bg-red-100 text-red-700',
}
export const statusLabel: Record<string, string> = { completed: 'สำเร็จ', pending: 'รอดำเนินการ', cancelled: 'ยกเลิก' }
export const typeLabel: Record<string, string> = { sell: 'ขายทอง', buy_old: 'รับซื้อทอง', exchange: 'เปลี่ยนทอง' }

export const fmt = (n: number) => new Intl.NumberFormat('th-TH', { maximumFractionDigits: 0 }).format(n)
export const fmtDec = (n: number) => new Intl.NumberFormat('th-TH', { maximumFractionDigits: 2 }).format(n)
