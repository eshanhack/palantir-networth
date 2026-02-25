import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import { SnapshotButton } from '@/components/settings/SnapshotButton'
import { SyncPricesButton } from '@/components/settings/SyncPricesButton'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const [connectionRes, lastSnapshotRes] = await Promise.all([
    supabase.from('bank_connections').select('*').limit(1).single(),
    supabase.from('net_worth_snapshots').select('date').order('date', { ascending: false }).limit(1).single(),
  ])

  const connection = connectionRes.data
  const lastSnapshot = lastSnapshotRes.data

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Manage connections and data</p>
      </div>

      {/* Bank connection */}
      <Card>
        <CardHeader><CardTitle>Bank Connection (Basiq)</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white">Status</p>
              <p className="text-xs text-zinc-500 mt-0.5">
                {connection?.last_synced_at ? `Last synced ${formatDate(connection.last_synced_at)}` : 'Not synced yet'}
              </p>
            </div>
            <Badge variant={connection?.is_active ? 'success' : 'default'}>
              {connection?.is_active ? 'Connected' : 'Not connected'}
            </Badge>
          </div>
          <p className="text-xs text-zinc-500">
            Connect your CommBank, NAB, or other Australian bank accounts via Basiq Open Banking. You'll be redirected to securely link your accounts.
          </p>
          <div className="p-3 bg-zinc-800/50 rounded-lg">
            <p className="text-xs font-medium text-zinc-300 mb-1">Setup steps:</p>
            <ol className="text-xs text-zinc-500 space-y-1 list-decimal list-inside">
              <li>Sign up at <span className="text-indigo-400">basiq.io</span> and get your API key</li>
              <li>Add your Basiq API key to <code className="bg-zinc-700 px-1 rounded">.env.local</code></li>
              <li>Click "Connect Bank" on the Transactions page</li>
              <li>Log in to your bank and grant access</li>
              <li>Click "Sync" to import your transactions</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      {/* Net worth snapshots */}
      <Card>
        <CardHeader><CardTitle>Net Worth Snapshots</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white">Last snapshot</p>
              <p className="text-xs text-zinc-500 mt-0.5">
                {lastSnapshot ? formatDate(lastSnapshot.date) : 'No snapshots yet'}
              </p>
            </div>
            <SnapshotButton />
          </div>
          <p className="text-xs text-zinc-500">
            Snapshots capture your current net worth for historical tracking. Take one daily for accurate graphs.
          </p>
        </CardContent>
      </Card>

      {/* Price sync */}
      <Card>
        <CardHeader><CardTitle>Price Updates</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white">Crypto prices</p>
              <p className="text-xs text-zinc-500 mt-0.5">Updates asset values from CoinGecko</p>
            </div>
            <SyncPricesButton />
          </div>
          <p className="text-xs text-zinc-500">
            Add your CoinGecko API key to <code className="bg-zinc-700 px-1 rounded">.env.local</code> for price fetching. Free tier available.
          </p>
        </CardContent>
      </Card>

      {/* API keys reference */}
      <Card>
        <CardHeader><CardTitle>Environment Variables</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[
              { key: 'NEXT_PUBLIC_SUPABASE_URL', desc: 'Supabase project URL' },
              { key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', desc: 'Supabase anonymous key' },
              { key: 'SUPABASE_SERVICE_ROLE_KEY', desc: 'Supabase service role key (server only)' },
              { key: 'BASIQ_API_KEY', desc: 'Basiq API key for bank sync' },
              { key: 'ANTHROPIC_API_KEY', desc: 'Claude API key for AI categorization' },
              { key: 'COINGECKO_API_KEY', desc: 'CoinGecko API key (optional, increases rate limits)' },
            ].map(({ key, desc }) => (
              <div key={key} className="flex items-center justify-between py-2 border-b border-zinc-800/50 last:border-0">
                <code className="text-xs text-indigo-300 font-mono">{key}</code>
                <span className="text-xs text-zinc-500">{desc}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
