'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Pencil, Check, X } from 'lucide-react'

interface Props {
  existing: { id: string; weekly_amount: number; notes?: string | null } | null
}

export function DividendConfigForm({ existing }: Props) {
  const router = useRouter()
  const [editing, setEditing] = useState(!existing)
  const [loading, setLoading] = useState(false)
  const [amount, setAmount] = useState(existing?.weekly_amount?.toString() ?? '')
  const [notes, setNotes] = useState(existing?.notes ?? '')
  const [error, setError] = useState('')

  const handleSave = async () => {
    setLoading(true)
    setError('')
    try {
      const payload = {
        weekly_amount: parseFloat(amount) || 0,
        notes: notes || null,
        updated_at: new Date().toISOString(),
      }
      if (existing) {
        const { error: err } = await supabase.from('dividend_config').update(payload).eq('id', existing.id)
        if (err) throw err
      } else {
        const { error: err } = await supabase.from('dividend_config').insert(payload)
        if (err) throw err
      }
      router.refresh()
      setEditing(false)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setAmount(existing?.weekly_amount?.toString() ?? '')
    setNotes(existing?.notes ?? '')
    setEditing(false)
    setError('')
  }

  const inputCls = 'w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500'

  if (!editing && existing) {
    return (
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-zinc-500 mb-0.5">Weekly dividend amount</p>
          <p className="text-2xl font-bold text-white">
            {new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(existing.weekly_amount)}
          </p>
          {existing.notes && <p className="text-xs text-zinc-500 mt-1">{existing.notes}</p>}
        </div>
        <button
          onClick={() => setEditing(true)}
          className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-zinc-800 transition-colors"
        >
          <Pencil className="h-3.5 w-3.5" />
          Edit
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs text-zinc-400 mb-1.5 block">Weekly dividend amount (AUD)</label>
        <input
          type="number" step="0.01" min="0"
          className={inputCls}
          placeholder="0.00"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          autoFocus
        />
      </div>
      <div>
        <label className="text-xs text-zinc-400 mb-1.5 block">Notes (optional)</label>
        <input
          className={inputCls}
          placeholder="e.g. VAS + NDQ dividends"
          value={notes}
          onChange={e => setNotes(e.target.value)}
        />
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
      <div className="flex gap-2">
        <Button onClick={handleSave} disabled={loading} className="gap-1.5">
          <Check className="h-3.5 w-3.5" />
          {loading ? 'Saving...' : 'Save'}
        </Button>
        {existing && (
          <Button variant="outline" onClick={handleCancel}>
            <X className="h-3.5 w-3.5" />
            Cancel
          </Button>
        )}
      </div>
    </div>
  )
}
