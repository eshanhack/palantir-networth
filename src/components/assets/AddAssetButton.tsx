'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { AddAssetModal } from './AddAssetModal'

export function AddAssetButton() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        Add Asset
      </Button>
      <AddAssetModal open={open} onClose={() => setOpen(false)} />
    </>
  )
}
