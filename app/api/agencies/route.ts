import { NextResponse } from 'next/server'
import { getCustomers, getTransactions } from '@/lib/unblockpay'
import { MOCK_CUSTOMERS, MOCK_TRANSACTIONS } from '@/lib/mock-data'
import { Customer, Transaction, TransactionStatus } from '@/types'

function buildAgencies(customers: Customer[], allTxsByCustomer: Record<string, Transaction[]>, useMock: boolean) {
  const agencies = customers.map((customer) => {
    const txs = allTxsByCustomer[customer.id] ?? []
    const completed = txs.filter((t) => t.status === TransactionStatus.completed)
    const tpv = completed.reduce((sum, t) => sum + t.sender.amount, 0)
    const sorted = [...txs].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    const last_tx_at = sorted[0]?.created_at ?? null

    const name =
      customer.business_legal_name ??
      `${customer.first_name ?? ''} ${customer.last_name ?? ''}`.trim()

    return {
      id: customer.id,
      name,
      email: customer.email,
      status: customer.status,
      tx_count: txs.length,
      tpv,
      last_tx_at,
    }
  })

  agencies.sort((a, b) => b.tpv - a.tpv)
  return { agencies, mock: useMock }
}

export async function GET() {
  try {
    const customersRes = await getCustomers()

    if (!customersRes.success || !customersRes.data) {
      const mockByCustomer: Record<string, Transaction[]> = {}
      for (const t of MOCK_TRANSACTIONS) {
        if (t.customer_id) {
          mockByCustomer[t.customer_id] = mockByCustomer[t.customer_id] ?? []
          mockByCustomer[t.customer_id].push(t)
        }
      }
      return NextResponse.json(buildAgencies(MOCK_CUSTOMERS, mockByCustomer, true))
    }

    const customers = customersRes.data
    const allTxsByCustomer: Record<string, Transaction[]> = {}

    await Promise.all(
      customers.map(async (customer) => {
        const txRes = await getTransactions(customer.id)
        if (txRes.success && txRes.data) {
          allTxsByCustomer[customer.id] = txRes.data
        } else {
          allTxsByCustomer[customer.id] = []
        }
      })
    )

    return NextResponse.json(buildAgencies(customers, allTxsByCustomer, false))
  } catch {
    const mockByCustomer: Record<string, Transaction[]> = {}
    for (const t of MOCK_TRANSACTIONS) {
      if (t.customer_id) {
        mockByCustomer[t.customer_id] = mockByCustomer[t.customer_id] ?? []
        mockByCustomer[t.customer_id].push(t)
      }
    }
    return NextResponse.json(buildAgencies(MOCK_CUSTOMERS, mockByCustomer, true))
  }
}
