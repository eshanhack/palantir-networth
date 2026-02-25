import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate, daysUntil, calcVestedTokens } from '@/lib/utils'
import { getCryptoPrices } from '@/lib/coingecko'
import { next16thOfMonth } from '@/lib/utils'
import { format } from 'date-fns'

export const dynamic = 'force-dynamic'

export default async function VestingPage() {
  const { data: schedules } = await supabase.from('token_vesting_schedules').select('*').order('next_vest_date')
  const all = schedules ?? []

  // Fetch live prices for all tokens
  const ids = [...new Set(all.map(s => s.coingecko_id).filter(Boolean))] as string[]
  const prices = ids.length ? await getCryptoPrices(ids) : []

  const withPrices = all.map(s => {
    const price = prices.find(p => p.symbol.toLowerCase() === s.coingecko_id?.toLowerCase())
    const tokenPrice = price?.price ?? Number(s.token_price ?? 0)
    const vestedNow = calcVestedTokens(s)
    const remaining = Math.max(Number(s.total_tokens) - vestedNow, 0)
    const vestValue = Number(s.vest_amount) * tokenPrice
    const remainingValue = remaining * tokenPrice
    const pctVested = Number(s.total_tokens) > 0 ? (vestedNow / Number(s.total_tokens)) * 100 : 0
    return { ...s, tokenPrice, vestValue, remainingValue, remaining, pctVested, vestedNow, change24h: price?.change24h ?? 0 }
  })

  const totalRemainingValue = withPrices.reduce((s, w) => s + w.remainingValue, 0)
  const nextVestValue = withPrices.reduce((s, w) => s + w.vestValue, 0)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Token Vesting</h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            Total remaining value: {formatCurrency(totalRemainingValue)} · Next vest: {format(next16thOfMonth(), 'd MMM')} ({formatCurrency(nextVestValue)})
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {withPrices.map(schedule => {
          const days = daysUntil(schedule.next_vest_date)
          return (
            <Card key={schedule.id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-base font-semibold text-white">{schedule.token_name}</h3>
                    <p className="text-xs text-zinc-500 font-mono mt-0.5">{schedule.token_symbol}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-white">{formatCurrency(schedule.tokenPrice)}</p>
                    <p className={`text-xs ${schedule.change24h >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {schedule.change24h >= 0 ? '+' : ''}{schedule.change24h.toFixed(2)}% 24h
                    </p>
                  </div>
                </div>

                {/* Vesting progress */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-zinc-500 mb-1.5">
                    <span>{schedule.vestedNow.toLocaleString()} vested</span>
                    <span>{Number(schedule.total_tokens).toLocaleString()} total</span>
                  </div>
                  <div className="w-full bg-zinc-800 rounded-full h-2">
                    <div className="bg-amber-400 h-2 rounded-full transition-all" style={{ width: `${schedule.pctVested}%` }} />
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">{schedule.pctVested.toFixed(1)}% vested</p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-zinc-800/50 rounded-lg p-3">
                    <p className="text-xs text-zinc-500 mb-1">Per Vest</p>
                    <p className="text-sm font-semibold text-white">{Number(schedule.vest_amount).toLocaleString()}</p>
                    <p className="text-xs text-zinc-500">{formatCurrency(schedule.vestValue)}</p>
                  </div>
                  <div className="bg-zinc-800/50 rounded-lg p-3">
                    <p className="text-xs text-zinc-500 mb-1">Remaining</p>
                    <p className="text-sm font-semibold text-white">{schedule.remaining.toLocaleString()}</p>
                    <p className="text-xs text-zinc-500">{formatCurrency(schedule.remainingValue)}</p>
                  </div>
                  <div className="bg-zinc-800/50 rounded-lg p-3">
                    <p className="text-xs text-zinc-500 mb-1">Next Vest</p>
                    <Badge variant={days <= 3 ? 'warning' : 'info'} className="mb-1">
                      {days === 0 ? 'Today' : `${days}d`}
                    </Badge>
                    <p className="text-xs text-zinc-500 capitalize">{schedule.vest_frequency}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
        {all.length === 0 && (
          <div className="col-span-2">
            <Card>
              <CardContent className="p-8 text-center text-zinc-500 text-sm">
                No vesting schedules. Add a crypto asset with a vesting schedule to get started.
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
