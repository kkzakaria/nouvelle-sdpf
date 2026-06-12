/**
 * Renomme les images selon le produit, les uploade vers R2 et lie en base.
 * - Source : /tmp/cat-produit/catalogue produit/ (images d'origine "ChatGPT ...")
 * - Renommées en <slug>.<ext> dans /tmp/cat-renamed/ (copie lisible)
 * - Clé R2 : products/<slug>.<ext>  (le nom du fichier = le produit)
 * Local par défaut ; SEED_REMOTE=1 pour cibler la prod.
 * Prérequis : scripts/new-catalog.json + images extraites dans le dossier source.
 */
import { readFileSync, copyFileSync, mkdirSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

const REMOTE = process.env.SEED_REMOTE === '1'
const scope = REMOTE ? '--remote' : '--local'
const SRC = '/tmp/cat-produit/catalogue produit'
const RENAMED = '/tmp/cat-renamed'
mkdirSync(RENAMED, { recursive: true })

type Prod = {
  id: string
  name: string
  image: string
  extraImages?: Array<string>
}
const data = JSON.parse(readFileSync('scripts/new-catalog.json', 'utf8')) as {
  products: Array<Prod>
}

function r2Put(key: string, filePath: string) {
  execFileSync(
    'bunx',
    ['wrangler', 'r2', 'object', 'put', `nsdpf-images/${key}`, '--file', filePath, scope],
    { stdio: 'inherit' },
  )
}
function d1(sql: string) {
  execFileSync(
    'bunx',
    ['wrangler', 'd1', 'execute', 'nsdpf-db', scope, '--command', sql],
    { stdio: 'inherit' },
  )
}
const esc = (s: string) => s.replace(/'/g, "''")

for (const p of data.products) {
  const files = [p.image, ...(p.extraImages ?? [])]
  // Idempotent : on repart d'un état propre pour ce produit à chaque exécution.
  d1(`DELETE FROM product_images WHERE product_id = '${esc(p.id)}';`)
  files.forEach((file, i) => {
    const ext = (file.split('.').pop() || 'png').toLowerCase()
    const slugName = i === 0 ? `${p.id}.${ext}` : `${p.id}-${i}.${ext}`
    // 1) copie renommée lisible
    const renamedPath = `${RENAMED}/${slugName}`
    copyFileSync(`${SRC}/${file}`, renamedPath)
    // 2) upload R2 sous products/<slug>...
    const key = `products/${slugName}`
    r2Put(key, renamedPath)
    // 3) lien en base
    const id = i === 0 ? p.id : `${p.id}-${i}`
    d1(
      `INSERT INTO product_images (id, product_id, r2_key, alt, sort_order) VALUES ('${esc(id)}', '${esc(p.id)}', '${esc(key)}', '${esc(p.name)}', ${i});`,
    )
  })
}
console.log('Images renommées, uploadées et liées (scope:', scope, ')')
