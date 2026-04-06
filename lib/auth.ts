import { cookies } from 'next/headers'

export async function getSession(): Promise<boolean> {
  const cookieStore = await cookies()
  const session = cookieStore.get('ops_session')?.value
  const secret = process.env.OPS_SESSION_SECRET

  if (!secret) return false
  return session === secret
}
