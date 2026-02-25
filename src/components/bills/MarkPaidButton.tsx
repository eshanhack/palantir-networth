'use client'

import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { CheckCircle } from 'lucide-react'

export function MarkPaidButton({ billId }: { billId: string }) {
  const router = useRouter()
  const handlePaid = async () => {
    await supabase.from('one_off_bills').update({ is_paid: true }).eq('id', billId)
    router.refresh()
  }
  return (
    <Button variant="outline" size="sm" onClick={handlePaid} className="w-full">
      <CheckCircle className="h-3.5 w-3.5" />
      Mark as Paid
    </Button>
  )
}
