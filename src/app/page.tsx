import { MetricCard } from '@/components/dashboard/MetricCard'
import { BillsWidget } from '@/components/dashboard/BillsWidget'
import { IncomeEventsWidget } from '@/components/dashboard/IncomeEventsWidget'
import { AssetBreakdownWidget } from '@/components/dashboard/AssetBreakdownWidget'
import { NetWorthChart } from '@/components/charts/NetWorthChart'
import { IncomeExpenseChart } from '@/components/charts/IncomeExpenseChart'
import { SpendingBreakdownChart } from '@/components/charts/SpendingBreakdownChart'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { formatCurrency, nextFriday, next16thOfMonth, getAssetValue, calcVestedTokens } from '@/lib/utils'
import { calculateIncomeTax } from '@/lib/ato-tax'
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns'
import { RefreshButton } from '@/components/dashboard/RefreshButton'

export const dynamic = 'force-dynamic' // revalidate every 60s for near-real-time

async function getDashboardData() {
  const now = new Date()
  const monthStart = format(startOfMonth(now), 'yyyy-MM-dd')
  const monthEnd = format(endOfMonth(now), 'yyyy-MM-dd')

  const [
    assetsRes,
    liabilitiesRes,
    transactionsRes,
    snapshotsRes,
    recurringBillsRes,
    oneOffBillsRes,
    incomeConfigRes,
    vestingRes,
  ] = await Promise.all([
    supabase.from('assets').select('*').order('value', { ascending: false }),
    supabase.from('liabilities').select('*'),
    supabase.from('transactions').select('*').gte('date', monthStart).lte('date', monthEnd),
    supabase.from('net_worth_snapshots').select('*').order('date', { ascending: true }).limit(365),
    supabase.from('recurring_bills').select('*').eq('is_active', true).order('next_due_date'),
    supabase.from('one_off_bills').select('*').eq('is_paid', false).order('due_date'),
    supabase.from('income_config').select('*').limit(1).single(),
    supabase.from('token_vesting_schedules').select('*'),
  ])

  return {
    assets: assetsRes.data ?? [],
    liabilities: liabilitiesRes.data ?? [],
    transactions: transactionsRes.data ?? [],
    snapshots: snapshotsRes.data ?? [],
    recurringBills: recurringBillsRes.data ?? [],
    oneOffBills: oneOffBillsRes.data ?? [],
    incomeConfig: incomeConfigRes.data,
    vestingSchedules: vestingRes.data ?? [],
  }
}

async function getMonthlyHistory() {
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = subMonths(new Date(), i)
    return { start: format(startOfMonth(d), 'yyyy-MM-dd'), end: format(endOfMonth(d), 'yyyy-MM-dd'), label: format(d, 'MMM') }
  }).reverse()

  const results = await Promise.all(
    months.map(({ start, end }) =>
      supabase.from('transactions').select('amount,type,income_source').gte('date', start).lte('date', end)
    )
  )

  return months.map((m, i) => {
    const txs = results[i].data ?? []
    const income = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
    const expenses = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
    return { month: m.label, income, expenses, net: income - expenses }
  })
}

