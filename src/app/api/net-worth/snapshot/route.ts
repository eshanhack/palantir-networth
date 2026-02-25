import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { getAssetValue, calcVestedTokens } from '@/lib/utils'
import { format } from 'date-fns'

export async function POST() {
  try {
    const supabase = createServiceClient()
    const [assetsRes, liabilitiesRes, vestingRes] = await Promise.all([
      supabase.from('assets').select('id, value, quantity, is_liquid'),
      supabase.from('liabilities').select('balance'),
      supabase.from('token_vesting_schedules').select('asset_id, vest_start_date, vest_amount, vest_frequency, total_tokens'),
    ])

    const vestingByAsset = new Map((vestingRes.data ?? []).map(v => [v.asset_id, v]))

    const totalAssets = (assetsRes.data ?? []).reduce((s, a) => s + getAssetValue(a), 0)
    const liquidAssets = (assetsRes.data ?? []).reduce((s, a) => {
      const vesting = vestingByAsset.get(a.id)
      if (vesting) {
        const vestedTokens = calcVestedTokens(vesting)
        return s + vestedTokens * Number(a.value)
      }
      return a.is_liquid ? s + getAssetValue(a) : s
    }, 0)
    const totalLiabilities = (liabilitiesRes.data ?? []).reduce((s, l) => s + Number(l.balance), 0)

    const snapshot = {
      date: format(new Date(), 'yyyy-MM-dd'),
      total_assets: totalAssets,
      liquid_assets: liquidAssets,
      total_liabilities: totalLiabilities,
      net_worth: totalAssets - totalLiabilities,
      liquid_net_worth: liquidAssets - totalLiabilities,
    }

    await supabase.from('net_worth_snapshots').upsert(snapshot, { onConflict: 'date' })
    return NextResponse.json(snapshot)
  } catch (error) {
    console.error('Snapshot error:', error)
    return NextResponse.json({ error: 'Failed to create snapshot' }, { status: 500 })
  }
}
