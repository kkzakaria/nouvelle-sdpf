/**
 * Génère migrations/0001_seed_catalog.sql à partir des données du mockup.
 * Les ids servent d'id ET de slug. Idempotent via INSERT OR IGNORE.
 */
import { readFileSync, writeFileSync } from 'node:fs'

const mockup = readFileSync('/tmp/nsdpf-mockup/data.js', 'utf8')
const fn = new Function('window', mockup + '\nreturn window.SDPF_DATA;')
const D = fn({})
const CATS: Array<any> = D.categories
const P: Array<any> = D.products
const FEATURED: Array<string> = D.featured

const esc = (s: string) => String(s).replace(/'/g, "''")
const lines: Array<string> = ['-- seed: catégories, produits, settings']

CATS.forEach((c, i) => {
  lines.push(
    `INSERT OR IGNORE INTO categories (id, slug, label, short, description, sort_order) VALUES ('${c.id}', '${c.id}', '${esc(c.label)}', '${esc(c.short)}', '${esc(c.desc)}', ${i});`,
  )
})

P.forEach((p, i) => {
  const featured = FEATURED.includes(p.id) ? 1 : 0
  lines.push(
    `INSERT OR IGNORE INTO products (id, slug, category_id, name, format, desc_short, desc_long, featured, sort_order) VALUES ('${p.id}', '${p.id}', '${p.cat}', '${esc(p.name)}', '${esc(p.fmt)}', '${esc(p.desc)}', '${esc(p.long)}', ${featured}, ${i});`,
  )
})

const settings: Array<[string, string]> = [
  ['whatsapp_number', '2250717593030'],
  ['contact_phone', '+225 07 17 59 30 30'],
  ['contact_email', 'contact@nsdpf.ci'],
  ['contact_address', "Abidjan, Côte d'Ivoire"],
]
settings.forEach(([k, v]) => {
  lines.push(`INSERT OR IGNORE INTO settings (key, value) VALUES ('${k}', '${esc(v)}');`)
})

writeFileSync('migrations/0001_seed_catalog.sql', lines.join('\n') + '\n')
console.log(`Écrit migrations/0001_seed_catalog.sql (${CATS.length} catégories, ${P.length} produits, ${settings.length} settings)`)
