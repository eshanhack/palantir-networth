'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Plus, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export function AddBillButton() {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<'recurring' | 'oneoff'>('recurring')
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [recurring, setRecurring] = useState({ name: '', amount: '', frequency: 'monthly', next_due_date: '', category: 'Bills' })
  const [oneoff, setOneoff] = useState({ name: '', amount: '', due_date: '', notes: '' })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (tab === 'recurring') {
        await supabase.from('recurring_bills').insert({
          name: recurring.name, amount: parseFloat(recurring.amount),
          frequency: recurring.frequency, next_due_date: recurring.next_due_date,
          category: recurring.category, is_active: true,
        })
      } else {
        await supabase.from('one_off_bills').insert({
          name: oneoff.name, amount: parseFloat(oneoff.amount),
          due_date: oneoff.due_date, notes: oneoff.notes || null, is_paid: false,
        })
      }
      router.refresh()
      setOpen(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" />Add Bill</Button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md mx-4 shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-zinc-800">
              <h2 className="text-lg font-semibold text-white">Add Bill</h2>
              <button onClick={() => setOpen(false)} className="text-zinc-400 hover:text-white"><X className="h-5 w-5" /></button>
            </div>
            <div className="flex border-b border-zinc-800">
              {(['recurring', 'oneoff'] as const).map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className={`flex-1 py-3 text-sm font-medium transition-colors ${tab === t ? 'text-white border-b-2 border-indigo-500' : 'text-zinc-400 hover:text-zinc-200'}`}>
                  {t === 'recurring' ? 'Recurring' : 'One-Off'}
                </button>
              ))}
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {tab === 'recurring' ? (
                <>
                  <div><label className="text-xs text-zinc-400 mb-1.5 block">Name</label>
                    <input className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500"
                      placeholder="e.g. Netflix, Gym, Rent" value={recurring.name} onChange={e => setRecurring(r => ({ ...r, name: e.target.value }))} required /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="text-xs text-zinc-400 mb-1.5 block">Amount</label>
                      <input type="number" step="0.01" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500"
                        placeholder="0.00" value={recurring.amount} onChange={e => setRecurring(r => ({ ...r, amount: e.target.value }))} required /></div>
                    <div><label className="text-xs text-zinc-400 mb-1.5 block">Frequency</label>
                      <select className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                        value={recurring.frequency} onChange={e => setRecurring(r => ({ ...r, frequency: e.target.value }))}>
                        <option value="weekly">Weekly</option>
                        <option value="fortnightly">Fortnightly</option>
                        <option value="monthly">Monthly</option>
                        <option value="quarterly">Quarterly</option>
                        <option value="yearly">Yearly</option>
                      </select></div>
                    <div><label className="text-xs text-zinc-400 mb-1.5 block">Next Due Date</label>
                      <input type="date" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                        value={recurring.next_due_date} onChange={e => setRecurring(r => ({ ...r, next_due_date: e.target.value }))} required /></div>
                    <div><label className="text-xs text-zinc-400 mb-1.5 block">Category</label>
                      <input className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500"
                        placeholder="Bills" value={recurring.category} onChange={e => setRecurring(r => ({ ...r, category: e.target.value }))} /></div>
                  </div>
                </>
              ) : (
                <>
                  <div><label className="text-xs text-zinc-400 mb-1.5 block">Name</label>
                    <input className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500"
                      placeholder="e.g. Car Registration, HECS payment" value={oneoff.name} onChange={e => setOneoff(o => ({ ...o, name: e.target.value }))} required /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="text-xs text-zinc-400 mb-1.5 block">Amount</label>
                      <input type="number" step="0.01" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500"
                        placeholder="0.00" value={oneoff.amount} onChange={e => setOneoff(o => ({ ...o, amount: e.target.value }))} required /></div>
                    <div><label className="text-xs text-zinc-400 mb-1.5 block">Due Date</label>
                      <input type="date" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                        value={oneoff.due_date} onChange={e => setOneoff(o => ({ ...o, due_date: e.target.value }))} required /></div>
                  </div>
                  <div><label className="text-xs text-zinc-400 mb-1.5 block">Notes</label>
                    <textarea className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500 resize-none"
                      rows={2} placeholder="Optional notes" value={oneoff.notes} onChange={e => setOneoff(o => ({ ...o, notes: e.target.value }))} /></div>
                </>
              )}
              <div className="flex justify-end gap-3 pt-2 border-t border-zinc-800">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={loading}>{loading ? 'Adding...' : 'Add Bill'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
