import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { SpendingBreakdownChart } from '@/components/charts/SpendingBreakdownChart'
import { SpendingPeriodFilter } from '@/components/spending/SpendingPeriodFilter'
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths } from 'date-fns'

export const dynamic = 'force-dynamic'

export default async function SpendingPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>
}) {
  const params = await searchParams
  const period = params.period ?? 'month'

  const now = new Date()
  let fromDate: string, toDate: string, label: string

  switch (period) {
    case 'week':
      fromDate = format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd')
      toDate = format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd')
      label = 'This Week'; break
    case 'last_month':
      const lm = subMonths(now, 1)
      fromDate = format(startOfMonth(lm), 'yyyy-MM-dd')
      toDate = format(endOfMonth(lm), 'yyyy-MM-dd')
      label = format(lm, 'MMMM yyyy'); break
    case '3month':
      fromDate = format(startOfMonth(subMonths(now, 2)), 'yyyy-MM-dd')
      toDate = format(endOfMonth(now), 'yyyy-MM-dd')
      label = 'Last 3 Months'; break
    default:
      fromDate = format(startOfMonth(now), 'yyyy-MM-dd')
      toDate = format(endOfMonth(now), 'yyyy-MM-dd')
      label = format(now, 'MMMM yyyy')
  }

  const { data: transactions } = await supabase
    .from('transactions')
    .select('amount, category, subcategory, description, merchant, date')
    .eq('type', 'expense')
    .gte('date', fromDate)
    .lte('date', toDate)
    .order('amount', { ascending: false })

  const txs = transactions ?? []
  const total = txs.reduce((s, t) => s + Number(t.amount), 0)

  // Build category breakdown
  const catMap: Record<string, { amount: number; count: number; merchants: Record<string, number> }> = {}
  txs.forEach(t => {
    const cat = t.category ?? 'Uncategorised'
    if (!catMap[cat]) catMap[cat] = { amount: 0, count: 0, merchants: {} }
    catMap[cat].amount += Number(t.amount)
    catMap[cat].count++
    if (t.merchant) {
      catMap[cat].merchants[t.merchant] = (catMap[cat].merchants[t.merchant] ?? 0) + Number(t.amount)
    }
  })

  const categories = Object.entries(catMap)
    .map(([category, { amount, count, merchants }]) => ({
      category, amount, count,
      percentage: total > 0 ? (amount / total) * 100 : 0,
      trend: 0,
      topMerchants: Object.entries(merchants).sort(([, a], [, b]) => b - a).slice(0, 3),
    }))
    .sort((a, b) => b.amount - a.amount)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Spending</h1>
          <p className="text-sm text-zinc-500 mt-0.5">{label} · Total: {formatCurrency(total)}</p>
        </div>
        <SpendingPeriodFilter currentPeriod={period} />
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-3 xl:col-span-2 space-y-4">
          {/* Top categories detail */}
          {categories.map(cat => (
            <Card key={cat.category}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-white">{cat.category}</h3>
                    <p className="text-xs text-zinc-500">{cat.count} transactions · {cat.percentage.toFixed(1)}% of spend</p>
                  </div>
                  <p className="text-lg font-bold text-white">{formatCurrency(cat.amount)}</p>
                </div>
                <div className="w-full bg-zinc-800 rounded-full h-1.5 mb-3">
                  <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${cat.percentage}%` }} />
                </div>
                {cat.topMerchants.length > 0 && (
                  <div className="space-y-1">
                    {cat.topMerchants.map(([merchant, amount]) => (
                      <div key={merchant} className="flex items-center justify-between text-xs">
                        <span className="text-zinc-400">{merchant}</span>
                        <span className="text-zinc-300">{formatCurrency(amount)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
          {categories.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center text-zinc-500 text-sm">
                No spending data for this period.
              </CardContent>
            </Card>
          )}
        </div>

        <div className="col-span-3 xl:col-span-1">
          <Card>
            <CardContent className="pt-5">
              <SpendingBreakdownChart categories={categories} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
