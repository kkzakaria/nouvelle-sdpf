import { describe, it, expect } from 'vitest'
import {
  productInput,
  categoryInput,
  settingsInput,
} from './admin-schemas'

describe('productInput', () => {
  it('accepts a minimal valid product and applies defaults', () => {
    const r = productInput.parse({ name: 'Plâtre', categoryId: 'platres' })
    expect(r.name).toBe('Plâtre')
    expect(r.format).toBe('')
    expect(r.featured).toBe(false)
    expect(r.sortOrder).toBe(0)
  })
  it('rejects an empty name', () => {
    expect(() => productInput.parse({ name: '  ', categoryId: 'platres' })).toThrow()
  })
  it('rejects a missing category', () => {
    expect(() => productInput.parse({ name: 'X', categoryId: '' })).toThrow()
  })
  it('rejects a malformed explicit slug', () => {
    expect(() =>
      productInput.parse({ name: 'X', categoryId: 'c', slug: 'Bad Slug' }),
    ).toThrow()
  })
})

describe('categoryInput', () => {
  it('accepts a valid category', () => {
    const r = categoryInput.parse({ label: 'Plâtres', short: 'Plâtres & enduits' })
    expect(r.label).toBe('Plâtres')
    expect(r.description).toBe('')
  })
  it('rejects an empty label', () => {
    expect(() => categoryInput.parse({ label: '', short: 'x' })).toThrow()
  })
})

describe('settingsInput', () => {
  it('fills all keys with empty defaults', () => {
    const r = settingsInput.parse({})
    expect(r).toEqual({
      whatsapp_number: '',
      contact_phone: '',
      contact_phone_call: '',
      contact_email: '',
      contact_address: '',
    })
  })
})
