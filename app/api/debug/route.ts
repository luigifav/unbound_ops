import { NextResponse } from 'next/server'

export async function GET() {
  const baseUrl = (process.env.UNBLOCKPAY_BASE_URL ?? '').trim().replace(/\/+$/, '')
  const apiKey = (process.env.UNBLOCKPAY_API_KEY ?? '').trim()

  if (!baseUrl || !apiKey) {
    return NextResponse.json({ error: 'Env vars missing' })
  }

  // Test both the configured URL and sandbox explicitly
  const urlsToTest = [
    { label: 'configured UNBLOCKPAY_BASE_URL', url: `${baseUrl}/v1/customers` },
    { label: 'sandbox URL', url: 'https://api.sandbox.unblockpay.com/v1/customers' },
  ]

  const results: Record<string, unknown>[] = []

  for (const { label, url } of urlsToTest) {
    for (const [authLabel, headers] of [
      ['Authorization raw', { Authorization: apiKey }],
      ['Authorization Bearer', { Authorization: `Bearer ${apiKey}` }],
    ] as [string, Record<string, string>][]) {
      try {
        const res = await fetch(url, {
          headers: { 'Content-Type': 'application/json', ...headers },
          cache: 'no-store',
        })
        const text = await res.text()
        let body: unknown
        try { body = JSON.parse(text) } catch { body = text.slice(0, 300) }
        const entry = { url: label, auth: authLabel, status: res.status, ok: res.ok, body }
        results.push(entry)
        if (res.ok) {
          return NextResponse.json({ found: true, winner: entry, allResults: results })
        }
      } catch (e) {
        results.push({ url: label, auth: authLabel, error: String(e) })
      }
    }
  }

  return NextResponse.json({
    found: false,
    configuredBaseUrl: baseUrl,
    keyPrefix: apiKey.slice(0, 8) + `... (${apiKey.length} chars)`,
    results,
  })
}
