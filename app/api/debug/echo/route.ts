import { NextRequest, NextResponse } from 'next/server'
import { Redis } from '@upstash/redis'

export const dynamic = 'force-dynamic'

// Completely open endpoint — no auth, no token check.
// Stores the raw body + headers so we can inspect exactly what UnblockPay sends.
export async function POST(request: NextRequest) {
  const body = await request.text()
  const headers = Object.fromEntries(request.headers.entries())

  try {
    const url = process.env.storage_KV_REST_API_URL
    const token = process.env.storage_KV_REST_API_TOKEN
    if (url && token) {
      const redis = new Redis({ url, token })
      await redis.set('unbound:last_echo', {
        body,
        headers,
        timestamp: new Date().toISOString(),
      })
    }
  } catch { /* best effort */ }

  return NextResponse.json({ ok: true })
}
