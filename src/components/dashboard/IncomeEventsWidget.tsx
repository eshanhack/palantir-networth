'use client'

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { formatCurrency, formatDate, daysUntil } from '@/lib/utils'
import { Briefcase, TrendingUp, Coins } from 'lucide-react'

interface IncomeEvent {
  label: string
  date: string
  amount: number
  icon: 'salary' | 'dividend' | 'vest'
  description: string
}

interface IncomeEventsWidgetProps {
  events: IncomeEvent[]
}

const icons = {
  salary: Briefcase,
  dividend: TrendingUp,
  vest: Coins,
}

const colors = {
  salary: 'text-indigo-400 bg-indigo-400/10',
  dividend: 'text-emerald-400 bg-emerald-400/10',
  vest: 'text-amber-400 bg-amber-400/10',
}

export function IncomeEventsWidget({ events }: IncomeEventsWidgetProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Next Income Events</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {events.map((event, i) => {
            const Icon = icons[event.icon]
            const days = daysUntil(event.date)
            return (
              <div key={i} className="flex items-center gap-3">
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${colors[event.icon]}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{event.label}</p>
                  <p className="text-xs text-zinc-500">{event.description}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-white">{formatCurrency(event.amount)}</p>
                  <p className="text-xs text-zinc-500">
                    {days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `in ${days}d`}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
