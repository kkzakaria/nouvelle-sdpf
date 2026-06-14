import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { tanstackStartCookies } from 'better-auth/tanstack-start'
import { env } from 'cloudflare:workers'

import { db } from '#/db/index'
import * as schema from '#/db/schema'

export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: 'sqlite',
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
    // Aucune auto-inscription publique : le back-office n'a qu'un seul compte
    // admin, créé hors-ligne (voir scripts/create-admin.ts). Sans ce verrou,
    // n'importe qui pourrait s'inscrire et franchir le garde requireAdmin.
    disableSignUp: true,
  },
  plugins: [tanstackStartCookies()],
})
