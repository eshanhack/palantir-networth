'use client'

import { useRouter, usePathname } from 'next/navigation'

const periods = [
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: '3month', label: 'Last 3 Months' },
  { value: 'year', label: 'This Year' },
]

interface TransactionFiltersProps {
  period: string
  categories: string[]
}

export function TransactionFilters({ period, categories }: TransactionFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()

  const setFilter = (key: string, value: string) => {
    const params = new URLSearchParams(window.location.search)
    if (value) params.set(key, value)
    else params.delete(key)
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-lg p-1">
        {periods.map(p => (
          <button
            key={p.value}
            onClick={() => setFilter('period', p.value)}
            className={`px-3 py-1.5 text-xs rounded-md font-medium transition-colors ${
              period === p.value ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
      <select
        onChange={e => setFilter('category', e.target.value)}
        className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-400 focus:outline-none focus:border-indigo-500"
      >
        <option value="">All Categories</option>
        {categories.map(c => <option key={c} value={c}>{c}</option>)}
      </select>
      <select
        onChange={e => setFilter('type', e.target.value)}
        className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-400 focus:outline-none focus:border-indigo-500"
      >
        <option value="">All Types</option>
        <option value="income">Income</option>
        <option value="expense">Expense</option>
      </select>
    </div>
  )
}
