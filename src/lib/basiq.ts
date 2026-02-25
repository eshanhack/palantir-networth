const BASIQ_API_URL = 'https://au-api.basiq.io'
const API_KEY = process.env.BASIQ_API_KEY!

let tokenCache: { token: string; expires: number } | null = null

export async function getBasiqToken(): Promise<string> {
  if (tokenCache && Date.now() < tokenCache.expires) {
    return tokenCache.token
  }
  const res = await fetch(`${BASIQ_API_URL}/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${Buffer.from(`${API_KEY}:`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'basiq-version': '3.0',
    },
    body: 'scope=SERVER_ACCESS',
  })
  if (!res.ok) throw new Error(`Basiq auth failed: ${res.status}`)
  const data = await res.json()
  tokenCache = { token: data.access_token, expires: Date.now() + (data.expires_in - 60) * 1000 }
  return data.access_token
}

async function basiqFetch(path: string, options: RequestInit = {}) {
  const token = await getBasiqToken()
  const res = await fetch(`${BASIQ_API_URL}${path}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'basiq-version': '3.0',
      ...(options.headers ?? {}),
    },
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Basiq error ${res.status}: ${err}`)
  }
  return res.json()
}

export async function createBasiqUser(email: string, mobile?: string) {
  return basiqFetch('/users', {
    method: 'POST',
    body: JSON.stringify({ email, mobile }),
  })
}

export async function createAuthLink(userId: string): Promise<string> {
  const data = await basiqFetch(`/users/${userId}/auth_link`, { method: 'POST' })
  return data.links?.public ?? ''
}

export async function getAccounts(userId: string) {
  const data = await basiqFetch(`/users/${userId}/accounts`)
  return data.data ?? []
}

export async function getTransactions(userId: string, params: {
  from?: string
  to?: string
  limit?: number
  next?: string
} = {}) {
  const qs = new URLSearchParams()
  if (params.from) qs.set('filter', `transaction.postDate.gt('${params.from}')`)
  if (params.limit) qs.set('limit', String(params.limit))
  if (params.next) return basiqFetch(params.next)
  const path = `/users/${userId}/transactions${qs.toString() ? '?' + qs.toString() : ''}`
  const data = await basiqFetch(path)
  return { transactions: data.data ?? [], next: data.links?.next }
}

export async function refreshConnections(userId: string) {
  return basiqFetch(`/users/${userId}/connections/refresh`, { method: 'POST' })
}

export function normalizeBasiqTransaction(tx: Record<string, unknown>) {
  return {
    basiq_id: tx.id as string,
    amount: Math.abs(Number(tx.amount)),
    type: Number(tx.amount) > 0 ? 'income' : 'expense',
    description: (tx.description as string) ?? '',
    merchant: (tx.merchant as Record<string, unknown>)?.tradingName as string | undefined,
    date: tx.postDate as string,
    category: (tx.subClass as Record<string, unknown>)?.title as string ?? 'Uncategorised',
    account_id: tx.account as string,
  }
}
