'use client'

import { useState } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { format } from 'date-fns'
import { formatCurrency } from '@/lib/utils'
import { NetWorthSnapshot } from '@/types'

const periods = ['1W', '1M', '3M', '6M', '1Y', 'ALL'] as const
type Period = typeof periods[number]

interface NetWorthChartProps {
  snapshots: NetWorthSnapshot[]
}

function filterByPeriod(snapshots: NetWorthSnapshot[], period: Period): NetWorthSnapshot[] {
  const now = new Date()
  const cutoff = new Date(now)
  switch (period) {
    case '1W': cutoff.setDate(now.getDate() - 7); break
    case '1M': cutoff.setMonth(now.getMonth() - 1); break
    case '3M': cutoff.setMonth(now.getMonth() - 3); break
    case '6M': cutoff.setMonth(now.getMonth() - 6); break
    case '1Y': cutoff.setFullYear(now.getFullYear() - 1); break
    case 'ALL': return snapshots
  }
  return snapshots.filter(s => new Date(s.date) >= cutoff)
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string; color: string }[]; label?: string }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-3 shadow-xl">
      <p className="text-xs text-zinc-400 mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center justify-between gap-6">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full" style={{ background: p.color }} />
            <span className="text-xs text-zinc-400">{p.name}</span>
          </div>
          <span className="text-xs font-semibold text-white">{formatCurrency(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

export function NetWorthChart({ snapshots }: NetWorthChartProps) {
  const [period, setPeriod] = useState<Period>('3M')
  const filtered = filterByPeriod(snapshots, period)

  const data = filtered.map(s => ({
    date: format(new Date(s.date), 'dd MMM'),
    'Net Worth': s.net_worth,
    'Liquid NW': s.liquid_net_worth,
    'Assets': s.total_assets,
  }))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Net Worth Over Time</h3>
        <div className="flex gap-1">
          {periods.map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                period === p ? 'bg-indigo-600 text-white' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: 10 }}>
          <defs>
            <linearGradient id="netWorthGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="liquidGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#34d399" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
          <XAxis dataKey="date" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={v => formatCurrency(v, 'AUD', true)} tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} width={70} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 12, color: '#71717a' }} />
          <Area type="monotone" dataKey="Net Worth" stroke="#6366f1" strokeWidth={2} fill="url(#netWorthGrad)" dot={false} />
          <Area type="monotone" dataKey="Liquid NW" stroke="#34d399" strokeWidth={2} fill="url(#liquidGrad)" dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
