import { NextResponse } from 'next/server'

export async function GET() {
  const baseUrl = process.env.UNBLOCKPAY_BASE_URL
  const apiKey = process.env.UNBLOCKPAY_API_KEY
  const webhookSecret = process.env.UNBLOCKPAY_WEBHOOK_SECRET

  if (!baseUrl || !apiKey) {
    return NextResponse.json({ error: 'Env vars missing', baseUrl: baseUrl ?? null, hasKey: !!apiKey })
  }

  const url = `${baseUrl}/v1/customers`

  const keysToTest: { name: string; value: string }[] = [
    { name: 'UNBLOCKPAY_API_KEY', value: apiKey.trim() },
    ...(webhookSecret ? [{ name: 'UNBLOCKPAY_WEBHOOK_SECRET', value: webhookSecret.trim() }] : []),
  ]

  const headerFormats = [
    (v: string) => ({ label: 'Authorization raw', headers: { Authorization: v } as Record<string, string> }),
    (v: string) => ({ label: 'Authorization Bearer', headers: { Authorization: `Bearer ${v}` } as Record<string, string> }),
    (v: string) => ({ label: 'x-api-key', headers: { 'x-api-key': v } as Record<string, string> }),
  ]

  const results: Record<string, unknown>[] = []

  for (const key of keysToTest) {
    for (const fmt of headerFormats) {
      const { label, headers } = fmt(key.value)
      try {
        const res = await fetch(url, {
          headers: { 'Content-Type': 'application/json', ...headers },
          cache: 'no-store',
        })
        const text = await res.text()
        let body: unknown
        try { body = JSON.parse(text) } catch { body = text.slice(0, 300) }
        const entry = { key: key.name, label, status: res.status, ok: res.ok, body }
        results.push(entry)
        if (res.ok) {
          return NextResponse.json({ found: true, winner: entry, allResults: results })
        }
      } catch (e) {
        results.push({ key: key.name, label, error: String(e) })
      }
    }
  }

  return NextResponse.json({
    found: false,
    urlSafe: url.slice(0, 60),
    keyPrefix: apiKey.trim().slice(0, 6) + '...',
    webhookPrefix: webhookSecret ? webhookSecret.trim().slice(0, 6) + '...' : null,
    results,
  })
}