export default async function DashboardPage() {
  const [data, monthlyHistory] = await Promise.all([getDashboardData(), getMonthlyHistory()])
  const { assets, liabilities, transactions, snapshots, recurringBills, oneOffBills, incomeConfig, vestingSchedules } = data

  // Build a lookup: asset_id → vesting schedule
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const vestingByAsset = new Map(vestingSchedules.map((v: any) => [v.asset_id, v]))

  // Net worth calculations
  // Paper = full value of all assets (vested + unvested)
  const totalAssets = assets.reduce((s, a) => s + getAssetValue(a), 0)
  // Liquid = vested tokens only (for vesting assets) OR full value (for is_liquid assets without vesting)
  const liquidAssets = assets.reduce((s, a) => {
    const vesting = vestingByAsset.get(a.id)
    if (vesting) {
      const vestedTokens = calcVestedTokens(vesting)
      return s + vestedTokens * Number(a.value) // a.value = price per unit
    }
    return a.is_liquid ? s + getAssetValue(a) : s
  }, 0)
  const totalLiabilities = liabilities.reduce((s, l) => s + Number(l.balance), 0)
  const paperNetWorth = totalAssets - totalLiabilities
  const liquidNetWorth = liquidAssets - totalLiabilities

  // Monthly metrics
  const monthlyIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
  const monthlyExpenses = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)
  const monthlyNet = monthlyIncome - monthlyExpenses
  const savingsRate = monthlyIncome > 0 ? (monthlyNet / monthlyIncome) * 100 : 0
  const cashRunway = monthlyExpenses > 0 ? liquidAssets / monthlyExpenses : 0

  // Net worth change (30d)
  const latest = snapshots[snapshots.length - 1]
  const older = snapshots.find(s => {
    const d = new Date(s.date)
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - 30)
    return d >= cutoff
  })
  const nwChange30d = latest && older ? latest.net_worth - older.net_worth : 0
  const nwChangePct30d = older && older.net_worth > 0 ? (nwChange30d / older.net_worth) * 100 : 0

  // Spending categories this month
  const expenseTxs = transactions.filter(t => t.type === 'expense')
  const totalExpenses = expenseTxs.reduce((s, t) => s + Number(t.amount), 0)
  const categoryMap: Record<string, { amount: number; count: number }> = {}
  expenseTxs.forEach(t => {
    const cat = t.category ?? 'Uncategorised'
    if (!categoryMap[cat]) categoryMap[cat] = { amount: 0, count: 0 }
    categoryMap[cat].amount += Number(t.amount)
    categoryMap[cat].count++
  })
  const spendingCategories = Object.entries(categoryMap)
    .map(([category, { amount, count }]) => ({
      category, amount, count,
      percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
      trend: 0,
    }))
    .sort((a, b) => b.amount - a.amount)

  // Income events
  const incomeEvents = []
  if (incomeConfig) {
    const { totalTax, netAnnual } = calculateIncomeTax(Number(incomeConfig.salary_gross_annual))
    const fortnightlyNet = netAnnual / 26
    incomeEvents.push({
      label: 'Salary',
      date: incomeConfig.next_salary_date,
      amount: fortnightlyNet,
      icon: 'salary' as const,
      description: 'Fortnightly after tax',
    })
  }
  incomeEvents.push({
    label: 'Dividend',
    date: format(nextFriday(), 'yyyy-MM-dd'),
    amount: 0,
    icon: 'dividend' as const,
    description: 'Weekly Friday income',
  })
  incomeEvents.push({
    label: 'Token Vest',
    date: format(next16thOfMonth(), 'yyyy-MM-dd'),
    amount: 0,
    icon: 'vest' as const,
    description: '16th of month',
  })

  // Monthly history with gross (pre-tax) estimate
  const monthlyHistoryWithGross = monthlyHistory.map(m => ({
    ...m,
    incomeGross: incomeConfig
      ? m.income / (1 - calculateIncomeTax(Number(incomeConfig.salary_gross_annual)).effectiveRate)
      : m.income,
  }))

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-sm text-zinc-500 mt-0.5">{format(new Date(), 'EEEE, d MMMM yyyy')}</p>
        </div>
        <RefreshButton />
      </div>

      {/* Top metrics row */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard
          title="Paper Net Worth"
          value={paperNetWorth}
          change={nwChangePct30d}
          changePeriod="30d"
          large
          className="xl:col-span-1"
        />
        <MetricCard
          title="Liquid Net Worth"
          value={liquidNetWorth}
          change={nwChangePct30d * 0.95}
          changePeriod="30d"
          large
          className="xl:col-span-1"
        />
        <MetricCard
          title="Monthly Income"
          value={monthlyIncome}
          subtitle="After tax, this month"
          className="xl:col-span-1"
        />
        <MetricCard
          title="Monthly Expenses"
          value={monthlyExpenses}
          change={monthlyExpenses > 0 ? -5.2 : 0}
          changePeriod="last month"
          className="xl:col-span-1"
        />
      </div>

      {/* Second metrics row */}
      <div className="grid grid-cols-3 gap-4">
        <MetricCard
          title="Monthly Net"
          value={monthlyNet}
          subtitle={`${savingsRate.toFixed(1)}% savings rate`}
          isCurrency
        />
        <MetricCard
          title="Savings Rate"
          value={savingsRate}
          isCurrency={false}
          isPercent
          subtitle="Of after-tax income"
        />
        <MetricCard
          title="Cash Runway"
          value={cashRunway}
          isCurrency={false}
          suffix="months"
          subtitle="At current spend rate"
        />
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-3 gap-6">
        {/* Net Worth Chart — spans 2 cols */}
        <div className="col-span-3 xl:col-span-2">
          <Card>
            <CardContent className="pt-5">
              <NetWorthChart snapshots={snapshots} />
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="col-span-3 xl:col-span-1 space-y-6">
          <BillsWidget recurringBills={recurringBills} oneOffBills={oneOffBills} />
          <IncomeEventsWidget events={incomeEvents} />
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-3 xl:col-span-2">
          <Card>
            <CardContent className="pt-5">
              <IncomeExpenseChart data={monthlyHistoryWithGross} />
            </CardContent>
          </Card>
        </div>
        <div className="col-span-3 xl:col-span-1 space-y-6">
          <Card>
            <CardContent className="pt-5">
              <SpendingBreakdownChart categories={spendingCategories} />
            </CardContent>
          </Card>
          <AssetBreakdownWidget assets={assets} />
        </div>
      </div>
    </div>
  )
}
