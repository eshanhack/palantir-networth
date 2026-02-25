'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Plus, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export function AddLiabilityButton() {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ name: '', type: 'loan', balance: '', interest_rate: '', minimum_payment: '', due_date: '' })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await supabase.from('liabilities').insert({
        name: form.name, type: form.type, balance: parseFloat(form.balance),
        interest_rate: form.interest_rate ? parseFloat(form.interest_rate) / 100 : null,
        minimum_payment: form.minimum_payment ? parseFloat(form.minimum_payment) : null,
        due_date: form.due_date || null,
      })
      router.refresh()
      setOpen(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" />Add Liability</Button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md mx-4 shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-zinc-800">
              <h2 className="text-lg font-semibold text-white">Add Liability</h2>
              <button onClick={() => setOpen(false)} className="text-zinc-400 hover:text-white"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div><label className="text-xs text-zinc-400 mb-1.5 block">Name</label>
                <input className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500"
                  placeholder="e.g. HECS, Car Loan" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs text-zinc-400 mb-1.5 block">Type</label>
                  <select className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                    value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                    <option value="mortgage">Mortgage</option>
                    <option value="loan">Loan</option>
                    <option value="credit_card">Credit Card</option>
                    <option value="other">Other</option>
                  </select></div>
                <div><label className="text-xs text-zinc-400 mb-1.5 block">Balance (AUD)</label>
                  <input type="number" step="0.01" min="0" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500"
                    placeholder="0.00" value={form.balance} onChange={e => setForm(f => ({ ...f, balance: e.target.value }))} required /></div>
                <div><label className="text-xs text-zinc-400 mb-1.5 block">Interest Rate (%)</label>
                  <input type="number" step="0.01" min="0" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500"
                    placeholder="e.g. 6.5" value={form.interest_rate} onChange={e => setForm(f => ({ ...f, interest_rate: e.target.value }))} /></div>
                <div><label className="text-xs text-zinc-400 mb-1.5 block">Min. Monthly Payment</label>
                  <input type="number" step="0.01" min="0" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500"
                    placeholder="0.00" value={form.minimum_payment} onChange={e => setForm(f => ({ ...f, minimum_payment: e.target.value }))} /></div>
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
