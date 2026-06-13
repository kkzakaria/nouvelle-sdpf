import { createServerFn } from '@tanstack/react-start'
import { asc, eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '#/db/index'
import { products, productImages } from '#/db/schema'
import { requireAdmin } from '#/lib/admin-auth'
import { productInput, productUpdate } from '#/lib/admin-schemas'
import { slugify } from '#/lib/slug'

/** Renvoie un slug non utilisé par un autre produit (suffixe -2, -3, …). */
async function uniqueSlug(base: string, excludeId?: string): Promise<string> {
  const root = slugify(base)
  let candidate = root
  let i = 2
  const RESERVED = new Set(['nouveau'])
  // Boucle bornée par la taille du catalogue ; sort dès qu'un slug est libre.
  for (;;) {
    const taken = RESERVED.has(candidate)
    const rows = taken
      ? [{ id: '__reserved__' }]
      : await db
          .select({ id: products.id })
          .from(products)
          .where(eq(products.slug, candidate))
          .limit(1)
    if (!taken && (rows.length === 0 || rows[0].id === excludeId)) return candidate
    candidate = `${root}-${i++}`
  }
}

export const adminListProducts = createServerFn({ method: 'GET' }).handler(
  async () => {
    await requireAdmin()
    return db.select().from(products).orderBy(asc(products.sortOrder))
  },
)

export const adminGetProduct = createServerFn({ method: 'GET' })
  .inputValidator((d: unknown) => z.object({ id: z.string().min(1) }).parse(d))
  .handler(async ({ data }) => {
    await requireAdmin()
    const rows = await db
      .select()
      .from(products)
      .where(eq(products.id, data.id))
      .limit(1)
    if (rows.length === 0) return null
    const imgs = await db
      .select()
      .from(productImages)
      .where(eq(productImages.productId, data.id))
      .orderBy(asc(productImages.sortOrder))
    return {
      ...rows[0],
      images: imgs.map((im) => ({
        id: im.id,
        key: im.r2Key,
        alt: im.alt,
        sortOrder: im.sortOrder,
      })),
    }
  })

export const adminCreateProduct = createServerFn({ method: 'POST' })
  .inputValidator((d: unknown) => productInput.parse(d))
  .handler(async ({ data }) => {
    await requireAdmin()
    const slug = await uniqueSlug(data.slug ?? data.name)
    await db.insert(products).values({
      id: slug,
      slug,
      categoryId: data.categoryId,
      name: data.name,
      format: data.format,
      descShort: data.descShort,
      descLong: data.descLong,
      featured: data.featured,
      sortOrder: data.sortOrder,
    })
    return { id: slug }
  })

export const adminUpdateProduct = createServerFn({ method: 'POST' })
  .inputValidator((d: unknown) => productUpdate.parse(d))
  .handler(async ({ data }) => {
    await requireAdmin()
    // Le slug/id reste stable ; on ne met à jour que les champs éditables.
    await db
      .update(products)
      .set({
        categoryId: data.categoryId,
        name: data.name,
        format: data.format,
        descShort: data.descShort,
        descLong: data.descLong,
        featured: data.featured,
        sortOrder: data.sortOrder,
      })
      .where(eq(products.id, data.id))
    return { id: data.id }
  })

export const adminToggleFeatured = createServerFn({ method: 'POST' })
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().min(1), featured: z.boolean() }).parse(d),
  )
  .handler(async ({ data }) => {
    await requireAdmin()
    await db
      .update(products)
      .set({ featured: data.featured })
      .where(eq(products.id, data.id))
    return { ok: true }
  })

export const adminDeleteProduct = createServerFn({ method: 'POST' })
  .inputValidator((d: unknown) => z.object({ id: z.string().min(1) }).parse(d))
  .handler(async ({ data }) => {
    await requireAdmin()
    const imgs = await db
      .select({ key: productImages.r2Key })
      .from(productImages)
      .where(eq(productImages.productId, data.id))
    // D'abord la base (cohérente, cascade product_images), puis best-effort R2 :
    // un échec R2 laisse au pire un objet orphelin, jamais un produit non supprimable.
    await db.delete(products).where(eq(products.id, data.id))
    const { env } = await import('cloudflare:workers')
    for (const im of imgs) {
      try {
        await env.IMAGES.delete(im.key)
      } catch {
        // objet orphelin toléré ; la cohérence DB prime
      }
    }
    return { ok: true }
  })
