import { getStoredTransactions, getStoredCustomers, upsertTransaction, upsertCustomer } from '@/lib/storage'
import { getAllTransactions, getCustomers, getTransactions } from '@/lib/unblockpay'
import { Customer, Transaction } from '@/types'

/**
 * Returns live transactions from the Unbound API on every call.
 * Priority: direct /v1/transactions → per-customer → KV cache → mock data.
 */
export async function getLiveTransactions(): Promise<{ data: Transaction[]; mock: boolean }> {
  // Strategy 1: direct /v1/transactions endpoint
  try {
    const directRes = await getAllTransactions()
    if (directRes.success && directRes.data && directRes.data.length > 0) {
      void Promise.all(directRes.data.map((tx) => upsertTransaction(tx))).catch(() => {})
      return { data: directRes.data, mock: false }
    }
    if (!directRes.success) {
      console.error('[data] direct /v1/transactions failed:', directRes.error)
    }
  } catch (err) {
    console.error('[data] direct /v1/transactions threw:', err)
  }

  // Strategy 2: get customers then per-customer transactions
  try {
    const customersRes = await getCustomers()
    if (customersRes.success && customersRes.data && customersRes.data.length > 0) {
      const allTxs: Transaction[] = []
      await Promise.all(
        customersRes.data.map(async (customer) => {
          const txRes = await getTransactions(customer.id)
          if (txRes.success && txRes.data) {
            allTxs.push(...txRes.data.map((t) => ({ ...t, customer_id: customer.id })))
          } else if (!txRes.success) {
            console.error(`[data] getTransactions(${customer.id}) failed:`, txRes.error)
          }
        })
      )
      if (allTxs.length > 0) {
        void Promise.all(allTxs.map((tx) => upsertTransaction(tx))).catch(() => {})
        return { data: allTxs, mock: false }
      }
    } else if (!customersRes.success) {
      console.error('[data] getCustomers failed:', customersRes.error)
    }
  } catch (err) {
    console.error('[data] per-customer strategy threw:', err)
  }

  // Strategy 3: KV cache / mock fallback
  console.warn('[data] all live API strategies failed, falling back to stored/mock data')
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
