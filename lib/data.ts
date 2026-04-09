import { getStoredTransactions, getStoredCustomers, upsertTransaction, upsertCustomer } from '@/lib/storage'
import { getCustomers, getTransactions } from '@/lib/unblockpay'
import { Customer, Transaction } from '@/types'

/**
 * Returns live transactions from the UnblockPay API on every call.
 * Falls back to KV cache if the API is unreachable, then to mock data as last resort.
 */
export async function getLiveTransactions(): Promise<{ data: Transaction[]; mock: boolean }> {
  try {
    const customersRes = await getCustomers()
    if (customersRes.success && customersRes.data && customersRes.data.length > 0) {
      const allTxs: Transaction[] = []
      await Promise.all(
        customersRes.data.map(async (customer) => {
          const txRes = await getTransactions(customer.id)
          if (txRes.success && txRes.data) {
            allTxs.push(...txRes.data.map((t) => ({ ...t, customer_id: customer.id })))
          }
        })
      )
      if (allTxs.length > 0) {
        void Promise.all(allTxs.map((tx) => upsertTransaction(tx))).catch(() => {})
        return { data: allTxs, mock: false }
      }
    }
  } catch {
    // fall through to KV / mock
  }

  return getStoredTransactions()
}

/**
 * Returns live customers from the UnblockPay API on every call.
 * Falls back to KV cache if the API is unreachable, then to mock data as last resort.
 */
export async function getLiveCustomers(): Promise<{ data: Customer[]; mock: boolean }> {
  try {
    const customersRes = await getCustomers()
    if (customersRes.success && customersRes.data && customersRes.data.length > 0) {
      void Promise.all(customersRes.data.map((c) => upsertCustomer(c))).catch(() => {})
      return { data: customersRes.data, mock: false }
    }
  } catch {
    // fall through to KV / mock
  }

  return getStoredCustomers()
}
