'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { formatCurrency } from '@/lib/utils'
import { SpendingCategory } from '@/types'

const COLORS = ['#6366f1', '#34d399', '#f59e0b', '#f43f5e', '#a78bfa', '#38bdf8', '#fb923c', '#4ade80', '#e879f9', '#94a3b8']

interface SpendingBreakdownChartProps {
  categories: SpendingCategory[]
}

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { payload: SpendingCategory; name: string }[] }) => {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-3 shadow-xl">
      <p className="text-sm font-medium text-white">{d.category}</p>
      <p className="text-xs text-zinc-400 mt-1">{formatCurrency(d.amount)}</p>
      <p className="text-xs text-zinc-500">{d.percentage.toFixed(1)}% of spend</p>
      <p className="text-xs text-zinc-500">{d.count} transactions</p>
    </div>
  )
}

export function SpendingBreakdownChart({ categories }: SpendingBreakdownChartProps) {
  const top8 = categories.slice(0, 8)

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Spending Breakdown</h3>
      <div className="flex gap-6">
        <ResponsiveContainer width={200} height={200}>
          <PieChart>
            <Pie data={top8} dataKey="amount" nameKey="category" cx="50%" cy="50%" innerRadius={55} outerRadius={90} strokeWidth={0}>
              {top8.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex-1 space-y-1.5">
          {top8.map((cat, i) => (
            <div key={cat.category} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                <span className="text-xs text-zinc-400 truncate max-w-[120px]">{cat.category}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-zinc-500">{cat.percentage.toFixed(0)}%</span>
                <span className="text-xs font-medium text-white w-20 text-right">{formatCurrency(cat.amount)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
