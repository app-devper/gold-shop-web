import { goldApi } from './api'
import type {
  Branch, Employee, GoldPrice, Customer, Product, ProductCategory, ProductItem, ProductKind,
  Sale, Pawn, GoldSaving, InventoryTransfer, Reward, Expense, ExpenseCategory,
  DashboardData, ProfitLossReport, TopProduct, EmployeePerformance, SalesTrend,
} from '@/types/gold'

// ── Branches ──────────────────────────────────────────────────────────────────
export const branchApi = {
  list: () => goldApi.get<Branch[]>('/api/gold/v1/branches').then(r => r.data),
  get: (id: string) => goldApi.get<Branch>(`/api/gold/v1/branches/${id}`).then(r => r.data),
  create: (data: Partial<Branch>) => goldApi.post<Branch>('/api/gold/v1/branches', data).then(r => r.data),
  update: (id: string, data: Partial<Branch>) => goldApi.put<Branch>(`/api/gold/v1/branches/${id}`, data).then(r => r.data),
  delete: (id: string) => goldApi.delete(`/api/gold/v1/branches/${id}`),
}

// ── Employees ─────────────────────────────────────────────────────────────────
export const employeeApi = {
  list: () => goldApi.get<Employee[]>('/api/gold/v1/employees').then(r => r.data),
  me: () => goldApi.get<Employee & { branchName: string }>('/api/gold/v1/employees/me').then(r => r.data),
  get: (id: string) => goldApi.get<Employee>(`/api/gold/v1/employees/${id}`).then(r => r.data),
  getByBranch: (branchId: string) => goldApi.get<Employee[]>(`/api/gold/v1/employees/branch/${branchId}`).then(r => r.data),
  create: (data: Partial<Employee>) => goldApi.post<Employee>('/api/gold/v1/employees', data).then(r => r.data),
  update: (id: string, data: Partial<Employee>) => goldApi.put<Employee>(`/api/gold/v1/employees/${id}`, data).then(r => r.data),
  delete: (id: string) => goldApi.delete(`/api/gold/v1/employees/${id}`),
}

// ── Gold Prices ───────────────────────────────────────────────────────────────
export const goldPriceApi = {
  current: () => goldApi.get<GoldPrice>('/api/gold/v1/gold-prices/current').then(r => r.data),
  history: () => goldApi.get<GoldPrice[]>('/api/gold/v1/gold-prices/history').then(r => r.data),
  set: (data: Partial<GoldPrice>) => goldApi.post<GoldPrice>('/api/gold/v1/gold-prices', data).then(r => r.data),
  sync: () => goldApi.post<GoldPrice>('/api/gold/v1/gold-prices/sync').then(r => r.data),
}

// ── Customers ─────────────────────────────────────────────────────────────────
export const customerApi = {
  list: (params?: { limit?: number; offset?: number }) =>
    goldApi.get<Customer[]>('/api/gold/v1/customers', { params }).then(r => r.data),
  get: (id: string) => goldApi.get<Customer>(`/api/gold/v1/customers/${id}`).then(r => r.data),
  getByRFID: (rfid: string) => goldApi.get<Customer>(`/api/gold/v1/customers/rfid/${rfid}`).then(r => r.data),
  create: (data: Partial<Customer>) => goldApi.post<Customer>('/api/gold/v1/customers', data).then(r => r.data),
  update: (id: string, data: Partial<Customer>) => goldApi.put<Customer>(`/api/gold/v1/customers/${id}`, data).then(r => r.data),
  delete: (id: string) => goldApi.delete(`/api/gold/v1/customers/${id}`),
}

// ── Products & Product Items (v2) ────────────────────────────────────────────
type CreateProductPayload = {
  sku: string
  code?: string
  kind: ProductKind
  gold_type: string
  name: string
  description?: string
  note?: string
  category?: ProductCategory       // ornament-only
  design?: string                  // ornament
  bar_size_baht?: number           // bar
  default_labor_cost?: number      // ornament
  images?: string[]
}

type UpdateProductPayload = {
  name?: string
  description?: string
  note?: string
  category?: ProductCategory
  design?: string
  default_labor_cost?: number
  bar_size_baht?: number
  images?: string[]
  is_active?: boolean
}

type CreateItemPayload = {
  barcode: string
  serial_number?: string
  weight_grams?: number      // 0/omit → server falls back to bar default
  labor_cost?: number
  cost?: number
  note?: string
}

