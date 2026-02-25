export type AssetType = 'cash' | 'property' | 'stock' | 'etf' | 'crypto' | 'other'
export type LiabilityType = 'mortgage' | 'loan' | 'credit_card' | 'other'
export type TransactionType = 'income' | 'expense' | 'transfer'
export type IncomeSource = 'salary' | 'dividend' | 'token_vest' | 'other'
export type VestingFrequency = 'second' | 'minute' | 'hour' | 'day' | 'week' | 'month'
export type BillFrequency = 'weekly' | 'fortnightly' | 'monthly' | 'quarterly' | 'yearly'

export interface Asset {
  id: string
  name: string
  type: AssetType
  value: number
  cost_basis?: number
  quantity?: number
  symbol?: string
  coingecko_id?: string
  ticker?: string
  notes?: string
  is_liquid: boolean
  created_at: string
  updated_at: string
}

export interface TokenVestingSchedule {
  id: string
  asset_id: string
  token_symbol: string
  token_name: string
  total_tokens: number
  vested_tokens: number
  remaining_tokens: number
  vest_frequency: VestingFrequency
  vest_amount: number
  vest_start_date: string
  vest_end_date?: string
  last_vest_date?: string
  next_vest_date: string
  token_price?: number
  created_at: string
}

export interface Liability {
  id: string
  name: string
  type: LiabilityType
  balance: number
  interest_rate?: number
  minimum_payment?: number
  due_date?: string
  created_at: string
  updated_at: string
}

export interface Transaction {
  id: string
  account_id?: string
  amount: number
  type: TransactionType
  income_source?: IncomeSource
  category: string
  subcategory?: string
  description: string
  merchant?: string
  date: string
  is_recurring: boolean
  basiq_id?: string
  created_at: string
}

export interface RecurringBill {
  id: string
  name: string
  amount: number
  frequency: BillFrequency
  next_due_date: string
  category: string
  is_active: boolean
  created_at: string
}

export interface OneOffBill {
  id: string
  name: string
  amount: number
  due_date: string
  is_paid: boolean
  notes?: string
  created_at: string
}

export interface IncomeConfig {
  id: string
  salary_gross: number
  salary_frequency: 'fortnightly' | 'weekly' | 'monthly'
  next_salary_date: string
  tax_rate_override?: number
  created_at: string
}

export interface NetWorthSnapshot {
  id: string
  date: string
  total_assets: number
  liquid_assets: number
  total_liabilities: number
  net_worth: number
  liquid_net_worth: number
  created_at: string
}

export interface DashboardMetrics {
  paperNetWorth: number
  liquidNetWorth: number
  totalAssets: number
  liquidAssets: number
  totalLiabilities: number
  monthlyIncome: number
  monthlyExpenses: number
  monthlyNet: number
  savingsRate: number
  cashRunway: number
  netWorthChange30d: number
  netWorthChangePct30d: number
  liquidNetWorthChange30d: number
  nextSalaryDate: string
  nextDividendDate: string
  nextVestDate: string
  nextVestAmount: number
}

export interface SpendingCategory {
  category: string
  amount: number
  count: number
  percentage: number
  trend: number
}

export interface CryptoPrice {
  symbol: string
  price: number
  change24h: number
  marketCap?: number
}

export interface StockPrice {
  symbol: string
  price: number
  change24h: number
  currency: string
}
