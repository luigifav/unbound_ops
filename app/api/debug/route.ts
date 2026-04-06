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

  async function probe(path: string) {
    try {
      const res = await fetch(`${baseUrl}${path}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
        cache: 'no-store',
      })
      const text = await res.text()
      let body: unknown
      try { body = JSON.parse(text) } catch { body = text.slice(0, 500) }
      return { status: res.status, ok: res.ok, body }
    } catch (e) {
      return { error: String(e) }
    }
  }

  const [customers] = await Promise.all([probe('/customers')])

  return NextResponse.json({
    env: {
      UNBLOCKPAY_BASE_URL: baseUrl,
      UNBLOCKPAY_API_KEY: apiKey.slice(0, 8) + '...',
    },
    customers,
  })
}
