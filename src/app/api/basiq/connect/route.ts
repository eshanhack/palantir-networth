import { NextResponse } from 'next/server'
import { createBasiqUser, createAuthLink } from '@/lib/basiq'
import { createServiceClient } from '@/lib/supabase'

export async function POST() {
  try {
    const supabase = createServiceClient()
    const { data: existing } = await supabase.from('bank_connections').select('basiq_user_id').limit(1).single()

    let userId: string
    if (existing?.basiq_user_id) {
      userId = existing.basiq_user_id
    } else {
      const user = await createBasiqUser('user@networth.app')
      userId = user.id
      await supabase.from('bank_connections').insert({ basiq_user_id: userId })
    }

    const url = await createAuthLink(userId)
    return NextResponse.json({ url })
  } catch (error) {
    console.error('Basiq connect error:', error)
    return NextResponse.json({ error: 'Failed to create bank connection' }, { status: 500 })
  }
}
