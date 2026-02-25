import { CryptoPrice } from '@/types'

const BASE_URL = 'https://api.coingecko.com/api/v3'
const API_KEY = process.env.COINGECKO_API_KEY

async function fetchCG(path: string) {
  const headers: Record<string, string> = { 'accept': 'application/json' }
  if (API_KEY) headers['x-cg-demo-api-key'] = API_KEY
  const res = await fetch(`${BASE_URL}${path}`, { headers, next: { revalidate: 60 } })
  if (!res.ok) throw new Error(`CoinGecko error: ${res.status}`)
  return res.json()
}

export async function getCryptoPrices(symbols: string[]): Promise<CryptoPrice[]> {
  if (!symbols.length) return []
  const ids = symbols.join(',').toLowerCase()
  const data = await fetchCG(`/simple/price?ids=${ids}&vs_currencies=aud&include_24hr_change=true&include_market_cap=true`)
  return symbols.map(symbol => ({
    symbol: symbol.toUpperCase(),
    price: data[symbol.toLowerCase()]?.aud ?? 0,
    change24h: data[symbol.toLowerCase()]?.aud_24h_change ?? 0,
    marketCap: data[symbol.toLowerCase()]?.aud_market_cap,
  }))
}

export async function searchCoinGecko(query: string) {
  const data = await fetchCG(`/search?query=${encodeURIComponent(query)}`)
  return data.coins?.slice(0, 10) ?? []
}

export async function getCoinHistory(coinId: string, days: number = 90) {
  const data = await fetchCG(`/coins/${coinId}/market_chart?vs_currency=aud&days=${days}`)
  return data.prices as [number, number][]
}
