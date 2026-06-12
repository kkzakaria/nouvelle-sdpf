import { describe, it, expect } from 'vitest'
import { buildWaUrl, buildDevisMessage } from './wa'

describe('wa', () => {
  it('nettoie le numéro et encode le message', () => {
    const url = buildWaUrl('+225 07 17', 'Bonjour à tous')
    expect(url).toBe('https://wa.me/2250717?text=Bonjour%20%C3%A0%20tous')
  })

  it('construit le message de devis à partir des lignes', () => {
    const msg = buildDevisMessage([
      { name: 'Plâtre de finition', format: 'Sac 25 kg', qty: 2 },
      { name: 'Filasse de lin', format: 'Pelote', qty: 1 },
    ])
    expect(msg).toContain('• Plâtre de finition — 2 × (Sac 25 kg)')
    expect(msg).toContain('• Filasse de lin — 1 × (Pelote)')
    expect(msg.startsWith('Bonjour')).toBe(true)
  })
})
