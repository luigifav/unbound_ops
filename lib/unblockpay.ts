import { SignatureV4 } from '@smithy/signature-v4'
import { HttpRequest } from '@smithy/protocol-http'
import { Sha256 } from '@aws-crypto/sha256-js'
import { ApiResponse, Customer, Transaction } from '@/types'

function hasSigV4Config() {
  return !!(
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY
  )
}

async function signedFetch(url: string): Promise<Response> {
  const parsed = new URL(url)
  const region = process.env.AWS_REGION ?? 'us-east-1'
  const apiKey = process.env.UNBLOCKPAY_API_KEY?.trim() ?? ''

  const request = new HttpRequest({
    method: 'GET',
    hostname: parsed.hostname,
    path: parsed.pathname + (parsed.search || ''),
    headers: {
      host: parsed.hostname,
      'content-type': 'application/json',
      ...(apiKey ? { 'x-api-key': apiKey } : {}),
    },
  })

  const signer = new SignatureV4({
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
    region,
    service: 'execute-api',
    sha256: Sha256,
  })

  const signed = await signer.sign(request)

  return fetch(url, {
    method: 'GET',
    headers: signed.headers as Record<string, string>,
    cache: 'no-store',
  })
}

async function callApi<T>(path: string): Promise<ApiResponse<T>> {
  const baseUrl = process.env.UNBLOCKPAY_BASE_URL
  const apiKey = process.env.UNBLOCKPAY_API_KEY

  if (!baseUrl || !apiKey) {
    return { data: null, error: 'Missing API configuration', success: false }
  }

  const url = `${baseUrl}${path}`

  try {
    let res: Response

    if (hasSigV4Config()) {
      res = await signedFetch(url)
    } else {
      res = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: apiKey.trim(),
        },
        cache: 'no-store',
      })
    }

    const text = await res.text()

    if (!res.ok) {
      return {
        data: null,
        error: `API error: ${res.status} — ${text.slice(0, 200)}`,
        success: false,
      }
    }

    let data: unknown
    try {
      data = JSON.parse(text)
    } catch {
      return { data: null, error: `Invalid JSON response`, success: false }
    }

    return { data: data as T, error: null, success: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { data: null, error: message, success: false }
  }
}

export async function getCustomers(): Promise<ApiResponse<Customer[]>> {
  const res = await callApi<unknown>('/v1/customers')
  if (!res.success || !res.data) return { data: null, error: res.error, success: false }

  const raw = res.data
  const list = Array.isArray(raw)
    ? raw
    : Array.isArray((raw as Record<string, unknown>).customers)
      ? (raw as { customers: Customer[] }).customers
      : Array.isArray((raw as Record<string, unknown>).data)
        ? (raw as { data: Customer[] }).data
        : null

  if (!list) return { data: null, error: 'Unexpected response shape', success: false }
  return { data: list, error: null, success: true }
}

export async function getTransactions(customerId: string): Promise<ApiResponse<Transaction[]>> {
  const res = await callApi<unknown>(`/v1/customers/${customerId}/transactions`)
  if (!res.success || !res.data) return { data: null, error: res.error, success: false }

  const raw = res.data
  const list = Array.isArray(raw)
    ? raw
    : Array.isArray((raw as Record<string, unknown>).transactions)
      ? (raw as { transactions: Transaction[] }).transactions
      : Array.isArray((raw as Record<string, unknown>).data)
        ? (raw as { data: Transaction[] }).data
        : null

  if (!list) return { data: null, error: 'Unexpected response shape', success: false }
  return { data: list, error: null, success: true }
}

export async function getTransaction(id: string): Promise<ApiResponse<Transaction>> {
  return callApi<Transaction>(`/v1/transactions/${id}`)
}
