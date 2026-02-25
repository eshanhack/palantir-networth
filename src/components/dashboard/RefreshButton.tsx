'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function RefreshButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleRefresh = async () => {
    setLoading(true)
    router.refresh()
    setTimeout(() => setLoading(false), 1000)
  }

  return (
    <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
      <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
      Refresh
    </Button>
  )
}
