import { NextResponse } from 'next/server'

export async function GET() {
  const baseUrl = process.env.UNBLOCKPAY_BASE_URL
  const apiKey = process.env.UNBLOCKPAY_API_KEY

  if (!baseUrl || !apiKey) {
    return NextResponse.json({ error: 'Env vars missing' })
  }

  async function probe(path: string) {
    try {
      const res = await fetch(`${baseUrl}${path}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
        cache: 'no-store',
      })
      const text = await res.text()
      let body: unknown
      try { body = JSON.parse(text) } catch { body = text.slice(0, 200) }
      return { path, status: res.status, ok: res.ok, body }
    } catch (e) {
      return { path, error: String(e) }
    }
  }

  const paths = [
    '/customers',
    '/v1/customers',
    '/v2/customers',
    '/api/customers',
    '/api/v1/customers',
  ]

  const results = await Promise.all(paths.map(probe))
  const working = results.find(r => r.ok)

  return NextResponse.json({
    base_url: baseUrl,
    working_path: working?.path ?? 'none',
    results,
  })
}
