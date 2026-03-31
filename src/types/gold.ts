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

// ── Product ──────────────────────────────────────────────────────────────────
export type ProductStatus = 'available' | 'sold' | 'reserved' | 'pawned'
export type StockType = 'piece' | 'weight'

export interface ProductCategory {
  id: string
  code: string
  name: string
  description: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  branch_id: string
  category_id: string
  sku: string
  barcode?: string
  name: string
  description: string
  stock_type: StockType
  gold_type: string
  weight: number
  weight_unit: string
  labor_cost: number
  price: number
  cost: number
  status: ProductStatus
  images: string[]
  reorder_point: number
  created_at: string
  updated_at: string
}

// ── Sale ─────────────────────────────────────────────────────────────────────
export type SaleType = 'sell' | 'buy_old' | 'exchange'
export type SaleStatus = 'completed' | 'pending' | 'cancelled'
export type DiscountType = 'amount' | 'percent'
export type PaymentMethod = 'cash' | 'credit_card' | 'transfer' | 'voucher'

export interface SaleItem {
  product_id: string
  product_item_id?: string
  product_name: string
  gold_type: string
  weight: number
  price_level: string
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
  weight: number
  price_per_unit: number
  total: number
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
  items: SaleItem[]
  old_gold_items: OldGoldItem[]
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

// ── Gold Saving ───────────────────────────────────────────────────────────────
export type GoldSavingType = 'money' | 'weight'
export type GoldSavingStatus = 'active' | 'closed'
export type TransactionType = 'deposit' | 'withdrawal'

export interface GoldSavingTransaction {
  date: string
  type: TransactionType
  amount: number
  gold_price: number
  gold_weight: number
  balance_after: number
  processed_by: string
}

export interface GoldSaving {
  id: string
  branch_id: string
  account_number: string
  customer_id: string
  saving_type: GoldSavingType
  min_deposit: number
  min_withdrawal: number
  gold_balance: number
  cash_balance: number
  transactions: GoldSavingTransaction[]
  status: GoldSavingStatus
  opened_date: string
  closed_date?: string
  created_at: string
  updated_at: string
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
