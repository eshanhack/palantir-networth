'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Camera } from 'lucide-react'

export function SnapshotButton() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const handleSnapshot = async () => {
    setLoading(true)
    try {
      await fetch('/api/net-worth/snapshot', { method: 'POST' })
      router.refresh()
    } finally {
      setLoading(false)
    }
  }
  return (
    <Button variant="outline" size="sm" onClick={handleSnapshot} disabled={loading}>
      <Camera className="h-3.5 w-3.5" />
      {loading ? 'Saving...' : 'Take Snapshot'}
    </Button>
  )
}
