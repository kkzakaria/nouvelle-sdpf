import { createServerFn } from '@tanstack/react-start'
import { asc, count, eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '#/db/index'
import { categories, products } from '#/db/schema'
import { requireAdmin } from '#/lib/admin-auth'
import { categoryInput, categoryUpdate } from '#/lib/admin-schemas'
import { slugify } from '#/lib/slug'

export const adminListCategories = createServerFn({ method: 'GET' }).handler(
  async () => {
    await requireAdmin()
    return db.select().from(categories).orderBy(asc(categories.sortOrder))
  },
)

export const adminCreateCategory = createServerFn({ method: 'POST' })
  .inputValidator((d: unknown) => categoryInput.parse(d))
  .handler(async ({ data }) => {
    await requireAdmin()
    const slug = data.slug ?? slugify(data.label)
    await db.insert(categories).values({
      id: slug,
      slug,
      label: data.label,
      short: data.short,
      description: data.description,
      sortOrder: data.sortOrder,
    })
    return { id: slug }
  })

export const adminUpdateCategory = createServerFn({ method: 'POST' })
  .inputValidator((d: unknown) => categoryUpdate.parse(d))
  .handler(async ({ data }) => {
    await requireAdmin()
    await db
      .update(categories)
      .set({
        label: data.label,
        short: data.short,
        description: data.description,
        sortOrder: data.sortOrder,
      })
      .where(eq(categories.id, data.id))
    return { id: data.id }
  })

export const adminDeleteCategory = createServerFn({ method: 'POST' })
  .inputValidator((d: unknown) => z.object({ id: z.string().min(1) }).parse(d))
  .handler(async ({ data }) => {
    await requireAdmin()
    const [{ n }] = await db
      .select({ n: count() })
      .from(products)
      .where(eq(products.categoryId, data.id))
    if (n > 0) throw new Error('CATEGORY_NOT_EMPTY')
    await db.delete(categories).where(eq(categories.id, data.id))
    return { ok: true }
  })
