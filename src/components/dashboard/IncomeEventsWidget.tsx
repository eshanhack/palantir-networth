'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { Briefcase, TrendingUp, Coins } from 'lucide-react'

interface IncomeEvent {
  label: string
  datetime: string  // ISO string including time
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

function pad(n: number) { return String(n).padStart(2, '0') }

function IncomeEventRow({ event }: { event: IncomeEvent }) {
  const [countdown, setCountdown] = useState('')

  useEffect(() => {
    const target = new Date(event.datetime)

    const tick = () => {
      const diff = target.getTime() - Date.now()
      if (diff <= 0) { setCountdown('now'); return }
      const days = Math.floor(diff / 86_400_000)
      const hours = Math.floor((diff % 86_400_000) / 3_600_000)
      const mins = Math.floor((diff % 3_600_000) / 60_000)
      const secs = Math.floor((diff % 60_000) / 1_000)
      if (days > 0) setCountdown(`${days}d ${pad(hours)}h ${pad(mins)}m`)
      else setCountdown(`${pad(hours)}:${pad(mins)}:${pad(secs)}`)
    }

    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [event.datetime])

  const Icon = icons[event.icon]

  return (
    <div className="flex items-center gap-3">
      <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${colors[event.icon]}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{event.label}</p>
        <p className="text-xs text-zinc-500">{event.description}</p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-sm font-semibold text-white">{formatCurrency(event.amount)}</p>
        <p className="text-xs text-zinc-400 font-mono tabular-nums">{countdown}</p>
      </div>
    </div>
  )
}

export function IncomeEventsWidget({ events }: IncomeEventsWidgetProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Next Income Events</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {events.map((event, i) => (
            <IncomeEventRow key={i} event={event} />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
