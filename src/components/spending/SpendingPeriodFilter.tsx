'use client'

import { useRouter } from 'next/navigation'

const periods = [
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'last_month', label: 'Last Month' },
  { value: '3month', label: 'Last 3 Months' },
]

export function SpendingPeriodFilter({ currentPeriod }: { currentPeriod: string }) {
  const router = useRouter()
  return (
    <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-lg p-1">
      {periods.map(p => (
        <button
          key={p.value}
          onClick={() => router.push(`/spending?period=${p.value}`)}
          className={`px-3 py-1.5 text-xs rounded-md font-medium transition-colors ${
            currentPeriod === p.value ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  )
}
