-- Assets table
CREATE TABLE IF NOT EXISTS assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('cash', 'property', 'stock', 'etf', 'crypto', 'other')),
  value DECIMAL(20, 8) NOT NULL DEFAULT 0,
  cost_basis DECIMAL(20, 8),
  quantity DECIMAL(20, 8),
  symbol TEXT,
  coingecko_id TEXT,
  ticker TEXT,
  is_liquid BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Token vesting schedules
CREATE TABLE IF NOT EXISTS token_vesting_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
  token_symbol TEXT NOT NULL,
  token_name TEXT NOT NULL,
  coingecko_id TEXT,
  total_tokens DECIMAL(20, 8) NOT NULL,
  vested_tokens DECIMAL(20, 8) NOT NULL DEFAULT 0,
  vest_frequency TEXT NOT NULL CHECK (vest_frequency IN ('second', 'minute', 'hour', 'day', 'week', 'month')),
  vest_amount DECIMAL(20, 8) NOT NULL,
  vest_start_date TIMESTAMPTZ NOT NULL,
  vest_end_date TIMESTAMPTZ,
  last_vest_date TIMESTAMPTZ,
  next_vest_date TIMESTAMPTZ NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Liabilities table
CREATE TABLE IF NOT EXISTS liabilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('mortgage', 'loan', 'credit_card', 'other')),
  balance DECIMAL(20, 2) NOT NULL DEFAULT 0,
  interest_rate DECIMAL(5, 4),
  minimum_payment DECIMAL(20, 2),
  due_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  basiq_id TEXT UNIQUE,
  account_id TEXT,
  amount DECIMAL(20, 2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
  income_source TEXT CHECK (income_source IN ('salary', 'dividend', 'token_vest', 'other')),
  category TEXT NOT NULL DEFAULT 'Uncategorised',
  subcategory TEXT,
  description TEXT NOT NULL,
  merchant TEXT,
  date DATE NOT NULL,
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  ai_categorised BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Recurring bills
CREATE TABLE IF NOT EXISTS recurring_bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  amount DECIMAL(20, 2) NOT NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('weekly', 'fortnightly', 'monthly', 'quarterly', 'yearly')),
  next_due_date DATE NOT NULL,
  category TEXT NOT NULL DEFAULT 'Bills',
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- One-off bills
CREATE TABLE IF NOT EXISTS one_off_bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  amount DECIMAL(20, 2) NOT NULL,
  due_date DATE NOT NULL,
  is_paid BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Income configuration
CREATE TABLE IF NOT EXISTS income_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salary_gross_annual DECIMAL(20, 2) NOT NULL,
  salary_frequency TEXT NOT NULL DEFAULT 'fortnightly' CHECK (salary_frequency IN ('weekly', 'fortnightly', 'monthly')),
  next_salary_date DATE NOT NULL,
  tax_rate_override DECIMAL(5, 4),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Net worth snapshots (taken daily)
CREATE TABLE IF NOT EXISTS net_worth_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,
  total_assets DECIMAL(20, 2) NOT NULL,
  liquid_assets DECIMAL(20, 2) NOT NULL,
  total_liabilities DECIMAL(20, 2) NOT NULL,
  net_worth DECIMAL(20, 2) NOT NULL,
  liquid_net_worth DECIMAL(20, 2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Bank connections (Basiq)
CREATE TABLE IF NOT EXISTS bank_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  basiq_user_id TEXT UNIQUE,
  institution_name TEXT,
  connected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_synced_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_net_worth_snapshots_date ON net_worth_snapshots(date DESC);
CREATE INDEX IF NOT EXISTS idx_recurring_bills_due ON recurring_bills(next_due_date);
CREATE INDEX IF NOT EXISTS idx_one_off_bills_due ON one_off_bills(due_date) WHERE is_paid = false;