type BulkCreateItemsPayload = {
  count: number
  weight_grams?: number
  labor_cost?: number
  cost?: number
  barcode_seed?: string
}

type UpdateItemPayload = {
  weight_grams?: number
  labor_cost?: number
  cost?: number
  serial_number?: string
  note?: string
}

export const productApi = {
  list: (params?: { kind?: ProductKind; search?: string; limit?: number; offset?: number }) =>
    goldApi.get<Product[]>('/api/gold/v1/products', { params }).then(r => r.data),
  get: (id: string) => goldApi.get<Product>(`/api/gold/v1/products/${id}`).then(r => r.data),
  create: (data: CreateProductPayload) =>
    goldApi.post<Product>('/api/gold/v1/products', data).then(r => r.data),
  update: (id: string, data: UpdateProductPayload) =>
    goldApi.put<Product>(`/api/gold/v1/products/${id}`, data).then(r => r.data),
  delete: (id: string) => goldApi.delete(`/api/gold/v1/products/${id}`),

  // ── Items (per-piece) ─────────────────────────────────────────────────────
  listItems: (productID: string, params?: { status?: string }) =>
    goldApi.get<ProductItem[]>(`/api/gold/v1/products/${productID}/items`, { params }).then(r => r.data),
  createItem: (productID: string, data: CreateItemPayload) =>
    goldApi.post<ProductItem>(`/api/gold/v1/products/${productID}/items`, data).then(r => r.data),
  bulkCreateItems: (productID: string, data: BulkCreateItemsPayload) =>
    goldApi.post<ProductItem[]>(`/api/gold/v1/products/${productID}/items/bulk`, data).then(r => r.data),
  updateItem: (productID: string, itemID: string, data: UpdateItemPayload) =>
    goldApi.put<ProductItem>(`/api/gold/v1/products/${productID}/items/${itemID}`, data).then(r => r.data),
  deleteItem: (productID: string, itemID: string) =>
    goldApi.delete(`/api/gold/v1/products/${productID}/items/${itemID}`),
}

// ── Sales ─────────────────────────────────────────────────────────────────────
export const saleApi = {
  list: (params?: { limit?: number; offset?: number }) =>
    goldApi.get<Sale[]>('/api/gold/v1/sales', { params }).then(r => r.data),
  unpaid: () => goldApi.get<Sale[]>('/api/gold/v1/sales/unpaid').then(r => r.data),
  get: (id: string) => goldApi.get<Sale>(`/api/gold/v1/sales/${id}`).then(r => r.data),
  create: (data: Partial<Sale>) => goldApi.post<Sale>('/api/gold/v1/sales', data).then(r => r.data),
  cancel: (id: string) => goldApi.post(`/api/gold/v1/sales/${id}/cancel`),
}

// ── Pawns ─────────────────────────────────────────────────────────────────────
export const pawnApi = {
  list: (params?: { limit?: number; offset?: number }) =>
    goldApi.get<Pawn[]>('/api/gold/v1/pawns', { params }).then(r => r.data),
  dueSoon: () => goldApi.get<Pawn[]>('/api/gold/v1/pawns/due-soon').then(r => r.data),
  get: (id: string) => goldApi.get<Pawn>(`/api/gold/v1/pawns/${id}`).then(r => r.data),
  create: (data: Partial<Pawn>) => goldApi.post<Pawn>('/api/gold/v1/pawns', data).then(r => r.data),
  payInterest: (id: string, data: any) => goldApi.post(`/api/gold/v1/pawns/${id}/pay-interest`, data),
  redeem: (id: string, data: any) => goldApi.post(`/api/gold/v1/pawns/${id}/redeem`, data),
  extend: (id: string, data: any) => goldApi.post(`/api/gold/v1/pawns/${id}/extend`, data),
  forfeit: (id: string) => goldApi.post(`/api/gold/v1/pawns/${id}/forfeit`),
}

// ── Gold Savings (v2) ─────────────────────────────────────────────────────────
type OpenGoldSavingPayload = {
  customer_id: string
  min_deposit_cash?: number
  min_deposit_physical?: number
  min_withdraw_cash?: number
  min_withdraw_physical?: number
}
type GoldSavingTxPayload = { mode: 'cash' | 'physical'; amount: number }
type GoldSavingAdjustPayload = { weight_delta: number; note: string }

