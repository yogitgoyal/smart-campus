import { cookies } from 'next/headers'

// Adjust the cookie name to match whatever your login system sets
// Common names: 'userId', 'token', 'next-auth.session-token'
const AUTH_COOKIE_NAME = 'userId'

export async function getCurrentUserId(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get(AUTH_COOKIE_NAME)?.value || null
}