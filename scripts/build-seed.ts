/**
 * Génère une migration de re-catalogue à partir de scripts/new-catalog.json,
 * vers le prochain numéro de migration libre (sans jamais écraser une migration
 * déjà appliquée). Remplace catégories + produits, valide les gammes, et émet
 * un SQL transactionnel. Les `id` servent d'id ET de slug.
 */
import {
  readFileSync,
  writeFileSync,
  readdirSync,
  existsSync,
} from 'node:fs'

type Cat = { id: string; label: string; short: string; description: string }
type Prod = {
  id: string
  name: string
  gamme: string
  format: string
  descShort: string
  descLong: string
  featured?: boolean
}
const data = JSON.parse(
  readFileSync('scripts/new-catalog.json', 'utf8'),
) as { categories: Array<Cat>; products: Array<Prod> }

const esc = (s: string) => String(s).replace(/'/g, "''")

// Fail-fast : toute gamme produit doit référencer une catégorie existante.
const catIds = new Set(data.categories.map((c) => c.id))
const unknown = data.products.filter((p) => !catIds.has(p.gamme))
if (unknown.length > 0) {
  throw new Error(
    `Gammes inconnues : ${unknown.map((p) => `${p.id} -> ${p.gamme}`).join(', ')}`,
  )
}

const lines: Array<string> = [
  '-- re-catalogue : remplace catégories + produits (images re-liées par scripts/seed-images.ts)',
  'BEGIN TRANSACTION;',
  'DELETE FROM product_images;',
  'DELETE FROM products;',
  'DELETE FROM categories;',
]

data.categories.forEach((c, i) => {
  lines.push(
    `INSERT INTO categories (id, slug, label, short, description, sort_order) VALUES ('${c.id}', '${c.id}', '${esc(c.label)}', '${esc(c.short)}', '${esc(c.description)}', ${i});`,
  )
})

data.products.forEach((p, i) => {
  const featured = p.featured ? 1 : 0
  lines.push(
    `INSERT INTO products (id, slug, category_id, name, format, desc_short, desc_long, featured, sort_order) VALUES ('${p.id}', '${p.id}', '${p.gamme}', '${esc(p.name)}', '${esc(p.format)}', '${esc(p.descShort)}', '${esc(p.descLong)}', ${featured}, ${i});`,
  )
})

lines.push('COMMIT;')

// Prochain numéro de migration libre — ne jamais écraser une migration existante.
const existing = readdirSync('migrations').filter((f) =>
  /^\d{4}_.*\.sql$/.test(f),
)
const next =
  Math.max(0, ...existing.map((f) => Number(f.slice(0, 4)))) + 1
const target = `migrations/${String(next).padStart(4, '0')}_recatalog.sql`
if (existsSync(target)) {
  throw new Error(`La migration ${target} existe déjà — refus d'écraser.`)
}
writeFileSync(target, lines.join('\n') + '\n')
console.log(
  `Écrit ${target} (${data.categories.length} gammes, ${data.products.length} produits)`,
)
