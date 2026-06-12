// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { DevisProvider, useDevis } from './devis-store'

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <DevisProvider>{children}</DevisProvider>
)

describe('devis-store', () => {
  it('toggle ajoute puis retire un produit', () => {
    const { result } = renderHook(() => useDevis(), { wrapper })
    act(() => result.current.toggle('p1'))
    expect(result.current.has('p1')).toBe(true)
    expect(result.current.count).toBe(1)
    act(() => result.current.toggle('p1'))
    expect(result.current.has('p1')).toBe(false)
  })

  it('setQty borne et supprime à 0', () => {
    const { result } = renderHook(() => useDevis(), { wrapper })
    act(() => result.current.setQty('p1', 5))
    expect(result.current.devis.p1).toBe(5)
    act(() => result.current.setQty('p1', 0))
    expect(result.current.has('p1')).toBe(false)
  })
})
