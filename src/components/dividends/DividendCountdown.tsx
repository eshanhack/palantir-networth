'use client'

import { useState, useEffect } from 'react'

function getNextFriday6pm(): Date {
  const now = new Date()
  const next = new Date(now)
  // Day of week: 0=Sun, 5=Fri
  const day = now.getDay()
  const daysUntilFriday = (5 - day + 7) % 7
  next.setDate(now.getDate() + (daysUntilFriday === 0 ? 0 : daysUntilFriday))
  next.setHours(18, 0, 0, 0)
  // If it's Friday but already past 6pm, move to next Friday
  if (next <= now) {
    next.setDate(next.getDate() + 7)
  }
  return next
}

function pad(n: number) {
  return String(n).padStart(2, '0')
}

export function DividendCountdown({ weeklyAmount }: { weeklyAmount: number }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  const [nextDate, setNextDate] = useState<Date | null>(null)

  useEffect(() => {
    const target = getNextFriday6pm()
    setNextDate(target)

    const tick = () => {
      const now = new Date()
      const diff = target.getTime() - now.getTime()
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 })
        return
      }
      setTimeLeft({
        days: Math.floor(diff / 86_400_000),
        hours: Math.floor((diff % 86_400_000) / 3_600_000),
        minutes: Math.floor((diff % 3_600_000) / 60_000),
        seconds: Math.floor((diff % 60_000) / 1_000),
      })
    }

    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  const dateStr = nextDate
    ? nextDate.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })
    : ''

  return (
    <div className="text-center py-2">
      <p className="text-xs text-zinc-500 mb-3 uppercase tracking-wider">Next dividend — {dateStr} at 6:00 PM</p>
      <div className="flex items-center justify-center gap-3">
        {[
          { label: 'Days', value: timeLeft.days },
          { label: 'Hours', value: timeLeft.hours },
          { label: 'Min', value: timeLeft.minutes },
          { label: 'Sec', value: timeLeft.seconds },
        ].map(({ label, value }, i) => (
          <div key={label} className="flex items-center gap-3">
            {i > 0 && <span className="text-2xl font-light text-zinc-600">:</span>}
            <div className="bg-zinc-800 rounded-xl px-4 py-3 min-w-[72px] text-center">
              <p className="text-3xl font-bold text-white tabular-nums">{pad(value)}</p>
              <p className="text-xs text-zinc-500 mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>
      {weeklyAmount > 0 && (
        <p className="text-sm text-emerald-400 font-medium mt-4">
          +{new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(weeklyAmount)} incoming
        </p>
      )}
    </div>
  )
}
