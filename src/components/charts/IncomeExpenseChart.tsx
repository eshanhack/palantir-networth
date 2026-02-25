'use client'

import { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine,
} from 'recharts'
import { formatCurrency } from '@/lib/utils'

interface MonthlyData {
  month: string
  income: number
  expenses: number
  net: number
  incomeGross?: number
}

interface IncomeExpenseChartProps {
  data: MonthlyData[]
  showTaxToggle?: boolean
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

export function IncomeExpenseChart({ data, showTaxToggle = true }: IncomeExpenseChartProps) {
  const [preTax, setPreTax] = useState(false)

  const chartData = data.map(d => ({
    ...d,
    income: preTax ? (d.incomeGross ?? d.income) : d.income,
    net: preTax ? (d.incomeGross ?? d.income) - d.expenses : d.net,
  }))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Income vs Expenses</h3>
        {showTaxToggle && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500">Post-tax</span>
            <button
              onClick={() => setPreTax(!preTax)}
              className={`relative w-9 h-5 rounded-full transition-colors ${preTax ? 'bg-indigo-600' : 'bg-zinc-700'}`}
            >
              <span className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform ${preTax ? 'translate-x-4' : 'translate-x-0'}`} />
            </button>
            <span className="text-xs text-zinc-500">Pre-tax</span>
          </div>
        )}
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: 10 }} barGap={4}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
          <XAxis dataKey="month" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={v => formatCurrency(v, 'AUD', true)} tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} width={70} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 12, color: '#71717a' }} />
          <ReferenceLine y={0} stroke="#3f3f46" />
          <Bar dataKey="income" name="Income" fill="#6366f1" radius={[3, 3, 0, 0]} maxBarSize={40} />
          <Bar dataKey="expenses" name="Expenses" fill="#f43f5e" radius={[3, 3, 0, 0]} maxBarSize={40} />
          <Bar dataKey="net" name="Net" fill="#34d399" radius={[3, 3, 0, 0]} maxBarSize={40} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
