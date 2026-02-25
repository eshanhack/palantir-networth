import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'
import { AddLiabilityButton } from '@/components/liabilities/AddLiabilityButton'

export const dynamic = 'force-dynamic'

const typeLabels: Record<string, string> = {
  mortgage: 'Mortgage', loan: 'Loan', credit_card: 'Credit Card', other: 'Other'
}

export default async function LiabilitiesPage() {
  const { data: liabilities } = await supabase.from('liabilities').select('*').order('balance', { ascending: false })
  const all = liabilities ?? []
  const total = all.reduce((s, l) => s + Number(l.balance), 0)
  const monthlyPayments = all.reduce((s, l) => s + Number(l.minimum_payment ?? 0), 0)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Liabilities</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Total debt: {formatCurrency(total)} · Min. monthly payments: {formatCurrency(monthlyPayments)}</p>
        </div>
        <AddLiabilityButton />
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {(['mortgage', 'loan', 'credit_card', 'other'] as const).map(type => {
          const value = all.filter(l => l.type === type).reduce((s, l) => s + Number(l.balance), 0)
          return (
            <Card key={type} className="p-4">
              <p className="text-xs text-zinc-500 mb-1">{typeLabels[type]}</p>
              <p className="text-lg font-bold text-white">{formatCurrency(value)}</p>
            </Card>
          )
        })}
      </div>

      <Card>
        <CardHeader><CardTitle>All Liabilities</CardTitle></CardHeader>
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left px-5 py-3 text-xs font-medium text-zinc-500 uppercase">Name</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-zinc-500 uppercase">Type</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-zinc-500 uppercase">Balance</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-zinc-500 uppercase">Interest Rate</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-zinc-500 uppercase">Min. Payment</th>
              </tr>
            </thead>
            <tbody>
              {all.map(l => (
                <tr key={l.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/20">
                  <td className="px-5 py-3 text-sm font-medium text-white">{l.name}</td>
                  <td className="px-5 py-3"><Badge>{typeLabels[l.type] ?? l.type}</Badge></td>
                  <td className="px-5 py-3 text-right text-sm font-semibold text-red-400">{formatCurrency(Number(l.balance))}</td>
                  <td className="px-5 py-3 text-right text-sm text-zinc-400">
                    {l.interest_rate ? `${(Number(l.interest_rate) * 100).toFixed(2)}%` : '—'}
                  </td>
                  <td className="px-5 py-3 text-right text-sm text-zinc-400">
                    {l.minimum_payment ? formatCurrency(Number(l.minimum_payment)) : '—'}
                  </td>
                </tr>
              ))}
              {all.length === 0 && (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-zinc-500 text-sm">No liabilities. Great!</td></tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
