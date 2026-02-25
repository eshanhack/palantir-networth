'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { RefreshCw, Link } from 'lucide-react'

export function SyncBankButton() {
  const [syncing, setSyncing] = useState(false)
  const router = useRouter()

  const handleSync = async () => {
    setSyncing(true)
    try {
      const res = await fetch('/api/basiq/sync', { method: 'POST' })
      if (res.ok) router.refresh()
    } finally {
      setSyncing(false)
    }
  }

  const handleConnect = async () => {
    const res = await fetch('/api/basiq/connect', { method: 'POST' })
    const data = await res.json()
    if (data.url) window.open(data.url, '_blank')
  }

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={handleConnect}>
        <Link className="h-3.5 w-3.5" />
        Connect Bank
      </Button>
      <Button variant="outline" size="sm" onClick={handleSync} disabled={syncing}>
        <RefreshCw className={`h-3.5 w-3.5 ${syncing ? 'animate-spin' : ''}`} />
        Sync
      </Button>
    </div>
  )
}
