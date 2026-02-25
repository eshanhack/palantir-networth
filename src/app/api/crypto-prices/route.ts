import { NextResponse } from 'next/server'
import { getCryptoPrices } from '@/lib/coingecko'
import { createServiceClient } from '@/lib/supabase'

export async function POST() {
  try {
    const supabase = createServiceClient()
    const { data: cryptoAssets } = await supabase
      .from('assets')
      .select('id, coingecko_id, quantity')
      .eq('type', 'crypto')
      .not('coingecko_id', 'is', null)

    if (!cryptoAssets?.length) return NextResponse.json({ updated: 0 })

    const ids = [...new Set(cryptoAssets.map(a => a.coingecko_id!))]
    const prices = await getCryptoPrices(ids)

    const updates = await Promise.all(
      cryptoAssets.map(async asset => {
        const priceData = prices.find(p => p.symbol.toLowerCase() === asset.coingecko_id?.toLowerCase())
        if (!priceData || !asset.quantity) return null
        const newValue = Number(asset.quantity) * priceData.price
        await supabase.from('assets').update({ value: newValue, updated_at: new Date().toISOString() }).eq('id', asset.id)
        return asset.id
      })
    )

    return NextResponse.json({ updated: updates.filter(Boolean).length })
  } catch (error) {
    console.error('Crypto price update error:', error)
    return NextResponse.json({ error: 'Failed to update prices' }, { status: 500 })
  }
}
