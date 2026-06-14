import { describe, it, expect } from 'vitest'
import { slugify } from './slug'

describe('slugify', () => {
  it('lowercases and hyphenates words', () => {
    expect(slugify('Plaque BA13')).toBe('plaque-ba13')
  })
  it('strips accents', () => {
    expect(slugify('Plâtre de Finition')).toBe('platre-de-finition')
  })
  it('collapses non-alphanumerics and trims hyphens', () => {
    expect(slugify('  Multi  ///  Usage!! ')).toBe('multi-usage')
  })
  it('falls back to "produit" when empty', () => {
    expect(slugify('   ***   ')).toBe('produit')
  })
  it('caps length at 60 characters', () => {
    expect(slugify('a'.repeat(80)).length).toBe(60)
  })
})
