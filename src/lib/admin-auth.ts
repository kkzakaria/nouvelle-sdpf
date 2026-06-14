import { createServerFn, createServerOnlyFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { auth } from '#/lib/auth'

/**
 * Lecture de session isolée côté serveur via createServerOnlyFn : ni cette
 * fonction ni ses imports serveur (auth → cloudflare:workers, getRequest →
 * node:async_hooks) n'entrent dans le bundle client.
 */
const readSession = createServerOnlyFn(() =>
  auth.api.getSession({ headers: getRequest().headers }),
)

export async function requireAdmin() {
  const session = await readSession()
  if (!session) throw new Error('UNAUTHORIZED')
  return session
}

export const getAdminSession = createServerFn({ method: 'GET' }).handler(
  async () => {
    const session = await readSession()
    return session ? { email: session.user.email } : null
  },
)
