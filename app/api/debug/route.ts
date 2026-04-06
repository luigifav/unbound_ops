import { NextResponse } from 'next/server'

export async function GET() {
  const baseUrl = process.env.UNBLOCKPAY_BASE_URL
  const apiKey = process.env.UNBLOCKPAY_API_KEY

  if (!baseUrl || !apiKey) {
    return NextResponse.json({
      error: 'Env vars missing',
      UNBLOCKPAY_BASE_URL: baseUrl ? 'SET' : 'MISSING',
      UNBLOCKPAY_API_KEY: apiKey ? 'SET' : 'MISSING',
    })
  }

  async function tryAuth(label: string, headers: Record<string, string>) {
    try {
      const res = await fetch(`${baseUrl}/customers`, { headers, cache: 'no-store' })
      const text = await res.text()
      let body: unknown
      try { body = JSON.parse(text) } catch { body = text.slice(0, 300) }
      return { label, status: res.status, ok: res.ok, body }
    } catch (e) {
      return { label, error: String(e) }
    }
  }

  const results = await Promise.all([
    tryAuth('Bearer',    { Authorization: `Bearer ${apiKey}` }),
    tryAuth('ApiKey',    { Authorization: `ApiKey ${apiKey}` }),
    tryAuth('x-api-key', { 'x-api-key': apiKey }),
    tryAuth('api-key',   { 'api-key': apiKey }),
  ])

  const working = results.find(r => r.ok)

  return NextResponse.json({
    env: {
      UNBLOCKPAY_BASE_URL: baseUrl,
      UNBLOCKPAY_API_KEY: apiKey.slice(0, 8) + '...',
    },
    working_format: working?.label ?? 'none — all returned non-200',
    results,
  })
}
