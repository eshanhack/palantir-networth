import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, getAssetValue, calcVestedTokens } from '@/lib/utils'
import { Asset } from '@/types'
import { AddAssetButton } from '@/components/assets/AddAssetButton'
import { AssetsTable } from '@/components/assets/AssetsTable'

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const vestingByAsset = new Map((vestingSchedules ?? []).map((v: any) => [v.asset_id, v]))
  const totalAssets = allAssets.reduce((s, a) => s + getAssetValue(a), 0)
  const liquidAssets = allAssets.reduce((s, a) => {
    const vesting = vestingByAsset.get(a.id)
    if (vesting) return s + calcVestedTokens(vesting) * Number(a.value)
    return a.is_liquid ? s + getAssetValue(a) : s
  }, 0)

  const byType = allAssets.reduce((acc, a) => {
    acc[a.type] = (acc[a.type] ?? 0) + getAssetValue(a)
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
          <AssetsTable assets={allAssets} />
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
                  {vestingSchedules.map(vs => {
                    const vestedNow = calcVestedTokens(vs)
                    const totalTok = Number(vs.total_tokens)
                    const remaining = Math.max(totalTok - vestedNow, 0)
                    const pct = totalTok > 0 ? (vestedNow / totalTok) * 100 : 0
                    return (
                      <tr key={vs.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/20">
                        <td className="px-5 py-3">
                          <p className="text-sm font-medium text-white">{vs.token_name}</p>
                          <p className="text-xs text-zinc-500 font-mono">{vs.token_symbol}</p>
                        </td>
                        <td className="px-5 py-3 text-right text-sm text-zinc-400 font-mono">{totalTok.toLocaleString()}</td>
                        <td className="px-5 py-3 text-right text-sm font-mono">
                          <span className="text-emerald-400">{vestedNow.toLocaleString()}</span>
                          <span className="text-zinc-600 text-xs ml-1">({pct.toFixed(1)}%)</span>
                        </td>
                        <td className="px-5 py-3 text-right text-sm text-white font-mono">{remaining.toLocaleString()}</td>
                        <td className="px-5 py-3">
                          <Badge variant="info">{Number(vs.vest_amount).toLocaleString()} / {vs.vest_frequency}</Badge>
                        </td>
                        <td className="px-5 py-3 text-sm text-zinc-400">{vs.next_vest_date?.slice(0, 10)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
