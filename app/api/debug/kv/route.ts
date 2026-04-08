import { NextResponse } from 'next/server'
import { Redis } from '@upstash/redis'

export const dynamic = 'force-dynamic'

export async function GET() {
  const url = process.env.storage_KV_REST_API_URL
  const token = process.env.storage_KV_REST_API_TOKEN

  if (!url || !token) {
    return NextResponse.json({ error: 'KV env vars missing', url: !!url, token: !!token })
  }

  try {
    const redis = new Redis({ url, token })

    const [transactions, customers, lastEcho] = await Promise.all([
      redis.get('unbound:transactions'),
      redis.get('unbound:customers'),
      redis.get('unbound:last_echo'),
    ])

    const txArray = Array.isArray(transactions) ? transactions : []
    const cusArray = Array.isArray(customers) ? customers : []

    return NextResponse.json({
      kv_connected: true,
      transactions_count: txArray.length,
      customers_count: cusArray.length,
      latest_transaction: txArray[0] ?? null,
      last_echo: lastEcho ?? null,
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) })
  }
}
