import { NextRequest, NextResponse } from 'next/server'
import { getStoredTransactions } from '@/lib/storage'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const statusFilter = searchParams.get('status')
  const railFilter = searchParams.get('rail')
  const limit = parseInt(searchParams.get('limit') ?? '500', 10)

  const { data: allTxs, mock } = await getStoredTransactions()

  let filtered = [...allTxs].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  if (statusFilter) {
    filtered = filtered.filter((t) => t.status === statusFilter)
  }
  if (railFilter) {
    filtered = filtered.filter(
      (t) => t.sender.payment_rail === railFilter || t.receiver.payment_rail === railFilter
    )
  }

  const total = filtered.length
  const transactions = filtered.slice(0, limit)

  return NextResponse.json({ transactions, total, mock })
}
