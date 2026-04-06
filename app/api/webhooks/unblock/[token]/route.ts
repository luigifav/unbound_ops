import { NextRequest, NextResponse } from 'next/server'
import { upsertTransaction, upsertCustomer } from '@/lib/storage'
import { Customer, Transaction } from '@/types'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params
  const expectedToken = process.env.UNBLOCKPAY_WEBHOOK_TOKEN

  // Validate token in URL path
  if (expectedToken && token !== expectedToken) {
    console.warn('[webhook] Invalid token in URL')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let payload: Record<string, unknown>
  try {
    payload = JSON.parse(await request.text())
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const event = (payload.event ?? payload.type ?? payload.eventType ?? '') as string
  const data = (payload.data ?? payload.transaction ?? payload) as Record<string, unknown>

  console.log(`[webhook] event=${event}`, JSON.stringify(data).slice(0, 300))

  // Store transaction if payload contains one
  const txCandidates = [
    data,
    payload.transaction,
    payload.payment,
  ] as Record<string, unknown>[]

  for (const candidate of txCandidates) {
    if (candidate?.id && candidate?.status) {
      await upsertTransaction(candidate as unknown as Transaction)
    }
  }

  // Store customer if embedded
  const customer = data?.customer as Customer | undefined
  if (customer?.id) {
    await upsertCustomer(customer)
  }

  return NextResponse.json({ received: true, event })
}
