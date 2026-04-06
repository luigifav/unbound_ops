import { ApiResponse, Customer, Transaction } from '@/types'

async function callApi<T>(path: string): Promise<ApiResponse<T>> {
  const baseUrl = process.env.UNBLOCKPAY_BASE_URL
  const apiKey = process.env.UNBLOCKPAY_API_KEY

  if (!baseUrl || !apiKey) {
    console.error('[unblockpay] Missing env vars — UNBLOCKPAY_BASE_URL or UNBLOCKPAY_API_KEY not set')
    return { data: null, error: 'Missing API configuration', success: false }
  }

  try {
    const url = `${baseUrl}${path}`
    console.log(`[unblockpay] GET ${url}`)

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    })

    const text = await res.text()
    console.log(`[unblockpay] ${path} → ${res.status} | body: ${text.slice(0, 300)}`)

    if (!res.ok) {
      return {
        data: null,
        error: `API error: ${res.status} ${res.statusText} — ${text.slice(0, 200)}`,
        success: false,
      }
    }

    let data: unknown
    try {
      data = JSON.parse(text)
    } catch {
      return { data: null, error: `Invalid JSON: ${text.slice(0, 100)}`, success: false }
    }

    return { data: data as T, error: null, success: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error(`[unblockpay] ${path} → fetch failed: ${message}`)
    return { data: null, error: message, success: false }
  }
}

export async function getCustomers(): Promise<ApiResponse<Customer[]>> {
  const res = await callApi<unknown>('/customers')
  if (!res.success || !res.data) return { data: null, error: res.error, success: false }

  // Handle wrapped responses: { customers: [...] } | { data: [...] } | [...]
  const raw = res.data
  const list = Array.isArray(raw)
    ? raw
    : Array.isArray((raw as Record<string, unknown>).customers)
      ? (raw as { customers: Customer[] }).customers
      : Array.isArray((raw as Record<string, unknown>).data)
        ? (raw as { data: Customer[] }).data
        : null

  if (!list) {
    console.error('[unblockpay] /customers unexpected shape:', JSON.stringify(raw).slice(0, 200))
    return { data: null, error: 'Unexpected API response shape for customers', success: false }
  }

  return { data: list, error: null, success: true }
}

export async function getTransactions(customerId: string): Promise<ApiResponse<Transaction[]>> {
  const res = await callApi<unknown>(`/customers/${customerId}/transactions`)
  if (!res.success || !res.data) return { data: null, error: res.error, success: false }

  const raw = res.data
  const list = Array.isArray(raw)
    ? raw
    : Array.isArray((raw as Record<string, unknown>).transactions)
      ? (raw as { transactions: Transaction[] }).transactions
      : Array.isArray((raw as Record<string, unknown>).data)
        ? (raw as { data: Transaction[] }).data
        : null

  if (!list) {
    console.error('[unblockpay] /transactions unexpected shape:', JSON.stringify(raw).slice(0, 200))
    return { data: null, error: 'Unexpected API response shape for transactions', success: false }
  }

  return { data: list, error: null, success: true }
}

export async function getTransaction(id: string): Promise<ApiResponse<Transaction>> {
  return callApi<Transaction>(`/transactions/${id}`)
}
