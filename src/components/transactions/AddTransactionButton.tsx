'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Plus, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export function AddTransactionButton() {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const [form, setForm] = useState({
    description: '', amount: '', type: 'expense', category: 'Uncategorised',
    date: new Date().toISOString().split('T')[0], merchant: '', income_source: '',
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await supabase.from('transactions').insert({
        description: form.description,
        amount: parseFloat(form.amount),
        type: form.type,
        category: form.category,
        date: form.date,
        merchant: form.merchant || null,
        income_source: form.income_source || null,
        is_recurring: false,
      })
      router.refresh()
      setOpen(false)
      setForm({ description: '', amount: '', type: 'expense', category: 'Uncategorised', date: new Date().toISOString().split('T')[0], merchant: '', income_source: '' })
    } finally {
      setLoading(false)
    }
  }

  const commonCategories = ['Groceries', 'Dining Out', 'Uber Eats', 'Transport', 'Petrol', 'Shopping', 'Health', 'Entertainment', 'Utilities', 'Rent', 'Insurance', 'Subscriptions', 'Other']

  return (
    <>
      <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" />Add</Button>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md mx-4 shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-zinc-800">
              <h2 className="text-lg font-semibold text-white">Add Transaction</h2>
              <button onClick={() => setOpen(false)} className="text-zinc-400 hover:text-white"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="text-xs text-zinc-400 mb-1.5 block">Description</label>
                <input className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500"
                  placeholder="e.g. Woolworths grocery run" value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-400 mb-1.5 block">Amount</label>
                  <input type="number" step="0.01" min="0" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500"
                    placeholder="0.00" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} required />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 mb-1.5 block">Type</label>
                  <select className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                    value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-zinc-400 mb-1.5 block">Category</label>
                  <select className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                    value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                    {commonCategories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-zinc-400 mb-1.5 block">Date</label>
                  <input type="date" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                    value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required />
                </div>
                {form.type === 'income' && (
                  <div className="col-span-2">
                    <label className="text-xs text-zinc-400 mb-1.5 block">Income Source</label>
                    <select className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                      value={form.income_source} onChange={e => setForm(f => ({ ...f, income_source: e.target.value }))}>
                      <option value="">Other</option>
                      <option value="salary">Salary</option>
                      <option value="dividend">Dividend</option>
                      <option value="token_vest">Token Vest</option>
                    </select>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-3 pt-2 border-t border-zinc-800">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={loading}>{loading ? 'Adding...' : 'Add'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
