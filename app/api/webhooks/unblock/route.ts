import { NextRequest, NextResponse } from 'next/server'
import { createHmac } from 'crypto'
import { upsertTransaction, upsertCustomer } from '@/lib/storage'
import { Customer, Transaction } from '@/types'

function verifySignature(body: string, signature: string, secret: string): boolean {
  const expected = createHmac('sha256', secret).update(body).digest('hex')
  // timing-safe comparison
  if (expected.length !== signature.length) return false
  let diff = 0
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i)
  }
  return diff === 0
}

export async function POST(request: NextRequest) {
  const webhookToken = process.env.UNBLOCKPAY_WEBHOOK_TOKEN
  const rawBody = await request.text()

  // Verify signature if token is configured
  if (webhookToken) {
    const signature =
      request.headers.get('x-unblock-signature') ??
      request.headers.get('x-webhook-signature') ??
      request.headers.get('x-signature') ?? ''

    if (signature && !verifySignature(rawBody, signature, webhookToken)) {
      console.warn('[webhook] Invalid signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }
  }

  let payload: Record<string, unknown>
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const event = (payload.event ?? payload.type ?? payload.eventType ?? '') as string
  const data = (payload.data ?? payload.transaction ?? payload) as Record<string, unknown>

  console.log(`[webhook] Received event: ${event}`, JSON.stringify(data).slice(0, 200))

  // Extract and store transaction
  if (data?.id && data?.status) {
    const tx = data as unknown as Transaction
    await upsertTransaction(tx)
  }

  // Extract and store customer if present
  if (data?.customer && typeof data.customer === 'object') {
    const customer = data.customer as Customer
    if (customer.id) {
      await upsertCustomer(customer)
    }
  }

  // Some webhooks nest transaction under event-specific keys
  const txData =
    (payload.transaction as Transaction) ??
    (payload.payment as Transaction) ??
    null

  if (txData?.id && txData?.status) {
    await upsertTransaction(txData)
  }

  return NextResponse.json({ received: true, event })
}

// Allow Vercel to identify this as a webhook (no auth cookie check needed)
export const dynamic = 'force-dynamic'
