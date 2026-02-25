'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { X, Trash2 } from 'lucide-react'
import { Asset, AssetType } from '@/types'

interface EditAssetModalProps {
  asset: Asset | null
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

export function EditAssetModal({ asset, onClose }: EditAssetModalProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [fetchingPrice, setFetchingPrice] = useState(false)

  const [form, setForm] = useState({
    name: asset?.name ?? '',
    type: (asset?.type ?? 'cash') as AssetType,
    value: asset?.value?.toString() ?? '',
    cost_basis: asset?.cost_basis?.toString() ?? '',
    quantity: asset?.quantity?.toString() ?? '',
    symbol: asset?.symbol ?? '',
    coingecko_id: asset?.coingecko_id ?? '',
    is_liquid: asset?.is_liquid ?? true,
    notes: asset?.notes ?? '',
  })

  const fetchPrice = async (symbol: string, cgId?: string) => {
    const type = form.type
    if (!symbol || (type !== 'crypto' && type !== 'stock' && type !== 'etf')) return
    setFetchingPrice(true)
    try {
      const params = new URLSearchParams({ symbol, type })
      if (cgId) params.set('coingecko_id', cgId)
      const res = await fetch(`/api/price-lookup?${params}`)
      if (!res.ok) return
      const data = await res.json()
      if (data.price) {
        setForm(f => ({
          ...f,
          value: data.price.toString(),
          ...(data.coinId ? { coingecko_id: data.coinId } : {}),
        }))
      }
    } catch {
      // silent
    } finally {
      setFetchingPrice(false)
    }
  }

  if (!asset) return null

  const isCrypto = form.type === 'crypto'
  const isStock = form.type === 'stock' || form.type === 'etf'
  const hasQuantity = isCrypto || isStock
  const valueLabel = hasQuantity ? 'Price per Unit (AUD)' : 'Current Value (AUD)'

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await supabase.from('assets').update({
        name: form.name,
        type: form.type,
        value: parseFloat(form.value) || 0,
        cost_basis: form.cost_basis ? parseFloat(form.cost_basis) : null,
        quantity: form.quantity ? parseFloat(form.quantity) : null,
        symbol: form.symbol || null,
        coingecko_id: form.coingecko_id || null,
        is_liquid: form.is_liquid,
        notes: form.notes || null,
        updated_at: new Date().toISOString(),
      }).eq('id', asset.id)
      router.refresh()
      onClose()
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return }
    setDeleting(true)
    try {
      await supabase.from('assets').delete().eq('id', asset.id)
      router.refresh()
      onClose()
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-zinc-800">
          <h2 className="text-lg font-semibold text-white">Edit Asset</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSave} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-xs text-zinc-400 mb-1.5 block">Asset Name</label>
              <input
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500"
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
              <label className="text-xs text-zinc-400 mb-1.5 flex items-center gap-1.5">
                {valueLabel}
                {fetchingPrice && <span className="text-indigo-400 text-xs">Fetching...</span>}
              </label>
              <input
                type="number" step="any" min="0"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                value={form.value}
                onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
                disabled={fetchingPrice}
                required
              />
            </div>
            {(isCrypto || isStock) && (
              <>
                <div>
                  <label className="text-xs text-zinc-400 mb-1.5 block">Symbol / Ticker</label>
                  <input
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white font-mono placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500"
                    value={form.symbol}
                    onChange={e => setForm(f => ({ ...f, symbol: e.target.value }))}
                    onBlur={e => fetchPrice(e.target.value, form.coingecko_id)}
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 mb-1.5 block">Quantity</label>
                  <input
                    type="number" step="any" min="0"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500"
                    value={form.quantity}
                    onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
                  />
                </div>
                {isCrypto && (
                  <div className="col-span-2">
                    <label className="text-xs text-zinc-400 mb-1.5 block">CoinGecko ID</label>
                    <input
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white font-mono placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500"
                      placeholder="e.g. bitcoin, ethereum"
                      value={form.coingecko_id}
                      onChange={e => setForm(f => ({ ...f, coingecko_id: e.target.value }))}
                      onBlur={e => fetchPrice(form.symbol, e.target.value)}
                    />
                  </div>
                )}
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
            <div className="col-span-2">
              <label className="text-xs text-zinc-400 mb-1.5 block">Notes</label>
              <textarea
                rows={2}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500 resize-none"
                placeholder="Optional notes"
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg transition-colors ${
                confirmDelete
                  ? 'bg-red-600 text-white hover:bg-red-500'
                  : 'text-red-400 hover:text-red-300 hover:bg-red-400/10'
              }`}
            >
              <Trash2 className="h-3.5 w-3.5" />
              {deleting ? 'Deleting...' : confirmDelete ? 'Confirm delete' : 'Delete'}
            </button>
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save'}</Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
