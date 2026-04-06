import { NextResponse } from 'next/server'

export async function GET() {
  const baseUrl = process.env.UNBLOCKPAY_BASE_URL
  const apiKey = process.env.UNBLOCKPAY_API_KEY

  if (!baseUrl || !apiKey) {
    return NextResponse.json({ error: 'Env vars missing', baseUrl: baseUrl ?? null, hasKey: !!apiKey })
  }

  const key = apiKey.trim()
  const url = `${baseUrl}/v1/customers`
  // Show domain only (no credentials)
  const urlSafe = url.replace(/^(https?:\/\/[^/]+)(.*)$/, '$1$2').slice(0, 60)

  const attempts = [
    { label: 'x-api-key only (no Authorization)', headers: { 'x-api-key': key } },
    { label: 'X-API-Key only (no Authorization)', headers: { 'X-API-Key': key } },
    { label: 'Authorization raw', headers: { Authorization: key } },
    { label: 'Authorization Bearer', headers: { Authorization: `Bearer ${key}` } },
    { label: 'no auth headers at all', headers: {} },
  ]

  const results: Record<string, unknown>[] = []

  for (const attempt of attempts) {
    try {
      const res = await fetch(url, {
        headers: { 'Content-Type': 'application/json', ...attempt.headers },
        cache: 'no-store',
      })
      const text = await res.text()
      let body: unknown
      try { body = JSON.parse(text) } catch { body = text.slice(0, 300) }
      results.push({ label: attempt.label, status: res.status, ok: res.ok, body })
      if (res.ok) break // stop on first success
    } catch (e) {
      results.push({ label: attempt.label, error: String(e) })
    }
  }

  return NextResponse.json({ urlSafe, keyPrefix: key.slice(0, 6) + '...', results })
}