export const goldSavingApi = {
  list: () => goldApi.get<GoldSaving[]>('/api/gold/v1/gold-savings').then(r => r.data),
  get: (id: string) => goldApi.get<GoldSaving>(`/api/gold/v1/gold-savings/${id}`).then(r => r.data),
  open: (data: OpenGoldSavingPayload) =>
    goldApi.post<GoldSaving>('/api/gold/v1/gold-savings', data).then(r => r.data),
  deposit: (id: string, data: GoldSavingTxPayload) =>
    goldApi.post<GoldSaving>(`/api/gold/v1/gold-savings/${id}/deposit`, data).then(r => r.data),
  withdraw: (id: string, data: GoldSavingTxPayload) =>
    goldApi.post<GoldSaving>(`/api/gold/v1/gold-savings/${id}/withdraw`, data).then(r => r.data),
  adjust: (id: string, data: GoldSavingAdjustPayload) =>
    goldApi.post<GoldSaving>(`/api/gold/v1/gold-savings/${id}/adjust`, data).then(r => r.data),
  close: (id: string) =>
    goldApi.post<GoldSaving>(`/api/gold/v1/gold-savings/${id}/close`).then(r => r.data),
  statement: (id: string) =>
    goldApi.get(`/api/gold/v1/gold-savings/${id}/statement`).then(r => r.data),
}

// ── Inventory Transfers ───────────────────────────────────────────────────────
export const inventoryApi = {
  list: () => goldApi.get<InventoryTransfer[]>('/api/gold/v1/inventory/transfers').then(r => r.data),
  get: (id: string) => goldApi.get<InventoryTransfer>(`/api/gold/v1/inventory/transfers/${id}`).then(r => r.data),
  create: (data: Partial<InventoryTransfer>) => goldApi.post<InventoryTransfer>('/api/gold/v1/inventory/transfers', data).then(r => r.data),
  approve: (id: string) => goldApi.post(`/api/gold/v1/inventory/transfers/${id}/approve`),
  receive: (id: string) => goldApi.post(`/api/gold/v1/inventory/transfers/${id}/receive`),
  cancel: (id: string) => goldApi.post(`/api/gold/v1/inventory/transfers/${id}/cancel`),
}

// ── Rewards ───────────────────────────────────────────────────────────────────
export const rewardApi = {
  list: () => goldApi.get<Reward[]>('/api/gold/v1/rewards').then(r => r.data),
  create: (data: Partial<Reward>) => goldApi.post<Reward>('/api/gold/v1/rewards', data).then(r => r.data),
  redeem: (data: { customer_id: string; reward_id: string; branch_id: string }) =>
    goldApi.post('/api/gold/v1/rewards/redeem', data),
}

// ── Expenses ──────────────────────────────────────────────────────────────────
export const expenseApi = {
  list: (params?: { limit?: number; offset?: number; branch_id?: string }) =>
    goldApi.get<Expense[]>('/api/gold/v1/expenses', { params }).then(r => r.data),
  create: (data: Partial<Expense>) => goldApi.post<Expense>('/api/gold/v1/expenses', data).then(r => r.data),
  categories: () => goldApi.get<ExpenseCategory[]>('/api/gold/v1/expenses/categories').then(r => r.data),
  createCategory: (data: Partial<ExpenseCategory>) => goldApi.post<ExpenseCategory>('/api/gold/v1/expenses/categories', data).then(r => r.data),
}

// ── Reports ───────────────────────────────────────────────────────────────────
export const reportApi = {
  dashboard: () => goldApi.get<DashboardData>('/api/gold/v1/reports/dashboard').then(r => r.data),
  profitLoss: (params: { from: string; to: string }) =>
    goldApi.get<ProfitLossReport>('/api/gold/v1/reports/profit-loss', { params }).then(r => r.data),
  multiBranch: (params: { from: string; to: string }) =>
    goldApi.get<ProfitLossReport[]>('/api/gold/v1/reports/multi-branch', { params }).then(r => r.data),
  topProducts: (params: { from: string; to: string; limit?: number }) =>
    goldApi.get<TopProduct[]>('/api/gold/v1/reports/top-products', { params }).then(r => r.data),
  employeePerformance: (params: { from: string; to: string }) =>
    goldApi.get<EmployeePerformance[]>('/api/gold/v1/reports/employee-performance', { params }).then(r => r.data),
  trends: (params: { from: string; to: string }) =>
    goldApi.get<SalesTrend[]>('/api/gold/v1/reports/trends', { params }).then(r => r.data),
}
