// ── Branch ──────────────────────────────────────────────────────────────────
export interface Branch {
  id: string
  code: string
  name: string
  address: string
  phone: string
  is_active: boolean
  created_at: string
  updated_at: string
}

// ── Employee ─────────────────────────────────────────────────────────────────
export interface Employee {
  id: string
  branchId: string
  userId: string
  role: 'ADMIN' | 'MANAGER' | 'STAFF'
  createdBy: string
  createdDate: string
  updatedBy: string
  updatedDate: string
}

// ── Gold Price ────────────────────────────────────────────────────────────────
export interface GoldPrice {
  id: string
  date: string
  gold_bar_buy: number
  gold_bar_sell: number
  gold_ornament_buy: number
  gold_ornament_sell: number
  source: string
  is_active: boolean
  created_at: string
}

// ── Customer ─────────────────────────────────────────────────────────────────
export type MembershipTier = 'bronze' | 'silver' | 'gold' | 'platinum'

export interface Membership {
  tier: MembershipTier
  points: number
  join_date: string
}

export interface Customer {
  id: string
  member_code?: string
  rfid_card?: string
  full_name: string
  id_card?: string
  phone: string
  email?: string
  address?: string
  is_member: boolean
  membership?: Membership
  total_spent: number
  created_at: string
  updated_at: string
}

// ── Product (v2 — ornament + bar; every piece is a ProductItem) ─────────────
export type ProductStatus = 'available' | 'sold' | 'reserved' | 'pawned'
export type ProductKind = 'ornament' | 'bar'

// SRS 3.3 — ornament-only categories
export type ProductCategory =
  | 'necklace' // สร้อยคอ
  | 'bracelet' // สร้อยข้อมือ
  | 'ring'     // แหวน
  | 'bangle'   // กำไล
  | 'earring'  // ต่างหู
  | 'pendant'  // จี้
  | 'amulet'   // เลี่ยมพระ

export const PRODUCT_CATEGORY_LABELS: Record<ProductCategory, string> = {
  necklace: 'สร้อยคอ',
  bracelet: 'สร้อยข้อมือ',
  ring: 'แหวน',
  bangle: 'กำไล',
  earring: 'ต่างหู',
  pendant: 'จี้',
  amulet: 'เลี่ยมพระ',
}

export interface ProductItem {
  id: string
  product_id: string
  branch_id: string
  barcode: string
  serial_number?: string
  weight_grams: number
  labor_cost: number
  cost: number
  status: ProductStatus
  received_date: string
  note?: string
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  branch_id: string
  sku: string
  code?: string
  kind: ProductKind
  gold_type: string
  name: string
  description?: string
  note?: string
  // ornament-only:
  category?: ProductCategory
  design?: string
  default_labor_cost: number
  // bar-only:
  bar_size_baht?: number
  images: string[]
  is_active: boolean
  // Populated by API: only items with status=available unless filtered otherwise.
  items?: ProductItem[]
  created_at: string
  updated_at: string
}

// ── Sale ─────────────────────────────────────────────────────────────────────
export type SaleType = 'sell' | 'buy_old' | 'exchange'
export type SaleStatus = 'completed' | 'pending' | 'cancelled'
export type DiscountType = 'amount' | 'percent'
export type PaymentMethod = 'cash' | 'credit_card' | 'transfer' | 'voucher'

// SRS 3.7 — ratings the shop assigns to traded-in gold; affects deduction.
export type OldGoldCondition = 'good' | 'fair' | 'damaged'

export const OLD_GOLD_CONDITION_LABELS: Record<OldGoldCondition, string> = {
  good: 'สภาพดี',
  fair: 'พอใช้',
  damaged: 'ชำรุด',
}

// SRS 3.7 — where customer-traded-in gold goes after the sale.
export type OldItemDestination = 'melt' | 'resell' | 'scrap'

export const OLD_ITEM_DESTINATION_LABELS: Record<OldItemDestination, string> = {
  melt: 'ส่งหลอม',
  resell: 'เข้าสต็อกขายต่อ',
  scrap: 'เก็บเป็นเศษ',
}

export interface SaleItem {
  product_id: string
  product_item_id?: string
  product_name: string
  barcode?: string
  serial_number?: string
  gold_type: string
  weight: number
  price_level: string
  price_per_gram: number
  unit_price: number
  labor_cost: number
  discount: number
  discount_type: DiscountType
  cost: number
  total: number
}

export interface OldGoldItem {
  description: string
  gold_type: string
  kind: ProductKind
  condition?: OldGoldCondition
  weight: number
  price_per_unit: number
  gross_total: number
  deduction_percent: number
  deduction_amount: number
  total: number
}

export interface GoldPriceSnapshot {
  gold_price_id?: string
  date: string
  gold_bar_buy: number
  gold_bar_sell: number
  gold_ornament_buy: number
  gold_ornament_sell: number
  source: string
  captured_at: string
}

export interface Payment {
  method: PaymentMethod
  amount: number
  reference?: string
}

