export type DevisLine = { name: string; format: string; qty: number }

export function buildWaUrl(number: string, message: string): string {
  const n = (number || '').replace(/[^0-9]/g, '')
  return `https://wa.me/${n}?text=${encodeURIComponent(message)}`
}

export function buildDevisMessage(
  lines: Array<DevisLine>,
  extra?: { name?: string; phone?: string; note?: string },
): string {
  let m = 'Bonjour NSDPF, voici ma demande de devis :\n\n'
  for (const l of lines) m += `• ${l.name} — ${l.qty} × (${l.format})\n`
  if (extra?.name) m += `\nNom : ${extra.name}`
  if (extra?.phone) m += `\nTél : ${extra.phone}`
  if (extra?.note) m += `\nNote : ${extra.note}`
  m += '\n\nMerci.'
  return m
}
