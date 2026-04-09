import { getStoredTransactions, getStoredCustomers, upsertTransaction, upsertCustomer } from '@/lib/storage'
import { getCustomers, getTransactions } from '@/lib/unblockpay'
import { Customer, Transaction } from '@/types'

/**
 * Returns transactions from KV if available, otherwise fetches live from the
 * UnblockPay API and seeds KV for future requests. Falls back to mock data
 * only if both sources are unavailable.
 */
export async function getLiveTransactions(): Promise<{ data: Transaction[]; mock: boolean }> {
  const stored = await getStoredTransactions()
  if (!stored.mock) return stored

  try {
    const customersRes = await getCustomers()
    if (!customersRes.success || !customersRes.data || customersRes.data.length === 0) {
      return stored
    }

    const allTxs: Transaction[] = []
    await Promise.all(
      customersRes.data.map(async (customer) => {
        const txRes = await getTransactions(customer.id)
        if (txRes.success && txRes.data) {
          const withCustomerId = txRes.data.map((t) => ({ ...t, customer_id: customer.id }))
          allTxs.push(...withCustomerId)
        }
      })
    )

    if (allTxs.length === 0) return stored

    void Promise.all(allTxs.map((tx) => upsertTransaction(tx))).catch(() => {})

    return { data: allTxs, mock: false }
  } catch {
    return stored
  }
}

/**
 * Returns customers from KV if available, otherwise fetches live from the
 * UnblockPay API. Falls back to mock data only if both sources fail.
 */
export async function getLiveCustomers(): Promise<{ data: Customer[]; mock: boolean }> {
  const stored = await getStoredCustomers()
  if (!stored.mock) return stored

  try {
    const customersRes = await getCustomers()
    if (!customersRes.success || !customersRes.data || customersRes.data.length === 0) {
      return stored
    }

    void Promise.all(customersRes.data.map((c) => upsertCustomer(c))).catch(() => {})

    return { data: customersRes.data, mock: false }
  } catch {
    return stored
  }
}
