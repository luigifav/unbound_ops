import { ApiResponse, Customer, Transaction } from '@/types'

async function callApi<T>(path: string): Promise<ApiResponse<T>> {
  const baseUrl = process.env.UNBLOCKPAY_BASE_URL
  const apiKey = process.env.UNBLOCKPAY_API_KEY

  if (!baseUrl || !apiKey) {
    return { data: null, error: 'Missing API configuration', success: false }
  }

  try {
    const res = await fetch(`${baseUrl}${path}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      next: { revalidate: 60 },
    })

    if (!res.ok) {
      return {
        data: null,
        error: `API error: ${res.status} ${res.statusText}`,
        success: false,
      }
    }

    const data = await res.json()
    return { data, error: null, success: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { data: null, error: message, success: false }
  }
}

export async function getCustomers(): Promise<ApiResponse<Customer[]>> {
  return callApi<Customer[]>('/customers')
}

export async function getTransactions(customerId: string): Promise<ApiResponse<Transaction[]>> {
  return callApi<Transaction[]>(`/customers/${customerId}/transactions`)
}

export async function getTransaction(id: string): Promise<ApiResponse<Transaction>> {
  return callApi<Transaction>(`/transactions/${id}`)
}
