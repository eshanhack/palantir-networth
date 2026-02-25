'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatPercent, getChangeBg } from '@/lib/utils'
import { Asset } from '@/types'
import { EditAssetModal } from './EditAssetModal'
import { TrendingUp, TrendingDown, Pencil } from 'lucide-react'

const typeLabels: Record<string, string> = {
  cash: 'Cash', property: 'Property', stock: 'Stock', etf: 'ETF', crypto: 'Crypto', other: 'Other'
}

const typeBadgeVariant: Record<string, 'default' | 'success' | 'info' | 'warning'> = {
  cash: 'success', property: 'info', stock: 'info', etf: 'info', crypto: 'warning', other: 'default'
}

export function AssetsTable({ assets }: { assets: Asset[] }) {
  const [editing, setEditing] = useState<Asset | null>(null)

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-800">
              <th className="text-left px-5 py-3 text-xs font-medium text-zinc-500 uppercase">Asset</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-zinc-500 uppercase">Type</th>
              <th className="text-right px-5 py-3 text-xs font-medium text-zinc-500 uppercase">Quantity</th>
              <th className="text-right px-5 py-3 text-xs font-medium text-zinc-500 uppercase">Value</th>
              <th className="text-right px-5 py-3 text-xs font-medium text-zinc-500 uppercase">Cost Basis</th>
              <th className="text-right px-5 py-3 text-xs font-medium text-zinc-500 uppercase">Gain/Loss</th>
              <th className="text-center px-5 py-3 text-xs font-medium text-zinc-500 uppercase">Liquid</th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {assets.map(asset => {
              const value = Number(asset.value)
              const cost = Number(asset.cost_basis ?? value)
              const gain = value - cost
              const gainPct = cost > 0 ? (gain / cost) * 100 : 0
              return (
                <tr
                  key={asset.id}
                  onClick={() => setEditing(asset)}
                  className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors cursor-pointer group"
                >
                  <td className="px-5 py-3">
                    <div>
                      <p className="text-sm font-medium text-white">{asset.name}</p>
                      {asset.symbol && <p className="text-xs text-zinc-500 font-mono">{asset.symbol}</p>}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <Badge variant={typeBadgeVariant[asset.type] ?? 'default'}>{typeLabels[asset.type] ?? asset.type}</Badge>
                  </td>
                  <td className="px-5 py-3 text-right text-sm text-zinc-400 font-mono">
                    {asset.quantity ? Number(asset.quantity).toLocaleString(undefined, { maximumFractionDigits: 6 }) : '—'}
                  </td>
                  <td className="px-5 py-3 text-right text-sm font-semibold text-white">{formatCurrency(value)}</td>
                  <td className="px-5 py-3 text-right text-sm text-zinc-400">
                    {asset.cost_basis ? formatCurrency(Number(asset.cost_basis)) : '—'}
                  </td>
                  <td className="px-5 py-3 text-right">
                    {asset.cost_basis ? (
                      <div className={`text-sm font-medium ${getChangeBg(gain)} inline-flex items-center gap-1 px-2 py-0.5 rounded`}>
                        {gain >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {formatPercent(gainPct)}
                      </div>
                    ) : '—'}
                  </td>
                  <td className="px-5 py-3 text-center">
                    <div className={`h-2 w-2 rounded-full mx-auto ${asset.is_liquid ? 'bg-emerald-400' : 'bg-zinc-600'}`} />
                  </td>
                  <td className="px-3 py-3 text-center">
                    <Pencil className="h-3.5 w-3.5 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                  </td>
                </tr>
              )
            })}
            {assets.length === 0 && (
              <tr>
                <td colSpan={8} className="px-5 py-8 text-center text-zinc-500 text-sm">
                  No assets yet. Add your first asset to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <EditAssetModal asset={editing} onClose={() => setEditing(null)} />
    </>
  )
}
