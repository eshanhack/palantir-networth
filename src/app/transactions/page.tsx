import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import { TransactionFilters } from '@/components/transactions/TransactionFilters'
import { AddTransactionButton } from '@/components/transactions/AddTransactionButton'
import { SyncBankButton } from '@/components/transactions/SyncBankButton'
import { ArrowUpRight, ArrowDownLeft } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; category?: string; type?: string }>
}) {
  const params = await searchParams
  const period = params.period ?? 'month'
  const categoryFilter = params.category
  const typeFilter = params.type

  const now = new Date()
  let fromDate: string
  switch (period) {
    case 'week':
      const wk = new Date(now); wk.setDate(now.getDate() - 7)
      fromDate = wk.toISOString().split('T')[0]; break
    case 'month':
      fromDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]; break
    case '3month':
      const m3 = new Date(now); m3.setMonth(now.getMonth() - 3)
      fromDate = m3.toISOString().split('T')[0]; break
    case 'year':
      fromDate = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0]; break
    default:
      fromDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  }

  let query = supabase.from('transactions').select('*').gte('date', fromDate).order('date', { ascending: false }).limit(200)
  if (categoryFilter) query = query.eq('category', categoryFilter)
  if (typeFilter) query = query.eq('type', typeFilter)

  const { data: transactions } = await query
  const { data: categories } = await supabase.from('transactions').select('category').gte('date', fromDate)

  const uniqueCategories = [...new Set((categories ?? []).map(t => t.category))].sort()
  const allTxs = transactions ?? []
  const totalIncome = allTxs.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
  const totalExpenses = allTxs.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Transactions</h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            {allTxs.length} transactions · Income: {formatCurrency(totalIncome)} · Expenses: {formatCurrency(totalExpenses)}
          </p>
        </div>
        <div className="flex gap-2">
          <SyncBankButton />
          <AddTransactionButton />
        </div>
      </div>

      <TransactionFilters period={period} categories={uniqueCategories} />

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left px-5 py-3 text-xs font-medium text-zinc-500 uppercase">Date</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-zinc-500 uppercase">Description</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-zinc-500 uppercase">Category</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-zinc-500 uppercase">Type</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-zinc-500 uppercase">Amount</th>
                </tr>
              </thead>
              <tbody>
                {allTxs.map(tx => (
                  <tr key={tx.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/20 transition-colors">
                    <td className="px-5 py-3 text-sm text-zinc-400 whitespace-nowrap">{formatDate(tx.date)}</td>
                    <td className="px-5 py-3">
                      <p className="text-sm text-white truncate max-w-[250px]">{tx.description}</p>
                      {tx.merchant && <p className="text-xs text-zinc-500">{tx.merchant}</p>}
                    </td>
                    <td className="px-5 py-3">
                      <Badge variant="default">{tx.category}</Badge>
                    </td>
                    <td className="px-5 py-3">
                      {tx.type === 'income' ? (
                        <div className="flex items-center gap-1 text-emerald-400 text-xs font-medium">
                          <ArrowUpRight className="h-3 w-3" /> Income
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-red-400 text-xs font-medium">
                          <ArrowDownLeft className="h-3 w-3" /> Expense
                        </div>
                      )}
                    </td>
                    <td className={`px-5 py-3 text-right text-sm font-semibold ${tx.type === 'income' ? 'text-emerald-400' : 'text-white'}`}>
                      {tx.type === 'income' ? '+' : '-'}{formatCurrency(Number(tx.amount))}
                    </td>
                  </tr>
                ))}
                {allTxs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-zinc-500 text-sm">
                      No transactions found. Sync your bank or add manually.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