export interface Sale {
  id: string
  branch_id: string
  sale_number: string
  customer_id?: string
  user_id: string
  sale_type: SaleType
  gold_price?: GoldPriceSnapshot
  items: SaleItem[]
  old_gold_items: OldGoldItem[]
  old_item_destination?: OldItemDestination
  subtotal: number
  discount: number
  discount_type: DiscountType
  old_gold_value: number
  net_total: number
  payments: Payment[]
  points_earned: number
  points_used: number
  status: SaleStatus
  notes?: string
  created_at: string
  updated_at: string
}

// ── Pawn ─────────────────────────────────────────────────────────────────────
export type PawnStatus = 'active' | 'redeemed' | 'forfeited' | 'extended'

export interface PawnItem {
  description: string
  gold_type: string
  weight: number
  appraised_value: number
  images: string[]
}

export interface InterestPayment {
  payment_date: string
  amount: number
  period_from: string
  period_to: string
  received_by: string
}

export interface Pawn {
  id: string
  branch_id: string
  pawn_number: string
  customer_id: string
  user_id: string
  items: PawnItem[]
  principal: number
  interest_rate: number
  term_months: number
  start_date: string
  due_date: string
  interest_payments: InterestPayment[]
  status: PawnStatus
  notes?: string
  created_at: string
  updated_at: string
}

// ── Gold Saving (v2 — unified single-balance) ────────────────────────────────
export type GoldSavingStatus = 'active' | 'closed'
export type TxType = 'deposit' | 'withdraw' | 'adjust'
export type TxMode = 'cash' | 'physical'

export interface GoldSavingTransaction {
  date: string
  type: TxType
  mode: TxMode
  input_amount: number          // ฿ if mode=cash, grams if mode=physical
  gold_price_per_gram: number   // snapshot
  gold_weight_delta: number     // signed grams
  cash_equivalent: number       // ฿ value of the tx (always positive)
  balance_after: number         // grams
  processed_by: string
  note?: string
}

export interface GoldSaving {
  id: string
  branch_id: string
  account_number: string
  customer_id: string

  // Primary balance — grams of gold.
  gold_weight: number

  // Lifetime aggregates (for cost basis on the statement).
  total_deposit_value: number
  total_deposit_weight: number
  total_withdraw_value: number
  total_withdraw_weight: number

  // Per-mode minimums (0 = disabled).
  min_deposit_cash: number
  min_deposit_physical: number
  min_withdraw_cash: number
  min_withdraw_physical: number

  status: GoldSavingStatus
  opened_date: string
  closed_date?: string
  transactions: GoldSavingTransaction[]
  created_at: string
  updated_at: string
}

export interface GoldSavingStatement {
  account: GoldSaving
  gold_weight: number
  current_buy_price: number       // ฿/baht (display)
  current_buy_per_gram: number    // ฿/g
  current_sell_per_gram: number   // ฿/g
  current_value: number           // ฿
  cost_basis_value: number        // ฿
  unrealized_pnl: number          // ฿
  unrealized_pnl_percent: number  // %
}

// ── Inventory Transfer ────────────────────────────────────────────────────────
export type TransferStatus = 'pending' | 'in_transit' | 'received' | 'cancelled'

export interface TransferItem {
  product_id: string
  quantity: number
}

export interface InventoryTransfer {
  id: string
  transfer_number: string
  from_branch_id: string
  to_branch_id: string
  items: TransferItem[]
  status: TransferStatus
  requested_by: string
  approved_by?: string
  received_by?: string
  notes?: string
  created_at: string
  updated_at: string
}

// ── Reward ────────────────────────────────────────────────────────────────────
export interface Reward {
  id: string
  code: string
  name: string
  description: string
  points_required: number
  quantity: number
  images: string[]
  is_active: boolean
  valid_from: string
  valid_until: string
  created_at: string
  updated_at: string
}

// ── Expense ───────────────────────────────────────────────────────────────────
export type ExpenseStatus = 'pending' | 'approved' | 'rejected'

export interface ExpenseCategory {
  id: string
  code: string
  name: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Expense {
  id: string
  branch_id: string
  category_id: string
  expense_number: string
  description: string
  amount: number
  expense_date: string
  receipt_number?: string
  attachments: string[]
  created_by: string
  approved_by?: string
  status: ExpenseStatus
  notes?: string
  created_at: string
  updated_at: string
}

// ── Reports ───────────────────────────────────────────────────────────────────
export interface RecentTransaction {
  type: string
  typeLabel: string
  customerName?: string
  amount: number
  timeFormatted: string
}

export interface DashboardData {
  total_sales_today: number
  transaction_count: number
  active_pawns: number
  due_soon_pawns: number
  gold_saving_total: number
}

export interface ProfitLossReport {
  branch_id: string
  branch_name: string
  period_from: string
  period_to: string
  gold_sale_revenue: number
  pawn_interest_revenue: number
  total_revenue: number
  cost_of_gold_sold: number
  gross_profit: number
  total_expenses: number
  net_profit: number
}

export interface TopProduct {
  product_id: string
  product_name: string
  total_qty: number
  total_rev: number
}

export interface EmployeePerformance {
  user_id: string
  full_name: string
  total_sales: number
  sale_count: number
  avg_sale_value: number
}

export interface SalesTrend {
  date: string
  revenue: number
  cost: number
  profit: number
  sale_count: number
}
