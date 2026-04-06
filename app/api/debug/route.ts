import { NextResponse } from 'next/server'

export async function GET() {
  const baseUrl = (process.env.UNBLOCKPAY_BASE_URL ?? '').trim().replace(/\/+$/, '')
  const apiKey = (process.env.UNBLOCKPAY_API_KEY ?? '').trim()

  if (!baseUrl || !apiKey) {
    return NextResponse.json({ error: 'Env vars missing' })
  }

  const headers = {
    'Content-Type': 'application/json',
    Authorization: apiKey,
  }

  // Test different paths — list vs individual resource
  const pathsToTest = [
    '/v1/customers',
    '/v1/customers/test-id-123',
    '/v1/transactions',
    '/v1/user',
    '/v1/me',
    '/v1/accounts',
  ]

  const results: Record<string, unknown>[] = []

  for (const path of pathsToTest) {
    try {
      const res = await fetch(`${baseUrl}${path}`, { headers, cache: 'no-store' })
      const text = await res.text()
      let body: unknown
      try { body = JSON.parse(text) } catch { body = text.slice(0, 200) }
      results.push({ path, status: res.status, ok: res.ok, body })
    } catch (e) {
      results.push({ path, error: String(e) })
    }
  }

  return NextResponse.json({
    baseUrl,
    keyPrefix: apiKey.slice(0, 8) + `... (${apiKey.length} chars)`,
    results,
  })
}
