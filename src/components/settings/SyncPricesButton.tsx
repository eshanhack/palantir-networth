'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'

export function SyncPricesButton() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const handleSync = async () => {
    setLoading(true)
    try {
      await fetch('/api/crypto-prices', { method: 'POST' })
      router.refresh()
    } finally {
      setLoading(false)
    }
  }
  return (
    <Button variant="outline" size="sm" onClick={handleSync} disabled={loading}>
      <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
      {loading ? 'Syncing...' : 'Update Prices'}
    </Button>
  )
}
