import { NextRequest, NextResponse } from 'next/server'
import { getCustomers, getTransactions } from '@/lib/unblockpay'
import { MOCK_TRANSACTIONS } from '@/lib/mock-data'
import { Transaction } from '@/types'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const statusFilter = searchParams.get('status')
  const railFilter = searchParams.get('rail')
  const limit = parseInt(searchParams.get('limit') ?? '100', 10)

  try {
    const customersRes = await getCustomers()

    let allTxs: Transaction[] = []
    let usedMock = false

    if (!customersRes.success || !customersRes.data) {
      allTxs = MOCK_TRANSACTIONS
      usedMock = true
    } else {
      const customers = customersRes.data
      await Promise.all(
        customers.map(async (customer) => {
          const txRes = await getTransactions(customer.id)
          if (txRes.success && txRes.data) {
            const withCustomerId = txRes.data.map((t) => ({ ...t, customer_id: customer.id }))
            allTxs.push(...withCustomerId)
          }
        })
      )

      if (allTxs.length === 0) {
        allTxs = MOCK_TRANSACTIONS
        usedMock = true
      }
    }

    // Sort by created_at descending
    allTxs.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )

    // Apply filters
    if (statusFilter) {
      allTxs = allTxs.filter((t) => t.status === statusFilter)
    }
    if (railFilter) {
      allTxs = allTxs.filter(
        (t) =>
          t.sender.payment_rail === railFilter || t.receiver.payment_rail === railFilter
      )
    }

    const total = allTxs.length
    const transactions = allTxs.slice(0, limit)

    return NextResponse.json({ transactions, total, mock: usedMock })
  } catch {
    const allTxs = MOCK_TRANSACTIONS.slice(0, limit)
    return NextResponse.json({ transactions: allTxs, total: MOCK_TRANSACTIONS.length, mock: true })
  }
}
