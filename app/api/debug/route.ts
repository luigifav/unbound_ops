import { NextResponse } from 'next/server'

export async function GET() {
  const baseUrl = process.env.UNBLOCKPAY_BASE_URL
  const apiKey = process.env.UNBLOCKPAY_API_KEY

  if (!baseUrl || !apiKey) {
    return NextResponse.json({ error: 'Env vars missing' })
  }

  try {
    const res = await fetch(`${baseUrl}/v1/customers`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: apiKey.trim(),
      },
      cache: 'no-store',
    })
    const text = await res.text()
    let body: unknown
    try { body = JSON.parse(text) } catch { body = text.slice(0, 500) }
    return NextResponse.json({ status: res.status, ok: res.ok, body })
  } catch (e) {
    return NextResponse.json({ error: String(e) })
  }
}
