/**
 * Génère migrations/0002_recatalog.sql à partir de scripts/new-catalog.json.
 * Remplace intégralement l'ancien catalogue (catégories + produits + images liées)
 * par le nouveau. Les `id` servent d'id ET de slug.
 */
import { readFileSync, writeFileSync } from 'node:fs'

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
const lines: Array<string> = [
  '-- re-catalogue : remplace catégories + produits (images re-liées par scripts/seed-images.ts)',
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

writeFileSync('migrations/0002_recatalog.sql', lines.join('\n') + '\n')
console.log(
  `Écrit migrations/0002_recatalog.sql (${data.categories.length} gammes, ${data.products.length} produits)`,
)
