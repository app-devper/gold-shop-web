import type { Product, ProductItem, OldGoldItem } from '@/types/gold'

export interface CartItem {
  product: Product
  productItem?: ProductItem    // required when product.kind === 'piece'
  weight: number               // grams (from item)
  laborCost: number            // baht (from item)
  pricePerGram: number
  goldValue: number
  unitPrice: number            // goldValue + laborCost before discount
  discount: number
  discountType: 'amount' | 'percent'
  discountAmount: number
  total: number
}

// Thai gold weight standards differ by product kind:
//   Bar      → 1 บาท = 15.244 g
//   Ornament → 1 บาท = 15.16 g  (ornament rounds in alloy/loops/clasps)
export const BAHT_GRAM_BAR = 15.244
export const BAHT_GRAM_ORNAMENT = 15.16

export function bahtPerGramFor(kind?: 'ornament' | 'bar'): number {
  return kind === 'ornament' ? BAHT_GRAM_ORNAMENT : BAHT_GRAM_BAR
}

/**
 * Compute the per-line gold price.
 *   weightInBaht = weight (g) / bahtPerGramFor(kind)
 *   total        = weightInBaht × sellPricePerBaht + laborCost
 *
 * `kind` defaults to bar (15.244) for backwards-compat with callers that don't
 * thread the discriminator.
 */
export function calcGoldPrice(
  weight: number,
  laborCost: number,
  goldSellPricePerBaht: number,
  kind: 'ornament' | 'bar' = 'bar',
): number {
  if (!goldSellPricePerBaht || !weight) return 0
  const weightInBaht = weight / bahtPerGramFor(kind)
  return Math.round(weightInBaht * goldSellPricePerBaht + (laborCost ?? 0))
}

export function calcGoldValue(
  weight: number,
  goldSellPricePerBaht: number,
  kind: 'ornament' | 'bar' = 'bar',
): number {
  if (!goldSellPricePerBaht || !weight) return 0
  return Math.round((weight / bahtPerGramFor(kind)) * goldSellPricePerBaht)
}

export function calcBuybackPrice(
  weight: number,
  buyPricePerGram: number,
  deductionPercent: number,
): Pick<OldGoldItem, 'price_per_unit' | 'gross_total' | 'deduction_percent' | 'deduction_amount' | 'total'> {
  const grossTotal = Math.max(0, weight * buyPricePerGram)
  const safeDeductionPercent = Math.min(100, Math.max(0, deductionPercent || 0))
  const deductionAmount = grossTotal * (safeDeductionPercent / 100)
  return {
    price_per_unit: Math.round(buyPricePerGram),
    gross_total: Math.round(grossTotal),
    deduction_percent: safeDeductionPercent,
    deduction_amount: Math.round(deductionAmount),
    total: Math.max(0, Math.round(grossTotal - deductionAmount)),
  }
}

/**
 * Build a cart line. Every product is piece-based in v2 — `item` is required
 * and supplies the weight/labor for the line.
 */
export function makeCartItem(
  product: Product,
  goldSellPricePerBaht = 0,
  item?: ProductItem,
): CartItem {
  const weight = item?.weight_grams ?? 0
  const laborCost = item?.labor_cost ?? 0
  const goldValue = calcGoldValue(weight, goldSellPricePerBaht, product.kind)
  const pricePerGram = weight > 0 ? Math.round(goldValue / weight) : 0
  const unitPrice = goldValue + laborCost
  return {
    product,
    productItem: item,
    weight,
    laborCost,
    pricePerGram,
    goldValue,
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

export function updateCartItem(item: CartItem, patch: Partial<Pick<CartItem, 'unitPrice' | 'discount' | 'discountType'>>): CartItem {
  const unitPrice = patch.unitPrice ?? item.unitPrice
  const goldValue = Math.max(0, unitPrice - item.laborCost)
  return {
    ...item,
    unitPrice,
    goldValue,
    pricePerGram: item.weight > 0 ? Math.round(goldValue / item.weight) : 0,
    discount: patch.discount ?? item.discount,
    discountType: patch.discountType ?? item.discountType,
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
