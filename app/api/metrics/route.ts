import { NextResponse } from 'next/server'
import { getCustomers, getTransactions } from '@/lib/unblockpay'
import { MOCK_CUSTOMERS, MOCK_TRANSACTIONS } from '@/lib/mock-data'
import { Transaction, TransactionStatus } from '@/types'

function computeMetrics(transactions: Transaction[], useMock: boolean) {
  const completed = transactions.filter((t) => t.status === TransactionStatus.completed)
  const pending = transactions.filter(
    (t) =>
      t.status === TransactionStatus.awaiting_deposit ||
      t.status === TransactionStatus.processing
  )
  const failed = transactions.filter(
    (t) =>
      t.status === TransactionStatus.failed ||
      t.status === TransactionStatus.cancelled ||
      t.status === TransactionStatus.error
  )

  const tpv_total = completed.reduce((sum, t) => sum + t.sender.amount, 0)
  const avg_ticket = completed.length > 0 ? tpv_total / completed.length : 0

  // Build tpv_by_day for last 14 days
  const now = new Date()
  const days: { date: string; amount: number }[] = []
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]
    const amount = completed
      .filter((t) => t.finished_at && t.finished_at.startsWith(dateStr))
      .reduce((sum, t) => sum + t.sender.amount, 0)
    days.push({ date: dateStr, amount })
  }

  return {
    tpv_total,
    tx_count: transactions.length,
    tx_completed: completed.length,
    tx_pending: pending.length,
    tx_failed: failed.length,
    avg_ticket,
    tpv_by_day: days,
    mock: useMock,
  }
}

export async function GET() {
  try {
    const customersRes = await getCustomers()

    if (!customersRes.success || !customersRes.data) {
      const metrics = computeMetrics(MOCK_TRANSACTIONS, true)
      return NextResponse.json(metrics)
    }

    const customers = customersRes.data
    const allTxs: Transaction[] = []

    await Promise.all(
      customers.map(async (customer) => {
        const txRes = await getTransactions(customer.id)
        if (txRes.success && txRes.data) {
          const withCustomerId = txRes.data.map((t) => ({ ...t, customer_id: customer.id }))
          allTxs.push(...withCustomerId)
        }
      })
    )

    if (allTxs.length === 0 && customers.length === 0) {
      const metrics = computeMetrics(MOCK_TRANSACTIONS, true)
      return NextResponse.json(metrics)
    }

    const metrics = computeMetrics(allTxs, false)
    return NextResponse.json(metrics)
  } catch {
    const metrics = computeMetrics(MOCK_TRANSACTIONS, true)
    return NextResponse.json(metrics)
  }
}
