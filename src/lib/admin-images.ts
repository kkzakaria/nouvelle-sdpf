import { createServerFn } from '@tanstack/react-start'
import { env } from 'cloudflare:workers'
import { asc, eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '#/db/index'
import { products, productImages } from '#/db/schema'
import { requireAdmin } from '#/lib/admin-auth'

const ALLOWED_TYPES: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
}
const MAX_BYTES = 5 * 1024 * 1024 // 5 Mo

async function assertProductExists(productId: string) {
  const rows = await db
    .select({ id: products.id })
    .from(products)
    .where(eq(products.id, productId))
    .limit(1)
  if (rows.length === 0) throw new Error('PRODUCT_NOT_FOUND')
}

export const adminUploadImage = createServerFn({ method: 'POST' })
  .inputValidator((d: unknown) => {
    if (!(d instanceof FormData)) throw new Error('FormData attendu')
    return d
  })
  .handler(async ({ data }) => {
    await requireAdmin()
    const productId = String(data.get('productId') ?? '')
    const file = data.get('file')
    if (!productId) throw new Error('productId requis')
    if (!(file instanceof File)) throw new Error('Fichier requis')
    const ext = ALLOWED_TYPES[file.type]
    if (!ext) throw new Error('Type non autorisé (png, jpeg, webp)')
    if (file.size > MAX_BYTES) throw new Error('Fichier trop volumineux (max 5 Mo)')
    // Empêche l'injection d'une clé R2 arbitraire : le productId doit exister.
    await assertProductExists(productId)

    const id = crypto.randomUUID()
    const key = `products/${productId}/${id}.${ext}`
    await env.IMAGES.put(key, await file.arrayBuffer(), {
      httpMetadata: { contentType: file.type },
    })

    const existing = await db
      .select({ sortOrder: productImages.sortOrder })
      .from(productImages)
      .where(eq(productImages.productId, productId))
      .orderBy(asc(productImages.sortOrder))
    const nextOrder = existing.length
      ? Math.max(...existing.map((r) => r.sortOrder)) + 1
      : 0

    await db.insert(productImages).values({
      id,
      productId,
      r2Key: key,
      alt: '',
      sortOrder: nextOrder,
    })
    return { id, key }
  })

export const adminDeleteImage = createServerFn({ method: 'POST' })
  .inputValidator((d: unknown) => z.object({ id: z.string().min(1) }).parse(d))
  .handler(async ({ data }) => {
    await requireAdmin()
    const rows = await db
      .select({ key: productImages.r2Key })
      .from(productImages)
      .where(eq(productImages.id, data.id))
      .limit(1)
    if (rows.length === 0) return { ok: true }
    await env.IMAGES.delete(rows[0].key)
    await db.delete(productImages).where(eq(productImages.id, data.id))
    return { ok: true }
  })

export const adminReorderImages = createServerFn({ method: 'POST' })
  .inputValidator((d: unknown) =>
    z.object({ orderedIds: z.array(z.string().min(1)) }).parse(d),
  )
  .handler(async ({ data }) => {
    await requireAdmin()
    for (let i = 0; i < data.orderedIds.length; i++) {
      await db
        .update(productImages)
        .set({ sortOrder: i })
        .where(eq(productImages.id, data.orderedIds[i]))
    }
    return { ok: true }
  })
