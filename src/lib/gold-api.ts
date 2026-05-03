import { goldApi } from './api'
import type {
  Branch, Employee, GoldPrice, Customer, ProductCategory, Product,
  Sale, Pawn, GoldSaving, InventoryTransfer, Reward, Expense, ExpenseCategory,
  DashboardData, ProfitLossReport, TopProduct, EmployeePerformance, SalesTrend,
} from '@/types/gold'

// ── Branches ──────────────────────────────────────────────────────────────────
export const branchApi = {
  list: () => goldApi.get<Branch[]>('/api/v1/branches').then(r => r.data),
  get: (id: string) => goldApi.get<Branch>(`/api/v1/branches/${id}`).then(r => r.data),
  create: (data: Partial<Branch>) => goldApi.post<Branch>('/api/v1/branches', data).then(r => r.data),
  update: (id: string, data: Partial<Branch>) => goldApi.put<Branch>(`/api/v1/branches/${id}`, data).then(r => r.data),
  delete: (id: string) => goldApi.delete(`/api/v1/branches/${id}`),
}

// ── Employees ─────────────────────────────────────────────────────────────────
export const employeeApi = {
  list: () => goldApi.get<Employee[]>('/api/v1/employees').then(r => r.data),
  me: () => goldApi.get<Employee & { branchName: string }>('/api/v1/employees/me').then(r => r.data),
  get: (id: string) => goldApi.get<Employee>(`/api/v1/employees/${id}`).then(r => r.data),
  getByBranch: (branchId: string) => goldApi.get<Employee[]>(`/api/v1/employees/branch/${branchId}`).then(r => r.data),
  create: (data: Partial<Employee>) => goldApi.post<Employee>('/api/v1/employees', data).then(r => r.data),
  update: (id: string, data: Partial<Employee>) => goldApi.put<Employee>(`/api/v1/employees/${id}`, data).then(r => r.data),
  delete: (id: string) => goldApi.delete(`/api/v1/employees/${id}`),
}

// ── Gold Prices ───────────────────────────────────────────────────────────────
export const goldPriceApi = {
  current: () => goldApi.get<GoldPrice>('/api/v1/gold-prices/current').then(r => r.data),
  history: () => goldApi.get<GoldPrice[]>('/api/v1/gold-prices/history').then(r => r.data),
  set: (data: Partial<GoldPrice>) => goldApi.post<GoldPrice>('/api/v1/gold-prices', data).then(r => r.data),
  sync: () => goldApi.post<GoldPrice>('/api/v1/gold-prices/sync').then(r => r.data),
}

// ── Customers ─────────────────────────────────────────────────────────────────
export const customerApi = {
  list: (params?: { limit?: number; offset?: number }) =>
    goldApi.get<Customer[]>('/api/v1/customers', { params }).then(r => r.data),
  get: (id: string) => goldApi.get<Customer>(`/api/v1/customers/${id}`).then(r => r.data),
  getByRFID: (rfid: string) => goldApi.get<Customer>(`/api/v1/customers/rfid/${rfid}`).then(r => r.data),
  create: (data: Partial<Customer>) => goldApi.post<Customer>('/api/v1/customers', data).then(r => r.data),
  update: (id: string, data: Partial<Customer>) => goldApi.put<Customer>(`/api/v1/customers/${id}`, data).then(r => r.data),
  delete: (id: string) => goldApi.delete(`/api/v1/customers/${id}`),
}

// ── Product Categories ────────────────────────────────────────────────────────
export const categoryApi = {
  list: () => goldApi.get<ProductCategory[]>('/api/v1/product-categories').then(r => r.data),
  create: (data: Partial<ProductCategory>) => goldApi.post<ProductCategory>('/api/v1/product-categories', data).then(r => r.data),
}

// ── Products ──────────────────────────────────────────────────────────────────
export const productApi = {
  list: (params?: { limit?: number; offset?: number; search?: string }) =>
    goldApi.get<Product[]>('/api/v1/products', { params }).then(r => r.data),
  get: (id: string) => goldApi.get<Product>(`/api/v1/products/${id}`).then(r => r.data),
  create: (data: Partial<Product>) => goldApi.post<Product>('/api/v1/products', data).then(r => r.data),
  update: (id: string, data: Partial<Product>) => goldApi.put<Product>(`/api/v1/products/${id}`, data).then(r => r.data),
  delete: (id: string) => goldApi.delete(`/api/v1/products/${id}`),
}

// ── Sales ─────────────────────────────────────────────────────────────────────
export const saleApi = {
  list: (params?: { limit?: number; offset?: number }) =>
    goldApi.get<Sale[]>('/api/v1/sales', { params }).then(r => r.data),
  unpaid: () => goldApi.get<Sale[]>('/api/v1/sales/unpaid').then(r => r.data),
  get: (id: string) => goldApi.get<Sale>(`/api/v1/sales/${id}`).then(r => r.data),
  create: (data: Partial<Sale>) => goldApi.post<Sale>('/api/v1/sales', data).then(r => r.data),
  cancel: (id: string) => goldApi.post(`/api/v1/sales/${id}/cancel`),
}

