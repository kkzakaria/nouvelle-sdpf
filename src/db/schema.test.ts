import { describe, it, expect } from 'vitest'
import { getTableConfig } from 'drizzle-orm/sqlite-core'
import * as schema from './schema'

describe('schema', () => {
  it('expose les tables du catalogue avec les bons noms SQL', () => {
    expect(getTableConfig(schema.categories).name).toBe('categories')
    expect(getTableConfig(schema.products).name).toBe('products')
    expect(getTableConfig(schema.productImages).name).toBe('product_images')
    expect(getTableConfig(schema.settings).name).toBe('settings')
  })

  it('products a une FK category_id et un flag featured', () => {
    const cols = getTableConfig(schema.products).columns.map((c) => c.name)
    expect(cols).toContain('category_id')
    expect(cols).toContain('featured')
    expect(cols).toContain('slug')
  })

  it('expose les tables better-auth', () => {
    expect(getTableConfig(schema.user).name).toBe('user')
    expect(getTableConfig(schema.session).name).toBe('session')
    expect(getTableConfig(schema.account).name).toBe('account')
    expect(getTableConfig(schema.verification).name).toBe('verification')
  })
})
