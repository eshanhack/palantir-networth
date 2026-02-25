'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import { AssetType } from '@/types'

interface AddAssetModalProps {
  open: boolean
  onClose: () => void
}

const assetTypes: { value: AssetType; label: string }[] = [
  { value: 'cash', label: 'Cash / Bank Account' },
  { value: 'property', label: 'Property / Real Estate' },
  { value: 'stock', label: 'Stock' },
  { value: 'etf', label: 'ETF' },
  { value: 'crypto', label: 'Crypto Token' },
  { value: 'other', label: 'Other' },
]

export function AddAssetModal({ open, onClose }: AddAssetModalProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '',
    type: 'cash' as AssetType,
    value: '',
    cost_basis: '',
    quantity: '',
    symbol: '',
    coingecko_id: '',
    is_liquid: true,
    notes: '',
  })
  const [hasVesting, setHasVesting] = useState(false)
  const [vesting, setVesting] = useState({
    total_tokens: '',
    vest_amount: '',
    vest_frequency: 'month',
    vest_start_date: '',
  })

  if (!open) return null

  const isCrypto = form.type === 'crypto'
  const isStock = form.type === 'stock' || form.type === 'etf'
  const hasQuantity = isCrypto || isStock
  const valueLabel = hasQuantity ? 'Price per Unit (AUD)' : 'Current Value (AUD)'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data: asset, error } = await supabase.from('assets').insert({
        name: form.name,
        type: form.type,
        value: parseFloat(form.value) || 0,
        cost_basis: form.cost_basis ? parseFloat(form.cost_basis) : null,
        quantity: form.quantity ? parseFloat(form.quantity) : null,
        symbol: form.symbol || null,
        coingecko_id: form.coingecko_id || null,
        is_liquid: form.is_liquid,
        notes: form.notes || null,
      }).select().single()

      if (error) throw error

      if (isCrypto && hasVesting && asset) {
        const startDate = new Date(vesting.vest_start_date)
        const vestAmt = parseFloat(vesting.vest_amount) || 0
        let nextVest = new Date(startDate)
        const now = new Date()
        while (nextVest <= now) {
          if (vesting.vest_frequency === 'month') nextVest.setMonth(nextVest.getMonth() + 1)
          else if (vesting.vest_frequency === 'week') nextVest.setDate(nextVest.getDate() + 7)
          else if (vesting.vest_frequency === 'day') nextVest.setDate(nextVest.getDate() + 1)
          else break
        }

        await supabase.from('token_vesting_schedules').insert({
          asset_id: asset.id,
          token_symbol: form.symbol,
          token_name: form.name,
          coingecko_id: form.coingecko_id || null,
          total_tokens: parseFloat(vesting.total_tokens) || 0,
          vested_tokens: 0,
          vest_frequency: vesting.vest_frequency,
          vest_amount: vestAmt,
          vest_start_date: vesting.vest_start_date,
          next_vest_date: nextVest.toISOString(),
        })
      }

      router.refresh()
      onClose()
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-zinc-800">
          <h2 className="text-lg font-semibold text-white">Add Asset</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-xs text-zinc-400 mb-1.5 block">Asset Name</label>
              <input
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500"
                placeholder="e.g. Commonwealth Bank Savings"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="text-xs text-zinc-400 mb-1.5 block">Type</label>
              <select
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                value={form.type}
                onChange={e => setForm(f => ({ ...f, type: e.target.value as AssetType }))}
              >
                {assetTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-zinc-400 mb-1.5 block">{valueLabel}</label>
              <input
                type="number" step="any" min="0"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500"
                placeholder="0.00"
                value={form.value}
                onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
                required
              />
            </div>
            {(isCrypto || isStock) && (
              <>
                <div>
                  <label className="text-xs text-zinc-400 mb-1.5 block">Symbol / Ticker</label>
                  <input
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white font-mono placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500"
                    placeholder={isCrypto ? 'e.g. bitcoin' : 'e.g. VAS'}
                    value={form.symbol}
                    onChange={e => setForm(f => ({ ...f, symbol: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 mb-1.5 block">Quantity</label>
                  <input
                    type="number" step="any" min="0"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500"
                    placeholder="0"
                    value={form.quantity}
                    onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
                  />
                </div>
              </>
            )}
            <div>
              <label className="text-xs text-zinc-400 mb-1.5 block">{hasQuantity ? 'Avg. Buy Price (AUD)' : 'Cost Basis (AUD)'}</label>
              <input
                type="number" step="0.01" min="0"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500"
                placeholder="0.00 (optional)"
                value={form.cost_basis}
                onChange={e => setForm(f => ({ ...f, cost_basis: e.target.value }))}
              />
            </div>
            <div className="flex items-center gap-3 pt-5">
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, is_liquid: !f.is_liquid }))}
                className={`relative w-9 h-5 rounded-full transition-colors ${form.is_liquid ? 'bg-indigo-600' : 'bg-zinc-700'}`}
              >
                <span className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform ${form.is_liquid ? 'translate-x-4' : 'translate-x-0'}`} />
              </button>
              <span className="text-sm text-zinc-400">Liquid asset</span>
            </div>
          </div>

          {isCrypto && (
            <div className="border-t border-zinc-800 pt-4">
              <div className="flex items-center gap-3 mb-4">
                <button
                  type="button"
                  onClick={() => setHasVesting(!hasVesting)}
                  className={`relative w-9 h-5 rounded-full transition-colors ${hasVesting ? 'bg-indigo-600' : 'bg-zinc-700'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform ${hasVesting ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
                <span className="text-sm text-zinc-400">Has vesting schedule</span>
              </div>
              {hasVesting && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-zinc-400 mb-1.5 block">Total Tokens</label>
                    <input
                      type="number" step="any" min="0"
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500"
                      placeholder="0"
                      value={vesting.total_tokens}
                      onChange={e => setVesting(v => ({ ...v, total_tokens: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-400 mb-1.5 block">Amount per vest</label>
                    <input
                      type="number" step="any" min="0"
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500"
                      placeholder="0"
                      value={vesting.vest_amount}
                      onChange={e => setVesting(v => ({ ...v, vest_amount: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-400 mb-1.5 block">Frequency</label>
                    <select
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                      value={vesting.vest_frequency}
                      onChange={e => setVesting(v => ({ ...v, vest_frequency: e.target.value }))}
                    >
                      <option value="second">Every Second</option>
                      <option value="minute">Every Minute</option>
                      <option value="hour">Every Hour</option>
                      <option value="day">Daily</option>
                      <option value="week">Weekly</option>
                      <option value="month">Monthly</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-zinc-400 mb-1.5 block">Start Date</label>
                    <input
                      type="date"
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                      value={vesting.vest_start_date}
                      onChange={e => setVesting(v => ({ ...v, vest_start_date: e.target.value }))}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2 border-t border-zinc-800">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Adding...' : 'Add Asset'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
