import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { auth } from '#/lib/auth'

/**
 * À appeler en tête de chaque mutation admin : revalide la session côté
 * serveur. Lève une erreur si aucune session valide n'est présente.
 */
export async function requireAdmin() {
  const session = await auth.api.getSession({
    headers: getRequest().headers,
  })
  if (!session) throw new Error('UNAUTHORIZED')
  return session
}

/** Lue par le garde de route `beforeLoad`. Renvoie l'e-mail ou null. */
export const getAdminSession = createServerFn({ method: 'GET' }).handler(
  async () => {
    const session = await auth.api.getSession({
      headers: getRequest().headers,
    })
    return session ? { email: session.user.email } : null
  },
)
