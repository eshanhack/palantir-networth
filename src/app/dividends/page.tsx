import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DividendCountdown } from '@/components/dividends/DividendCountdown'
import { DividendConfigForm } from '@/components/dividends/DividendConfigForm'
import { formatCurrency } from '@/lib/utils'
import { startOfMonth, endOfMonth, eachDayOfInterval, getDay, format, addWeeks } from 'date-fns'

export const dynamic = 'force-dynamic'

function getFridaysInMonth(year: number, month: number): Date[] {
  const start = startOfMonth(new Date(year, month))
  const end = endOfMonth(new Date(year, month))
  return eachDayOfInterval({ start, end }).filter(d => getDay(d) === 5)
}

function getFridaysInYear(year: number): number {
  let count = 0
  for (let m = 0; m < 12; m++) count += getFridaysInMonth(year, m).length
  return count
}

function getUpcomingFridays(count: number): Date[] {
  const now = new Date()
  const day = now.getDay()
  const daysUntil = (5 - day + 7) % 7 || 7
  const first = new Date(now)
  first.setDate(now.getDate() + daysUntil)
  first.setHours(18, 0, 0, 0)
  return Array.from({ length: count }, (_, i) => addWeeks(first, i))
}

export default async function DividendsPage() {
  const { data: config } = await supabase.from('dividend_config').select('*').limit(1).single()

  const weeklyAmount = config?.weekly_amount ?? 0
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()

  // Fridays remaining in the current month (including today if it's Friday before 6pm)
  const fridaysThisMonth = getFridaysInMonth(year, month)
  const remainingFridays = fridaysThisMonth.filter(f => {
    const pay = new Date(f)
    pay.setHours(18, 0, 0, 0)
    return pay > now
  })

  const monthForecast = fridaysThisMonth.length * weeklyAmount
  const remainingMonthForecast = remainingFridays.length * weeklyAmount
  const yearForecast = getFridaysInYear(year) * weeklyAmount
  const upcomingFridays = getUpcomingFridays(8)

  // YTD paid (Fridays already passed this year)
  const startOfYear = new Date(year, 0, 1)
  const allFridaysYTD = eachDayOfInterval({ start: startOfYear, end: now })
    .filter(d => getDay(d) === 5 && new Date(d).setHours(18, 0, 0, 0) < now.getTime())
  const ytdPaid = allFridaysYTD.length * weeklyAmount

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Dividends</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Weekly Friday income at 6:00 PM</p>
      </div>

      {/* Countdown */}
      <Card>
        <CardContent className="py-8">
          <DividendCountdown weeklyAmount={weeklyAmount} />
        </CardContent>
      </Card>

      {/* Summary cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-xs text-zinc-500 mb-1">Weekly</p>
          <p className="text-xl font-bold text-white">{formatCurrency(weeklyAmount)}</p>
          <p className="text-xs text-zinc-500 mt-1">per payment</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-zinc-500 mb-1">This month total</p>
          <p className="text-xl font-bold text-white">{formatCurrency(monthForecast)}</p>
          <p className="text-xs text-zinc-500 mt-1">{fridaysThisMonth.length} Fridays · {formatCurrency(remainingMonthForecast)} remaining</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-zinc-500 mb-1">{year} forecast</p>
          <p className="text-xl font-bold text-white">{formatCurrency(yearForecast)}</p>
          <p className="text-xs text-zinc-500 mt-1">{getFridaysInYear(year)} Fridays this year</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-zinc-500 mb-1">YTD received</p>
          <p className="text-xl font-bold text-emerald-400">{formatCurrency(ytdPaid)}</p>
          <p className="text-xs text-zinc-500 mt-1">{allFridaysYTD.length} payments so far</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Upcoming schedule */}
        <div className="xl:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Payments</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="text-left px-5 py-3 text-xs font-medium text-zinc-500 uppercase">#</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-zinc-500 uppercase">Date</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-zinc-500 uppercase">Time</th>
                    <th className="text-right px-5 py-3 text-xs font-medium text-zinc-500 uppercase">Amount</th>
                    <th className="text-right px-5 py-3 text-xs font-medium text-zinc-500 uppercase">Cumulative</th>
                  </tr>
                </thead>
                <tbody>
                  {upcomingFridays.map((friday, i) => (
                    <tr key={friday.toISOString()} className="border-b border-zinc-800/50 hover:bg-zinc-800/20">
                      <td className="px-5 py-3 text-sm text-zinc-600">{i + 1}</td>
                      <td className="px-5 py-3">
                        <p className="text-sm font-medium text-white">{format(friday, 'EEEE d MMMM yyyy')}</p>
                      </td>
                      <td className="px-5 py-3 text-sm text-zinc-400">6:00 PM</td>
                      <td className="px-5 py-3 text-right text-sm font-medium text-emerald-400">
                        {formatCurrency(weeklyAmount)}
                      </td>
                      <td className="px-5 py-3 text-right text-sm text-zinc-400 font-mono">
                        {formatCurrency(weeklyAmount * (i + 1))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>

        {/* Config + monthly breakdown */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <DividendConfigForm existing={config} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{format(now, 'MMMM')} Fridays</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-zinc-800/50">
                {fridaysThisMonth.map(friday => {
                  const payTime = new Date(friday)
                  payTime.setHours(18, 0, 0, 0)
                  const paid = payTime < now
                  return (
                    <div key={friday.toISOString()} className="flex items-center justify-between px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`h-2 w-2 rounded-full ${paid ? 'bg-emerald-400' : 'bg-zinc-600'}`} />
                        <p className="text-sm text-white">{format(friday, 'd MMM')}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className={`text-sm font-medium ${paid ? 'text-emerald-400' : 'text-zinc-400'}`}>
                          {formatCurrency(weeklyAmount)}
                        </p>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${paid ? 'bg-emerald-400/10 text-emerald-400' : 'bg-zinc-800 text-zinc-500'}`}>
                          {paid ? 'paid' : 'upcoming'}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="px-5 py-3 border-t border-zinc-800 flex items-center justify-between">
                <p className="text-xs text-zinc-500">Month total</p>
                <p className="text-sm font-semibold text-white">{formatCurrency(monthForecast)}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
