import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { getAssetValue } from '@/lib/utils'
import { format } from 'date-fns'

export async function POST() {
  try {
    const supabase = createServiceClient()
    const [assetsRes, liabilitiesRes] = await Promise.all([
      supabase.from('assets').select('value, is_liquid'),
      supabase.from('liabilities').select('balance'),
    ])

    const totalAssets = (assetsRes.data ?? []).reduce((s, a) => s + getAssetValue(a), 0)
    const liquidAssets = (assetsRes.data ?? []).filter(a => a.is_liquid).reduce((s, a) => s + getAssetValue(a), 0)
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
