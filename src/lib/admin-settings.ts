import { createServerFn } from '@tanstack/react-start'
import { db } from '#/db/index'
import { settings } from '#/db/schema'
import { requireAdmin } from '#/lib/admin-auth'
import { settingsInput } from '#/lib/admin-schemas'

export const adminUpdateSettings = createServerFn({ method: 'POST' })
  .inputValidator((d: unknown) => settingsInput.parse(d))
  .handler(async ({ data }) => {
    await requireAdmin()
    for (const [key, value] of Object.entries(data)) {
      await db
        .insert(settings)
        .values({ key, value })
        .onConflictDoUpdate({ target: settings.key, set: { value } })
    }
    return { ok: true }
  })
