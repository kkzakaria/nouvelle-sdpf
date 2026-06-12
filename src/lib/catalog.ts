import { createServerFn } from '@tanstack/react-start'
import { asc, eq } from 'drizzle-orm'
import { db } from '#/db/index'
import { categories, products, productImages, settings } from '#/db/schema'

export type CategoryDTO = typeof categories.$inferSelect
export type ProductDTO = typeof products.$inferSelect & { images: Array<{ key: string; alt: string }> }

export const getCategories = createServerFn({ method: 'GET' }).handler(async () => {
  return db.select().from(categories).orderBy(asc(categories.sortOrder))
})

export const getProducts = createServerFn({ method: 'GET' }).handler(async () => {
  const rows = await db.select().from(products).orderBy(asc(products.sortOrder))
  const imgs = await db.select().from(productImages).orderBy(asc(productImages.sortOrder))
  return rows.map((p) => ({
    ...p,
    images: imgs.filter((i) => i.productId === p.id).map((i) => ({ key: i.r2Key, alt: i.alt })),
  }))
})

export const getFeatured = createServerFn({ method: 'GET' }).handler(async () => {
  const rows = await db.select().from(products).where(eq(products.featured, true)).orderBy(asc(products.sortOrder))
  const imgs = await db.select().from(productImages).orderBy(asc(productImages.sortOrder))
  return rows.map((p) => ({
    ...p,
    images: imgs.filter((i) => i.productId === p.id).map((i) => ({ key: i.r2Key, alt: i.alt })),
  }))
})

export const getProductBySlug = createServerFn({ method: 'GET' })
  .inputValidator((slug: string) => slug)
  .handler(async ({ data: slug }) => {
    const [p] = await db.select().from(products).where(eq(products.slug, slug)).limit(1)
    if (!p) return null
    const imgs = await db
      .select()
      .from(productImages)
      .where(eq(productImages.productId, p.id))
      .orderBy(asc(productImages.sortOrder))
    return { ...p, images: imgs.map((i) => ({ key: i.r2Key, alt: i.alt })) }
  })

export const getSettings = createServerFn({ method: 'GET' }).handler(async () => {
  const rows = await db.select().from(settings)
  return Object.fromEntries(rows.map((r) => [r.key, r.value])) as Record<string, string>
})
