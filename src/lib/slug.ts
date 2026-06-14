/** Convertit un libellé en slug URL : minuscules, sans accents, tirets. */
export function slugify(input: string): string {
  const s = input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // retire les marques diacritiques combinantes (U+0300-U+036F)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/g, '') // un éventuel tiret laissé par la troncature
  return s || 'produit'
}
