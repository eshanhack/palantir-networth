import { NextResponse } from 'next/server'
import { getTransactions, normalizeBasiqTransaction } from '@/lib/basiq'
import { createServiceClient } from '@/lib/supabase'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

async function categorizeTransactions(transactions: { description: string; merchant?: string; amount: number }[]) {
  if (!transactions.length) return []
  const prompt = `Categorize these Australian bank transactions into spending categories.
Categories to use: Groceries, Dining Out, Uber Eats, Transport, Petrol, Shopping, Health, Entertainment, Utilities, Rent, Insurance, Subscriptions, Travel, Education, Personal Care, Alcohol, Takeaway, Salary, Dividend, Investment, Transfer, Refund, Other.

Transactions (JSON array):
${JSON.stringify(transactions.map((t, i) => ({ i, desc: t.description, merchant: t.merchant, amount: t.amount })))}

Return a JSON array of objects: [{"i": 0, "category": "Groceries"}, ...]
Only return the JSON array, nothing else.`

  try {
    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    })
    const text = msg.content[0].type === 'text' ? msg.content[0].text : '[]'
    const results = JSON.parse(text.trim())
    return results as { i: number; category: string }[]
  } catch {
    return []
  }
}

export async function POST() {
  try {
    const supabase = createServiceClient()
    const { data: connection } = await supabase.from('bank_connections').select('basiq_user_id').limit(1).single()

    if (!connection?.basiq_user_id) {
      return NextResponse.json({ error: 'No bank connected' }, { status: 400 })
    }

    // Fetch last 90 days
    const fromDate = new Date()
    fromDate.setDate(fromDate.getDate() - 90)
    const { transactions: rawTxs } = await getTransactions(connection.basiq_user_id, {
      from: fromDate.toISOString().split('T')[0],
      limit: 500,
    })

    if (!rawTxs.length) return NextResponse.json({ synced: 0 })

    const normalized = rawTxs.map(normalizeBasiqTransaction)

    // AI categorization in batches of 50
    const batchSize = 50
    const allCategories: { i: number; category: string }[] = []
    for (let i = 0; i < normalized.length; i += batchSize) {
      const batch = normalized.slice(i, i + batchSize).map((t: ReturnType<typeof normalizeBasiqTransaction>, j: number) => ({ ...t, batchIndex: j }))
      const cats = await categorizeTransactions(batch)
      allCategories.push(...cats.map(c => ({ ...c, i: c.i + i })))
    }

    const categorized = normalized.map((tx: ReturnType<typeof normalizeBasiqTransaction>, i: number) => ({
      ...tx,
      category: allCategories.find(c => c.i === i)?.category ?? tx.category,
      ai_categorised: true,
    }))

    // Upsert to DB
    const { count } = await supabase.from('transactions').upsert(categorized, { onConflict: 'basiq_id', ignoreDuplicates: false }).select('id')

    await supabase.from('bank_connections').update({ last_synced_at: new Date().toISOString() }).eq('basiq_user_id', connection.basiq_user_id)

    return NextResponse.json({ synced: count ?? categorized.length })
  } catch (error) {
    console.error('Basiq sync error:', error)
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 })
  }
}
