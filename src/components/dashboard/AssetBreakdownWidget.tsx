import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { formatCurrency, getAssetValue } from '@/lib/utils'
import { Asset } from '@/types'

interface AssetBreakdownWidgetProps {
  assets: Asset[]
}

const typeLabels: Record<string, string> = {
  cash: 'Cash',
  property: 'Property',
  stock: 'Stocks',
  etf: 'ETFs',
  crypto: 'Crypto',
  other: 'Other',
}

const typeColors: Record<string, string> = {
  cash: 'bg-emerald-400',
  property: 'bg-blue-400',
  stock: 'bg-indigo-400',
  etf: 'bg-violet-400',
  crypto: 'bg-amber-400',
  other: 'bg-zinc-400',
}

export function AssetBreakdownWidget({ assets }: AssetBreakdownWidgetProps) {
  const total = assets.reduce((sum, a) => sum + getAssetValue(a), 0)
  const byType = assets.reduce((acc, a) => {
    acc[a.type] = (acc[a.type] ?? 0) + getAssetValue(a)
    return acc
  }, {} as Record<string, number>)

  const sorted = Object.entries(byType)
    .sort(([, a], [, b]) => b - a)
    .map(([type, value]) => ({ type, value, pct: total > 0 ? (value / total) * 100 : 0 }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Asset Allocation</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex h-3 rounded-full overflow-hidden gap-0.5 mb-4">
          {sorted.map(({ type, pct }) => (
            <div
              key={type}
              className={`${typeColors[type] ?? 'bg-zinc-400'} h-full transition-all`}
              style={{ width: `${pct}%` }}
            />
          ))}
        </div>
        <div className="space-y-2">
          {sorted.map(({ type, value, pct }) => (
            <div key={type} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${typeColors[type] ?? 'bg-zinc-400'}`} />
                <span className="text-sm text-zinc-400">{typeLabels[type] ?? type}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-zinc-500">{pct.toFixed(1)}%</span>
                <span className="text-sm font-medium text-white w-24 text-right">{formatCurrency(value)}</span>
              </div>
            </div>
          ))}
          <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
            <span className="text-sm font-medium text-zinc-300">Total</span>
            <span className="text-sm font-bold text-white">{formatCurrency(total)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
