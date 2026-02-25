import { NextResponse } from 'next/server'

const CG_KEY = process.env.COINGECKO_API_KEY

async function cgHeaders() {
  const h: Record<string, string> = { accept: 'application/json' }
  if (CG_KEY) h['x-cg-demo-api-key'] = CG_KEY
  return h
}

async function getUsdToAud(): Promise<number> {
  try {
    const res = await fetch(
      'https://query1.finance.yahoo.com/v8/finance/chart/USDAUD=X?interval=1d&range=1d',
      { headers: { 'User-Agent': 'Mozilla/5.0' }, next: { revalidate: 300 } }
    )
    if (!res.ok) return 1.58
    const data = await res.json()
    return data.chart?.result?.[0]?.meta?.regularMarketPrice ?? 1.58
  } catch {
    return 1.58
  }
}

async function fetchYahooPrice(ticker: string): Promise<{ price: number; currency: string } | null> {
  const res = await fetch(
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=1d`,
    { headers: { 'User-Agent': 'Mozilla/5.0' }, next: { revalidate: 60 } }
  )
  if (!res.ok) return null
  const data = await res.json()
  const meta = data.chart?.result?.[0]?.meta
  if (!meta?.regularMarketPrice) return null
  return { price: meta.regularMarketPrice, currency: meta.currency ?? 'USD' }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const symbol = searchParams.get('symbol')?.trim()
  const type = searchParams.get('type')
  const coingeckoId = searchParams.get('coingecko_id')?.trim()

  if (!symbol) return NextResponse.json({ error: 'symbol required' }, { status: 400 })

  try {
    // ── Crypto ─────────────────────────────────────────────────────────────
    if (type === 'crypto') {
      let coinId = coingeckoId || null

      // Search by symbol if no coingecko_id provided
      if (!coinId) {
        const searchRes = await fetch(
          `https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(symbol)}`,
          { headers: await cgHeaders(), next: { revalidate: 3600 } }
        )
        if (searchRes.ok) {
          const searchData = await searchRes.json()
          const coins: { id: string; symbol: string }[] = searchData.coins ?? []
          // Prefer exact symbol match
          const exact = coins.find(c => c.symbol?.toLowerCase() === symbol.toLowerCase())
          coinId = exact?.id ?? coins[0]?.id ?? null
        }
      }

      if (!coinId) return NextResponse.json({ error: 'Coin not found' }, { status: 404 })

      const priceRes = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=aud`,
        { headers: await cgHeaders(), next: { revalidate: 60 } }
      )
      if (!priceRes.ok) return NextResponse.json({ error: 'Price fetch failed' }, { status: 502 })

      const priceData = await priceRes.json()
      const price: number | undefined = priceData[coinId]?.aud
      if (!price) return NextResponse.json({ error: 'Price not found' }, { status: 404 })

      return NextResponse.json({ price, coinId, currency: 'AUD' })
    }

    // ── Stock / ETF ────────────────────────────────────────────────────────
    if (type === 'stock' || type === 'etf') {
      // Try ticker as-is, then with .AX suffix for ASX stocks
      let result = await fetchYahooPrice(symbol)
      if (!result) result = await fetchYahooPrice(`${symbol}.AX`)
      if (!result) return NextResponse.json({ error: 'Ticker not found' }, { status: 404 })

      // Already AUD (e.g. ASX stocks come back as AUD)
      if (result.currency === 'AUD') {
        return NextResponse.json({ price: result.price, currency: 'AUD' })
      }

      // Convert to AUD
      const rate = await getUsdToAud()
      return NextResponse.json({
        price: parseFloat((result.price * rate).toFixed(4)),
        currency: 'AUD',
        rawPrice: result.price,
        rawCurrency: result.currency,
      })
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  } catch (err) {
    console.error('price-lookup error:', err)
    return NextResponse.json({ error: 'Failed to fetch price' }, { status: 500 })
  }
}
