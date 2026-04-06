import { kv } from '@vercel/kv'
import { Customer, Transaction } from '@/types'
import { MOCK_CUSTOMERS, MOCK_TRANSACTIONS } from '@/lib/mock-data'

const TX_KEY = 'unbound:transactions'
const CUSTOMER_KEY = 'unbound:customers'
const MAX_TRANSACTIONS = 2000

function isKvConfigured(): boolean {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN)
}

// ─── Transactions ────────────────────────────────────────────────

export async function getStoredTransactions(): Promise<{ data: Transaction[]; mock: boolean }> {
  if (!isKvConfigured()) {
    return { data: MOCK_TRANSACTIONS, mock: true }
  }
  try {
    const stored = await kv.get<Transaction[]>(TX_KEY)
    if (!stored || stored.length === 0) {
      return { data: MOCK_TRANSACTIONS, mock: true }
    }
    return { data: stored, mock: false }
  } catch {
    return { data: MOCK_TRANSACTIONS, mock: true }
  }
}

export async function upsertTransaction(tx: Transaction): Promise<void> {
  if (!isKvConfigured()) return
  try {
    const stored = (await kv.get<Transaction[]>(TX_KEY)) ?? []
    const idx = stored.findIndex((t) => t.id === tx.id)
    if (idx >= 0) {
      stored[idx] = tx
    } else {
      stored.unshift(tx) // newest first
      if (stored.length > MAX_TRANSACTIONS) stored.splice(MAX_TRANSACTIONS)
    }
    await kv.set(TX_KEY, stored)
  } catch (err) {
    console.error('[storage] upsertTransaction error:', err)
  }
}

// ─── Customers / Agencies ─────────────────────────────────────────

export async function getStoredCustomers(): Promise<{ data: Customer[]; mock: boolean }> {
  if (!isKvConfigured()) {
    return { data: MOCK_CUSTOMERS, mock: true }
  }
  try {
    const stored = await kv.get<Customer[]>(CUSTOMER_KEY)
    if (!stored || stored.length === 0) {
      return { data: MOCK_CUSTOMERS, mock: true }
    }
    return { data: stored, mock: false }
  } catch {
    return { data: MOCK_CUSTOMERS, mock: true }
  }
}

export async function upsertCustomer(customer: Customer): Promise<void> {
  if (!isKvConfigured()) return
  try {
    const stored = (await kv.get<Customer[]>(CUSTOMER_KEY)) ?? []
    const idx = stored.findIndex((c) => c.id === customer.id)
    if (idx >= 0) {
      stored[idx] = customer
    } else {
      stored.push(customer)
    }
    await kv.set(CUSTOMER_KEY, stored)
  } catch (err) {
    console.error('[storage] upsertCustomer error:', err)
  }
}
