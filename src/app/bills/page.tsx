import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate, daysUntil } from '@/lib/utils'
import { AddBillButton } from '@/components/bills/AddBillButton'
import { MarkPaidButton } from '@/components/bills/MarkPaidButton'

export const dynamic = 'force-dynamic'

export default async function BillsPage() {
  const [recurringRes, oneOffRes] = await Promise.all([
    supabase.from('recurring_bills').select('*').order('next_due_date'),
    supabase.from('one_off_bills').select('*').eq('is_paid', false).order('due_date'),
  ])

  const recurring = recurringRes.data ?? []
  const oneOff = oneOffRes.data ?? []

  const monthlyRecurring = recurring.reduce((s, b) => {
    const multipliers: Record<string, number> = { weekly: 4.33, fortnightly: 2.17, monthly: 1, quarterly: 0.33, yearly: 0.083 }
    return s + Number(b.amount) * (multipliers[b.frequency] ?? 1)
  }, 0)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Bills</h1>
          <p className="text-sm text-zinc-500 mt-0.5">~{formatCurrency(monthlyRecurring)}/month in recurring bills</p>
        </div>
        <AddBillButton />
      </div>

      {/* One-off bills */}
      {oneOff.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-3">One-Off Bills</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {oneOff.map(bill => {
              const days = daysUntil(bill.due_date)
              const urgency = days <= 3 ? 'danger' : days <= 7 ? 'warning' : days <= 14 ? 'info' : 'default'
              return (
                <Card key={bill.id} className="relative overflow-hidden">
                  {days <= 3 && <div className="absolute inset-x-0 top-0 h-0.5 bg-red-500" />}
                  {days > 3 && days <= 7 && <div className="absolute inset-x-0 top-0 h-0.5 bg-amber-500" />}
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-sm font-semibold text-white">{bill.name}</h3>
                        <p className="text-xs text-zinc-500 mt-0.5">{formatDate(bill.due_date)}</p>
                      </div>
                      <Badge variant={urgency as 'danger' | 'warning' | 'info' | 'default'}>
                        {days === 0 ? 'Due Today' : days < 0 ? 'Overdue' : `${days} days`}
                      </Badge>
                    </div>
                    <p className="text-2xl font-bold text-white mb-3">{formatCurrency(Number(bill.amount))}</p>
                    {bill.notes && <p className="text-xs text-zinc-500 mb-3">{bill.notes}</p>}
                    <MarkPaidButton billId={bill.id} />
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* Recurring bills */}
      <div>
        <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-3">Recurring Bills</h2>
        <Card>
          <CardContent className="p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left px-5 py-3 text-xs font-medium text-zinc-500 uppercase">Name</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-zinc-500 uppercase">Frequency</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-zinc-500 uppercase">Amount</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-zinc-500 uppercase">Monthly equiv.</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-zinc-500 uppercase">Next Due</th>
                </tr>
              </thead>
              <tbody>
                {recurring.map(bill => {
                  const multipliers: Record<string, number> = { weekly: 4.33, fortnightly: 2.17, monthly: 1, quarterly: 0.33, yearly: 0.083 }
                  const monthly = Number(bill.amount) * (multipliers[bill.frequency] ?? 1)
                  const days = daysUntil(bill.next_due_date)
                  return (
                    <tr key={bill.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/20">
                      <td className="px-5 py-3">
                        <p className="text-sm font-medium text-white">{bill.name}</p>
                        <p className="text-xs text-zinc-500">{bill.category}</p>
                      </td>
                      <td className="px-5 py-3 capitalize text-sm text-zinc-400">{bill.frequency}</td>
                      <td className="px-5 py-3 text-right text-sm font-semibold text-white">{formatCurrency(Number(bill.amount))}</td>
                      <td className="px-5 py-3 text-right text-sm text-zinc-400">{formatCurrency(monthly)}</td>
                      <td className="px-5 py-3">
                        <Badge variant={days <= 3 ? 'danger' : days <= 7 ? 'warning' : 'default'}>
                          {days === 0 ? 'Today' : `in ${days}d`}
                        </Badge>
                      </td>
                    </tr>
                  )
                })}
                {recurring.length === 0 && (
                  <tr><td colSpan={5} className="px-5 py-8 text-center text-zinc-500 text-sm">No recurring bills added yet.</td></tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
