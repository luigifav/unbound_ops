import { NextResponse } from 'next/server'

export async function GET() {
  const baseUrl = (process.env.UNBLOCKPAY_BASE_URL ?? '').trim().replace(/\/+$/, '')
  const apiKey = (process.env.UNBLOCKPAY_API_KEY ?? '').trim()

  if (!baseUrl || !apiKey) {
    return NextResponse.json({
      error: 'Env vars missing',
      missing: [
        ...(!baseUrl ? ['UNBLOCKPAY_BASE_URL'] : []),
        ...(!apiKey ? ['UNBLOCKPAY_API_KEY'] : []),
      ],
    })
  }

  // Test the primary paths we actually use in production
  const pathsToTest = [
    '/v1/transactions',     // direct — new primary strategy
    '/v1/customers',        // per-customer strategy step 1
    '/v1/customer',         // singular variant
    '/v1/me',
  ]

  const results: Record<string, unknown>[] = []

  for (const path of pathsToTest) {
    const url = `${baseUrl}${path}`
    try {
      const res = await fetch(url, {
        headers: { 'Content-Type': 'application/json', Authorization: apiKey },
        cache: 'no-store',
      })
      const text = await res.text()
      let body: unknown
      try { body = JSON.parse(text) } catch { body = text.slice(0, 400) }

      // Summarise the response shape to help map to our Transaction type
      let shape: string | null = null
      if (body && typeof body === 'object') {
        const keys = Object.keys(body as object)
        shape = `{${keys.slice(0, 10).join(', ')}}`
        if (Array.isArray(body)) shape = `Array[${(body as unknown[]).length}]`
      }

      results.push({ path, status: res.status, ok: res.ok, shape, body })
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
