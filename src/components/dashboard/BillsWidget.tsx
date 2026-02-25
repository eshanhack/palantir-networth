import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, daysUntil, formatDate } from '@/lib/utils'
import { RecurringBill, OneOffBill } from '@/types'
import { AlertCircle, RefreshCw } from 'lucide-react'

interface BillsWidgetProps {
  recurringBills: RecurringBill[]
  oneOffBills: OneOffBill[]
}

function urgencyVariant(days: number): 'danger' | 'warning' | 'info' | 'default' {
  if (days <= 3) return 'danger'
  if (days <= 7) return 'warning'
  if (days <= 14) return 'info'
  return 'default'
}

export function BillsWidget({ recurringBills, oneOffBills }: BillsWidgetProps) {
  const upcomingRecurring = recurringBills
    .filter(b => b.is_active)
    .sort((a, b) => new Date(a.next_due_date).getTime() - new Date(b.next_due_date).getTime())
    .slice(0, 4)

  const upcomingOneOff = oneOffBills
    .filter(b => !b.is_paid && daysUntil(b.due_date) >= 0)
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
    .slice(0, 3)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upcoming Bills</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {upcomingOneOff.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <AlertCircle className="h-3 w-3 text-amber-400" />
                <span className="text-xs text-amber-400 font-medium">One-off</span>
              </div>
              {upcomingOneOff.map(bill => {
                const days = daysUntil(bill.due_date)
                return (
                  <div key={bill.id} className="flex items-center justify-between py-2 border-b border-zinc-800/50 last:border-0">
                    <div>
                      <p className="text-sm text-white font-medium">{bill.name}</p>
                      <p className="text-xs text-zinc-500 mt-0.5">{formatDate(bill.due_date)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-white">{formatCurrency(bill.amount)}</p>
                      <Badge variant={urgencyVariant(days)} className="mt-0.5">
                        {days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `${days}d`}
                      </Badge>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {upcomingRecurring.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <RefreshCw className="h-3 w-3 text-zinc-400" />
                <span className="text-xs text-zinc-400 font-medium">Recurring</span>
              </div>
              {upcomingRecurring.map(bill => {
                const days = daysUntil(bill.next_due_date)
                return (
                  <div key={bill.id} className="flex items-center justify-between py-2 border-b border-zinc-800/50 last:border-0">
                    <div>
                      <p className="text-sm text-zinc-300">{bill.name}</p>
                      <p className="text-xs text-zinc-500 mt-0.5 capitalize">{bill.frequency}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-white">{formatCurrency(bill.amount)}</p>
                      <Badge variant={urgencyVariant(days)} className="mt-0.5">
                        {days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `${days}d`}
                      </Badge>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {upcomingRecurring.length === 0 && upcomingOneOff.length === 0 && (
            <p className="text-sm text-zinc-500 text-center py-4">No upcoming bills</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
