import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isLoginPage = pathname === '/login'
  const isAuthApi = pathname.startsWith('/api/auth')
  const isWebhook = pathname.startsWith('/api/webhooks') || pathname.startsWith('/api/debug/echo')
  const isPublicAsset = pathname.startsWith('/_next') || pathname === '/favicon.ico'

  if (isLoginPage || isAuthApi || isWebhook || isPublicAsset) {
    return NextResponse.next()
  }

  const session = request.cookies.get('ops_session')?.value
  const secret = process.env.OPS_SESSION_SECRET

  if (!secret || !session || session !== secret) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
