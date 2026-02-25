import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatPercent, getChangeBg } from '@/lib/utils'
import { Asset } from '@/types'
import { AddAssetButton } from '@/components/assets/AddAssetButton'
import { TrendingUp, TrendingDown } from 'lucide-react'

export const dynamic = 'force-dynamic'

const typeLabels: Record<string, string> = {
  cash: 'Cash', property: 'Property', stock: 'Stock', etf: 'ETF', crypto: 'Crypto', other: 'Other'
}

const typeBadgeVariant: Record<string, 'default' | 'success' | 'info' | 'warning'> = {
  cash: 'success', property: 'info', stock: 'info', etf: 'info', crypto: 'warning', other: 'default'
}

export default async function AssetsPage() {
  const { data: assets } = await supabase.from('assets').select('*').order('value', { ascending: false })
  const { data: vestingSchedules } = await supabase.from('token_vesting_schedules').select('*')

  const allAssets: Asset[] = assets ?? []
  const totalAssets = allAssets.reduce((s, a) => s + Number(a.value), 0)
  const liquidAssets = allAssets.filter(a => a.is_liquid).reduce((s, a) => s + Number(a.value), 0)

  const byType = allAssets.reduce((acc, a) => {
    acc[a.type] = (acc[a.type] ?? 0) + Number(a.value)
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Assets</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Total: {formatCurrency(totalAssets)} · Liquid: {formatCurrency(liquidAssets)}</p>
        </div>
        <AddAssetButton />
      </div>

      {/* Type summary cards */}
      <div className="grid grid-cols-3 xl:grid-cols-6 gap-3">
        {Object.entries(byType).map(([type, value]) => (
          <Card key={type} className="p-4">
            <p className="text-xs text-zinc-500 capitalize mb-1">{typeLabels[type] ?? type}</p>
            <p className="text-lg font-bold text-white">{formatCurrency(value, 'AUD', true)}</p>
            <p className="text-xs text-zinc-500 mt-1">{((value / totalAssets) * 100).toFixed(1)}%</p>
          </Card>
        ))}
      </div>

      {/* Assets table */}
      <Card>
        <CardHeader>
          <CardTitle>All Assets</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
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
                </tr>
              </thead>
              <tbody>
                {allAssets.map(asset => {
                  const value = Number(asset.value)
                  const cost = Number(asset.cost_basis ?? value)
                  const gain = value - cost
                  const gainPct = cost > 0 ? (gain / cost) * 100 : 0
                  return (
                    <tr key={asset.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/20 transition-colors">
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
                    </tr>
                  )
                })}
                {allAssets.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-zinc-500 text-sm">
                      No assets yet. Add your first asset to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Vesting schedules */}
      {vestingSchedules && vestingSchedules.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Token Vesting Schedules</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="text-left px-5 py-3 text-xs font-medium text-zinc-500 uppercase">Token</th>
                    <th className="text-right px-5 py-3 text-xs font-medium text-zinc-500 uppercase">Total</th>
                    <th className="text-right px-5 py-3 text-xs font-medium text-zinc-500 uppercase">Vested</th>
                    <th className="text-right px-5 py-3 text-xs font-medium text-zinc-500 uppercase">Remaining</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-zinc-500 uppercase">Frequency</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-zinc-500 uppercase">Next Vest</th>
                  </tr>
                </thead>
                <tbody>
                  {vestingSchedules.map(vs => (
                    <tr key={vs.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/20">
                      <td className="px-5 py-3">
                        <p className="text-sm font-medium text-white">{vs.token_name}</p>
                        <p className="text-xs text-zinc-500 font-mono">{vs.token_symbol}</p>
                      </td>
                      <td className="px-5 py-3 text-right text-sm text-zinc-400 font-mono">{Number(vs.total_tokens).toLocaleString()}</td>
                      <td className="px-5 py-3 text-right text-sm text-emerald-400 font-mono">{Number(vs.vested_tokens).toLocaleString()}</td>
                      <td className="px-5 py-3 text-right text-sm text-white font-mono">
                        {(Number(vs.total_tokens) - Number(vs.vested_tokens)).toLocaleString()}
                      </td>
                      <td className="px-5 py-3">
                        <Badge variant="info">{Number(vs.vest_amount).toLocaleString()} / {vs.vest_frequency}</Badge>
                      </td>
                      <td className="px-5 py-3 text-sm text-zinc-400">{vs.next_vest_date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
