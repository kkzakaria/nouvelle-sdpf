import { z } from 'zod'

const slugRule = z
  .string()
  .trim()
  .regex(/^[a-z0-9-]+$/, 'Slug invalide (a-z, 0-9, tirets)')

const optionalSlug = z.preprocess(
  (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
  slugRule.optional(),
)

export const productInput = z.object({
  name: z.string().trim().min(1, 'Nom requis').max(120),
  categoryId: z.string().trim().min(1, 'Catégorie requise'),
  slug: optionalSlug,
  format: z.string().trim().max(120).default(''),
  descShort: z.string().trim().max(400).default(''),
  descLong: z.string().trim().max(4000).default(''),
  featured: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
})
export type ProductInput = z.infer<typeof productInput>

export const productUpdate = productInput.extend({
  id: z.string().trim().min(1),
})
export type ProductUpdate = z.infer<typeof productUpdate>

export const categoryInput = z.object({
  label: z.string().trim().min(1, 'Libellé requis').max(80),
  short: z.string().trim().min(1, 'Sous-titre requis').max(120),
  slug: optionalSlug,
  description: z.string().trim().max(2000).default(''),
  sortOrder: z.number().int().default(0),
})
export type CategoryInput = z.infer<typeof categoryInput>

export const categoryUpdate = categoryInput.extend({
  id: z.string().trim().min(1),
})
export type CategoryUpdate = z.infer<typeof categoryUpdate>

export const settingsInput = z.object({
  whatsapp_number: z.string().trim().max(40).default(''),
  contact_phone: z.string().trim().max(40).default(''),
  contact_phone_call: z.string().trim().max(40).default(''),
  contact_email: z.string().trim().max(120).default(''),
  contact_address: z.string().trim().max(300).default(''),
})
export type SettingsInput = z.infer<typeof settingsInput>
