import { NextResponse } from 'next/server'

export async function GET() {
  const baseUrl = process.env.UNBLOCKPAY_BASE_URL
  const apiKey = process.env.UNBLOCKPAY_API_KEY

  if (!baseUrl || !apiKey) {
    return NextResponse.json({ error: 'Env vars missing' })
  }

  const key = apiKey.trim()
  const url = `${baseUrl}/v1/customers`

  const attempts = [
    { label: 'x-api-key header', headers: { 'x-api-key': key } },
    { label: 'Authorization raw', headers: { Authorization: key } },
    { label: 'Authorization Bearer', headers: { Authorization: `Bearer ${key}` } },
    { label: 'Authorization ApiKey', headers: { Authorization: `ApiKey ${key}` } },
    { label: 'api-key header', headers: { 'api-key': key } },
    { label: 'X-API-Key header', headers: { 'X-API-Key': key } },
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
    } catch (e) {
      results.push({ label: attempt.label, error: String(e) })
    }
  }

  return NextResponse.json({ url, results })
}
