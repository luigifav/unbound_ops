import { NextRequest, NextResponse } from 'next/server'
import { upsertTransaction } from '@/lib/storage'
import { TransactionStatus, TransactionType } from '@/types'

export const dynamic = 'force-dynamic'

// POST: accepts a raw webhook payload and shows what would be stored
// GET: injects a synthetic transaction to verify the full pipeline
export async function GET() {
  const synthetic = {
    id: `tx_test_${Date.now()}`,
    status: TransactionStatus.completed,
    type: TransactionType.off_ramp,
    sender: { amount: 1234, currency: 'USD', payment_rail: 'SWIFT', name: 'Test Agency' },
    receiver: { amount: 1180, currency: 'EUR', payment_rail: 'SEPA' },
    receipt: { unblockpay_fee: 12 },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    finished_at: new Date().toISOString(),
    customer_id: 'cus_test_001',
  }

  await upsertTransaction(synthetic)

  return NextResponse.json({ injected: true, transaction: synthetic })
}

export async function POST(request: NextRequest) {
  const raw = await request.text()
  let payload: unknown
  try { payload = JSON.parse(raw) } catch { payload = raw }

  return NextResponse.json({
    received: true,
    headers: Object.fromEntries(request.headers.entries()),
    payload,
  })
}
