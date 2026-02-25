import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatDate, nextFriday, next16thOfMonth } from '@/lib/utils'
import { calculateIncomeTax } from '@/lib/ato-tax'
import { IncomeConfigForm } from '@/components/income/IncomeConfigForm'
import { IncomeExpenseChart } from '@/components/charts/IncomeExpenseChart'
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns'
import { Briefcase, TrendingUp, Coins } from 'lucide-react'

export const dynamic = 'force-dynamic'

async function getMonthlyIncome() {
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = subMonths(new Date(), i)
    return { start: format(startOfMonth(d), 'yyyy-MM-dd'), end: format(endOfMonth(d), 'yyyy-MM-dd'), label: format(d, 'MMM') }
  }).reverse()

  const results = await Promise.all(
    months.map(({ start, end }) =>
      supabase.from('transactions').select('amount,income_source').eq('type', 'income').gte('date', start).lte('date', end)
    )
  )

  return months.map((m, i) => {
    const txs = results[i].data ?? []
    const salary = txs.filter(t => t.income_source === 'salary').reduce((s, t) => s + Number(t.amount), 0)
    const dividend = txs.filter(t => t.income_source === 'dividend').reduce((s, t) => s + Number(t.amount), 0)
    const tokenVest = txs.filter(t => t.income_source === 'token_vest').reduce((s, t) => s + Number(t.amount), 0)
    const other = txs.filter(t => !t.income_source || t.income_source === 'other').reduce((s, t) => s + Number(t.amount), 0)
    const income = salary + dividend + tokenVest + other
    return { month: m.label, income, expenses: 0, net: income, salary, dividend, tokenVest, other }
  })
}

export default async function IncomePage() {
  const [{ data: incomeConfig }, monthlyData] = await Promise.all([
    supabase.from('income_config').select('*').limit(1).single(),
    getMonthlyIncome(),
  ])

  const tax = incomeConfig ? calculateIncomeTax(Number(incomeConfig.salary_gross_annual)) : null
  const fortnightlyNet = tax ? tax.netAnnual / 26 : 0
  const monthlyNet = tax ? tax.netAnnual / 12 : 0

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Income</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Configure your income sources and view history</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Income sources */}
        <div className="col-span-3 xl:col-span-2 space-y-4">
          {/* Salary card */}
          <Card>
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center shrink-0">
                  <Briefcase className="h-5 w-5 text-indigo-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-white">Salary</h3>
                  <p className="text-sm text-zinc-500 mt-0.5">Fortnightly, after tax</p>
                  {incomeConfig && tax && (
                    <div className="grid grid-cols-3 gap-4 mt-4">
                      <div>
                        <p className="text-xs text-zinc-500">Gross Annual</p>
                        <p className="text-lg font-bold text-white">{formatCurrency(Number(incomeConfig.salary_gross_annual))}</p>
                      </div>
                      <div>
                        <p className="text-xs text-zinc-500">Tax + Medicare</p>
                        <p className="text-lg font-bold text-red-400">{formatCurrency(tax.totalTax)}</p>
                        <p className="text-xs text-zinc-500">({(tax.effectiveRate * 100).toFixed(1)}% effective)</p>
                      </div>
                      <div>
                        <p className="text-xs text-zinc-500">Net Annual</p>
                        <p className="text-lg font-bold text-emerald-400">{formatCurrency(tax.netAnnual)}</p>
                        <p className="text-xs text-zinc-500">{formatCurrency(fortnightlyNet)}/fortnight · {formatCurrency(monthlyNet)}/mo</p>
                      </div>
                    </div>
                  )}
                  {!incomeConfig && <p className="text-sm text-zinc-500 mt-2">No salary configured yet.</p>}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dividend card */}
          <Card>
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <TrendingUp className="h-5 w-5 text-emerald-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-white">Dividend Income</h3>
                  <p className="text-sm text-zinc-500 mt-0.5">Every Friday, net after tax</p>
                  <p className="text-sm text-zinc-400 mt-2">Next payment: <span className="text-white font-medium">{format(nextFriday(), 'EEEE d MMMM')}</span></p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Token vest card */}
          <Card>
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                  <Coins className="h-5 w-5 text-amber-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-white">Token Vest</h3>
                  <p className="text-sm text-zinc-500 mt-0.5">16th of each month, immediately liquid</p>
                  <p className="text-sm text-zinc-400 mt-2">Next vest: <span className="text-white font-medium">{format(next16thOfMonth(), 'd MMMM yyyy')}</span></p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Income history chart */}
          <Card>
            <CardContent className="pt-5">
              <IncomeExpenseChart data={monthlyData} showTaxToggle={!!incomeConfig} />
            </CardContent>
          </Card>
        </div>

        {/* Config panel */}
        <div className="col-span-3 xl:col-span-1">
          <IncomeConfigForm existing={incomeConfig} />
        </div>
      </div>
    </div>
  )
}
