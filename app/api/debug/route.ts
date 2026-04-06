import { NextResponse } from 'next/server'
import { SignatureV4 } from '@smithy/signature-v4'
import { HttpRequest } from '@smithy/protocol-http'
import { Sha256 } from '@aws-crypto/sha256-js'

export async function GET() {
  const baseUrl = process.env.UNBLOCKPAY_BASE_URL
  const apiKey = process.env.UNBLOCKPAY_API_KEY

  if (!baseUrl || !apiKey) {
    return NextResponse.json({ error: 'Env vars missing', baseUrl: baseUrl ?? null, hasKey: !!apiKey })
  }

  const key = apiKey.trim()
  const url = `${baseUrl}/v1/customers`
  const urlSafe = url.slice(0, 60)
  const hasAwsCreds = !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY)
  const awsKeyPrefix = process.env.AWS_ACCESS_KEY_ID?.slice(0, 6) ?? null
  const awsRegion = process.env.AWS_REGION ?? null

  const results: Record<string, unknown>[] = []

  // Attempt 1: SigV4 signed (if creds available)
  if (hasAwsCreds) {
    try {
      const parsed = new URL(url)
      const region = process.env.AWS_REGION ?? 'us-east-1'
      const request = new HttpRequest({
        method: 'GET',
        hostname: parsed.hostname,
        path: parsed.pathname,
        headers: {
          host: parsed.hostname,
          'content-type': 'application/json',
          'x-api-key': key,
        },
      })
      const signer = new SignatureV4({
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        },
        region,
        service: 'execute-api',
        sha256: Sha256,
      })
      const signed = await signer.sign(request)
      const res = await fetch(url, {
        method: 'GET',
        headers: signed.headers as Record<string, string>,
        cache: 'no-store',
      })
      const text = await res.text()
      let body: unknown
      try { body = JSON.parse(text) } catch { body = text.slice(0, 300) }
      results.push({ label: 'SigV4 signed + x-api-key', status: res.status, ok: res.ok, body })
    } catch (e) {
      results.push({ label: 'SigV4 signed + x-api-key', error: String(e) })
    }
  }

  // Attempt 2: x-api-key only
  try {
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json', 'x-api-key': key },
      cache: 'no-store',
    })
    const text = await res.text()
    let body: unknown
    try { body = JSON.parse(text) } catch { body = text.slice(0, 300) }
    results.push({ label: 'x-api-key only', status: res.status, ok: res.ok, body })
  } catch (e) {
    results.push({ label: 'x-api-key only', error: String(e) })
  }

  // Attempt 3: Authorization raw
  try {
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json', Authorization: key },
      cache: 'no-store',
    })
    const text = await res.text()
    let body: unknown
    try { body = JSON.parse(text) } catch { body = text.slice(0, 300) }
    results.push({ label: 'Authorization raw', status: res.status, ok: res.ok, body })
  } catch (e) {
    results.push({ label: 'Authorization raw', error: String(e) })
  }

  return NextResponse.json({
    urlSafe,
    keyPrefix: key.slice(0, 6) + '...',
    hasAwsCreds,
    awsKeyPrefix,
    awsRegion,
    results,
  })
}
