/**
 * Upload des images vers R2 + insertion des lignes product_images.
 * Local par défaut ; SEED_REMOTE=1 pour cibler la prod.
 * Prérequis : scripts/image-map.json + images dans /tmp/whatsapp-images/.
 */
import { readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

const REMOTE = process.env.SEED_REMOTE === '1'
const scope = REMOTE ? '--remote' : '--local'
const SRC = '/tmp/whatsapp-images'
const map: Record<string, Array<string>> = JSON.parse(readFileSync('scripts/image-map.json', 'utf8'))

function r2Put(key: string, file: string) {
  execFileSync('bunx', ['wrangler', 'r2', 'object', 'put', `nsdpf-images/${key}`, '--file', `${SRC}/${file}`, scope], { stdio: 'inherit' })
}
function d1(sql: string) {
  execFileSync('bunx', ['wrangler', 'd1', 'execute', 'nsdpf-db', scope, '--command', sql], { stdio: 'inherit' })
}

for (const [productId, files] of Object.entries(map)) {
  files.forEach((file, i) => {
    const ext = file.split('.').pop() || 'jpeg'
    if (productId === '_unassigned') {
      r2Put(`library/${file.replace(/[^A-Za-z0-9._-]+/g, '_')}`, file)
      return
    }
    const key = `products/${productId}/${i}.${ext}`
    r2Put(key, file)
    const id = `${productId}-${i}`
    const alt = `${productId} image ${i + 1}`
    d1(`INSERT OR IGNORE INTO product_images (id, product_id, r2_key, alt, sort_order) VALUES ('${id}', '${productId}', '${key}', '${alt}', ${i});`)
  })
}
console.log('Images uploadées et liées (scope:', scope, ')')
