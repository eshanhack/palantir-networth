'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface IncomeConfigFormProps {
  existing: {
    id: string
    salary_gross_annual: number
    salary_frequency: string
    next_salary_date: string
  } | null
}

export function IncomeConfigForm({ existing }: IncomeConfigFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    salary_gross_annual: existing?.salary_gross_annual?.toString() ?? '',
    salary_frequency: existing?.salary_frequency ?? 'fortnightly',
    next_salary_date: existing?.next_salary_date ?? '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const data = {
        salary_gross_annual: parseFloat(form.salary_gross_annual),
        salary_frequency: form.salary_frequency,
        next_salary_date: form.next_salary_date,
      }
      if (existing) {
        await supabase.from('income_config').update(data).eq('id', existing.id)
      } else {
        await supabase.from('income_config').insert(data)
      }
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Salary Configuration</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-zinc-400 mb-1.5 block">Gross Annual Salary (AUD)</label>
            <input
              type="number" step="1" min="0"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500"
              placeholder="e.g. 120000"
              value={form.salary_gross_annual}
              onChange={e => setForm(f => ({ ...f, salary_gross_annual: e.target.value }))}
              required
            />
            <p className="text-xs text-zinc-500 mt-1">ATO 2024-25 brackets used for tax calc</p>
          </div>
          <div>
            <label className="text-xs text-zinc-400 mb-1.5 block">Pay Frequency</label>
            <select
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              value={form.salary_frequency}
              onChange={e => setForm(f => ({ ...f, salary_frequency: e.target.value }))}
            >
              <option value="weekly">Weekly</option>
              <option value="fortnightly">Fortnightly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-zinc-400 mb-1.5 block">Next Pay Date</label>
            <input
              type="date"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              value={form.next_salary_date}
              onChange={e => setForm(f => ({ ...f, next_salary_date: e.target.value }))}
              required
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Saving...' : existing ? 'Update' : 'Save'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
