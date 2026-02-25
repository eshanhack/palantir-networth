'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { X, Trash2 } from 'lucide-react'
import { Asset, AssetType } from '@/types'
import { calcVestedTokens, formatCurrency } from '@/lib/utils'

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
  const [tab, setTab] = useState<'details' | 'vesting'>('details')
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [fetchingPrice, setFetchingPrice] = useState(false)
  const [saveError, setSaveError] = useState('')

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

  // Vesting
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [existingVesting, setExistingVesting] = useState<any>(null)
  const [hasVesting, setHasVesting] = useState(false)
  const [vestingForm, setVestingForm] = useState({
    vest_amount: '',
    vest_frequency: 'month',
    vest_start_date: '',
  })

  useEffect(() => {
    if (!asset || asset.type !== 'crypto') return
    supabase
      .from('token_vesting_schedules')
      .select('*')
      .eq('asset_id', asset.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setExistingVesting(data)
          setHasVesting(true)
          setTab('vesting')
          setVestingForm({
            vest_amount: data.vest_amount ? Number(data.vest_amount).toString() : '',
            vest_frequency: data.vest_frequency ?? 'month',
            vest_start_date: data.vest_start_date ? (data.vest_start_date as string).slice(0, 10) : '',
          })
        }
      })
  }, [asset?.id])

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

  // Live vesting stats for display
  const vestedNow = hasVesting && existingVesting ? calcVestedTokens({
    vest_start_date: vestingForm.vest_start_date || existingVesting.vest_start_date,
    vest_amount: vestingForm.vest_amount || existingVesting.vest_amount,
    vest_frequency: vestingForm.vest_frequency,
    total_tokens: form.quantity || existingVesting.total_tokens,
  }) : 0
  const totalTok = parseFloat(form.quantity) || 0
  const remainingTok = Math.max(totalTok - vestedNow, 0)
  const price = parseFloat(form.value) || 0

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setSaveError('')
    try {
      const { error: assetError } = await supabase.from('assets').update({
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
      if (assetError) throw assetError

      if (isCrypto) {
        if (hasVesting && vestingForm.vest_start_date) {
          const totalTokens = parseFloat(form.quantity) || 0
          const start = new Date(vestingForm.vest_start_date)
          const now = new Date()
          let nextVest = new Date(start)
          while (nextVest <= now) {
            if (vestingForm.vest_frequency === 'month') nextVest.setMonth(nextVest.getMonth() + 1)
            else if (vestingForm.vest_frequency === 'week') nextVest.setDate(nextVest.getDate() + 7)
            else nextVest.setDate(nextVest.getDate() + 1)
          }

          const vestingData = {
            asset_id: asset.id,
            token_symbol: form.symbol,
            token_name: form.name,
            coingecko_id: form.coingecko_id || null,
            total_tokens: totalTokens,
            vested_tokens: 0,
            vest_frequency: vestingForm.vest_frequency,
            vest_amount: parseFloat(vestingForm.vest_amount) || 0,
            vest_start_date: vestingForm.vest_start_date,
            next_vest_date: nextVest.toISOString(),
          }

          const { error: vestError } = existingVesting
            ? await supabase.from('token_vesting_schedules').update(vestingData).eq('id', existingVesting.id)
            : await supabase.from('token_vesting_schedules').insert(vestingData)
          if (vestError) throw vestError
        } else if (!hasVesting && existingVesting) {
          await supabase.from('token_vesting_schedules').delete().eq('id', existingVesting.id)
        }
      }

      router.refresh()
      onClose()
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Save failed')
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

  const inputCls = 'w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-zinc-800">
          <h2 className="text-lg font-semibold text-white">{form.name || 'Edit Asset'}</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs (only show Vesting tab for crypto) */}
        {isCrypto && (
          <div className="flex border-b border-zinc-800">
            <button
              type="button"
              onClick={() => setTab('details')}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${tab === 'details' ? 'text-white border-b-2 border-indigo-500' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              Details
            </button>
            <button
              type="button"
              onClick={() => setTab('vesting')}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${tab === 'vesting' ? 'text-white border-b-2 border-indigo-500' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              Vesting {hasVesting && <span className="ml-1 text-xs text-indigo-400">●</span>}
            </button>
          </div>
        )}

        <form onSubmit={handleSave} className="p-5 space-y-4">

          {/* ── DETAILS TAB ─────────────────────────────── */}
          {tab === 'details' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-xs text-zinc-400 mb-1.5 block">Asset Name</label>
                <input className={inputCls} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1.5 block">Type</label>
                <select
                  className={inputCls}
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
                  className={`${inputCls} disabled:opacity-50`}
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
                      className={`${inputCls} font-mono`}
                      value={form.symbol}
                      onChange={e => setForm(f => ({ ...f, symbol: e.target.value }))}
                      onBlur={e => fetchPrice(e.target.value, form.coingecko_id)}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-400 mb-1.5 block">Quantity</label>
                    <input
                      type="number" step="any" min="0"
                      className={inputCls}
                      value={form.quantity}
                      onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
                    />
                  </div>
                  {isCrypto && (
                    <div className="col-span-2">
                      <label className="text-xs text-zinc-400 mb-1.5 block">CoinGecko ID</label>
                      <input
                        className={`${inputCls} font-mono`}
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
                  className={inputCls}
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
                  className={`${inputCls} resize-none`}
                  placeholder="Optional notes"
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                />
              </div>
            </div>
          )}

          {/* ── VESTING TAB ─────────────────────────────── */}
          {tab === 'vesting' && isCrypto && (
            <div className="space-y-4">
              {/* Toggle */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setHasVesting(v => !v)}
                  className={`relative w-9 h-5 rounded-full transition-colors ${hasVesting ? 'bg-indigo-600' : 'bg-zinc-700'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform ${hasVesting ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
                <span className="text-sm text-zinc-300">Has vesting schedule</span>
              </div>

              {hasVesting && (
                <>
                  {/* Live stats */}
                  {totalTok > 0 && (
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-zinc-800 rounded-lg p-3 text-center">
                        <p className="text-xs text-zinc-500 mb-0.5">Vested</p>
                        <p className="text-sm font-semibold text-emerald-400">{vestedNow.toLocaleString()}</p>
                        <p className="text-xs text-zinc-600">{formatCurrency(vestedNow * price, 'AUD', true)}</p>
                      </div>
                      <div className="bg-zinc-800 rounded-lg p-3 text-center">
                        <p className="text-xs text-zinc-500 mb-0.5">Unvested</p>
                        <p className="text-sm font-semibold text-white">{remainingTok.toLocaleString()}</p>
                        <p className="text-xs text-zinc-600">{formatCurrency(remainingTok * price, 'AUD', true)}</p>
                      </div>
                      <div className="bg-zinc-800 rounded-lg p-3 text-center">
                        <p className="text-xs text-zinc-500 mb-0.5">Total</p>
                        <p className="text-sm font-semibold text-white">{totalTok.toLocaleString()}</p>
                        <p className="text-xs text-zinc-600">{formatCurrency(totalTok * price, 'AUD', true)}</p>
                      </div>
                    </div>
                  )}

                  {/* Schedule fields */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-zinc-400 mb-1.5 block">Tokens per vest</label>
                      <input
                        type="number" step="any" min="0"
                        className={inputCls}
                        placeholder="e.g. 500000"
                        value={vestingForm.vest_amount}
                        onChange={e => setVestingForm(v => ({ ...v, vest_amount: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-zinc-400 mb-1.5 block">Frequency</label>
                      <select
                        className={inputCls}
                        value={vestingForm.vest_frequency}
                        onChange={e => setVestingForm(v => ({ ...v, vest_frequency: e.target.value }))}
                      >
                        <option value="day">Daily</option>
                        <option value="week">Weekly</option>
                        <option value="month">Monthly</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs text-zinc-400 mb-1.5 block">Vest start date</label>
                      <input
                        type="date"
                        className={inputCls}
                        value={vestingForm.vest_start_date}
                        onChange={e => setVestingForm(v => ({ ...v, vest_start_date: e.target.value }))}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {saveError && <p className="text-xs text-red-400">{saveError}</p>}

          <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg transition-colors ${
                confirmDelete ? 'bg-red-600 text-white hover:bg-red-500' : 'text-red-400 hover:text-red-300 hover:bg-red-400/10'
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