// ── Pawns ─────────────────────────────────────────────────────────────────────
export const pawnApi = {
  list: (params?: { limit?: number; offset?: number }) =>
    goldApi.get<Pawn[]>('/api/v1/pawns', { params }).then(r => r.data),
  dueSoon: () => goldApi.get<Pawn[]>('/api/v1/pawns/due-soon').then(r => r.data),
  get: (id: string) => goldApi.get<Pawn>(`/api/v1/pawns/${id}`).then(r => r.data),
  create: (data: Partial<Pawn>) => goldApi.post<Pawn>('/api/v1/pawns', data).then(r => r.data),
  payInterest: (id: string, data: any) => goldApi.post(`/api/v1/pawns/${id}/pay-interest`, data),
  redeem: (id: string, data: any) => goldApi.post(`/api/v1/pawns/${id}/redeem`, data),
  extend: (id: string, data: any) => goldApi.post(`/api/v1/pawns/${id}/extend`, data),
  forfeit: (id: string) => goldApi.post(`/api/v1/pawns/${id}/forfeit`),
}

// ── Gold Savings ──────────────────────────────────────────────────────────────
export const goldSavingApi = {
  list: () => goldApi.get<GoldSaving[]>('/api/v1/gold-savings').then(r => r.data),
  get: (id: string) => goldApi.get<GoldSaving>(`/api/v1/gold-savings/${id}`).then(r => r.data),
  open: (data: Partial<GoldSaving>) => goldApi.post<GoldSaving>('/api/v1/gold-savings', data).then(r => r.data),
  deposit: (id: string, data: any) => goldApi.post(`/api/v1/gold-savings/${id}/deposit`, data),
  withdraw: (id: string, data: any) => goldApi.post(`/api/v1/gold-savings/${id}/withdraw`, data),
  close: (id: string) => goldApi.post(`/api/v1/gold-savings/${id}/close`),
  statement: (id: string) => goldApi.get(`/api/v1/gold-savings/${id}/statement`).then(r => r.data),
}

// ── Inventory Transfers ───────────────────────────────────────────────────────
export const inventoryApi = {
  list: () => goldApi.get<InventoryTransfer[]>('/api/v1/inventory/transfers').then(r => r.data),
  get: (id: string) => goldApi.get<InventoryTransfer>(`/api/v1/inventory/transfers/${id}`).then(r => r.data),
  create: (data: Partial<InventoryTransfer>) => goldApi.post<InventoryTransfer>('/api/v1/inventory/transfers', data).then(r => r.data),
  approve: (id: string) => goldApi.post(`/api/v1/inventory/transfers/${id}/approve`),
  receive: (id: string) => goldApi.post(`/api/v1/inventory/transfers/${id}/receive`),
  cancel: (id: string) => goldApi.post(`/api/v1/inventory/transfers/${id}/cancel`),
}

// ── Rewards ───────────────────────────────────────────────────────────────────
export const rewardApi = {
  list: () => goldApi.get<Reward[]>('/api/v1/rewards').then(r => r.data),
  create: (data: Partial<Reward>) => goldApi.post<Reward>('/api/v1/rewards', data).then(r => r.data),
  redeem: (data: { customer_id: string; reward_id: string; branch_id: string }) =>
    goldApi.post('/api/v1/rewards/redeem', data),
}

// ── Expenses ──────────────────────────────────────────────────────────────────
export const expenseApi = {
  list: (params?: { limit?: number; offset?: number; branch_id?: string }) =>
    goldApi.get<Expense[]>('/api/v1/expenses', { params }).then(r => r.data),
  create: (data: Partial<Expense>) => goldApi.post<Expense>('/api/v1/expenses', data).then(r => r.data),
  categories: () => goldApi.get<ExpenseCategory[]>('/api/v1/expenses/categories').then(r => r.data),
  createCategory: (data: Partial<ExpenseCategory>) => goldApi.post<ExpenseCategory>('/api/v1/expenses/categories', data).then(r => r.data),
}

// ── Reports ───────────────────────────────────────────────────────────────────
export const reportApi = {
  dashboard: () => goldApi.get<DashboardData>('/api/v1/reports/dashboard').then(r => r.data),
  profitLoss: (params: { from: string; to: string }) =>
    goldApi.get<ProfitLossReport>('/api/v1/reports/profit-loss', { params }).then(r => r.data),
  multiBranch: (params: { from: string; to: string }) =>
    goldApi.get<ProfitLossReport[]>('/api/v1/reports/multi-branch', { params }).then(r => r.data),
  topProducts: (params: { from: string; to: string; limit?: number }) =>
    goldApi.get<TopProduct[]>('/api/v1/reports/top-products', { params }).then(r => r.data),
  employeePerformance: (params: { from: string; to: string }) =>
    goldApi.get<EmployeePerformance[]>('/api/v1/reports/employee-performance', { params }).then(r => r.data),
  trends: (params: { from: string; to: string }) =>
    goldApi.get<SalesTrend[]>('/api/v1/reports/trends', { params }).then(r => r.data),
}
