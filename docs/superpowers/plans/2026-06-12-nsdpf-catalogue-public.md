# NSDPF — Plan 2 : Catalogue public + seed — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remplacer le template TanStack par le site NSDPF : accueil, catalogue (filtre + recherche), fiche produit, devis (localStorage + WhatsApp), contact — lisant le catalogue depuis D1, images servies depuis R2, avec seed des 4 catégories, 15 produits et upload/mapping des 38 photos.

**Architecture :** Pages SSR ; les *loaders* de route appellent des *server functions* (`createServerFn`) qui lisent D1 via drizzle. Les images sont servies par une route Worker `/img/$key` depuis R2 (Cache API + en-têtes immutables). Le panier devis est un store React + localStorage côté client ; l'envoi génère une URL `wa.me`. Le design (thème industriel) est porté depuis le mockup `/tmp/nsdpf-mockup/` : tokens CSS en variables, classes composants réutilisables, layout responsive (bottom-nav mobile / top-nav desktop) via Tailwind v4.

**Tech Stack :** TanStack Start/Router, React 19, drizzle-orm/d1, Cloudflare R2, Tailwind v4, lucide-react, Vitest.

**Prérequis :** Plan 1 terminé (D1 `nsdpf-db`, R2 `nsdpf-images`, schéma migré, `db` drizzle, bindings `DB`/`IMAGES`). Sources du mockup disponibles en lecture seule dans `/tmp/nsdpf-mockup/` (si absent, ré-extraire `nsdpf2.zip`).

**Périmètre :** Plan **2 sur 3**. Le back-office d'administration est le **Plan 3**. Ici, tout est public + scripts de seed.

---

## Données de référence (catalogue de seed)

**Catégories** (`sortOrder` = ordre ci-dessous, 0-indexé) :
| id (slug) | label | short | description |
|---|---|---|---|
| platres | Plâtres | Plâtres | Plâtres de construction, finition et staff. |
| plaques | Plaques & Carreaux | Plaques | Plaques BA13, hydrofuges et carreaux de plâtre. |
| filasse | Filasse & Étanchéité | Filasse | Filasse de lin, étoupe et pâtes d'étanchéité. |
| finition | Finition & Accessoires | Finition | Bandes, enduits à joint, profilés et colles. |

**Produits** (15) — `slug` = id, `categoryId` = colonne `cat`, `format` = `fmt`, `descShort` = `desc`, `descLong` = `long`. `featured = true` pour : `platre-finition`, `plaque-ba13`, `filasse-lin`, `carreau-std`. La liste exacte (id, cat, name, fmt, desc, long) est dans `/tmp/nsdpf-mockup/data.js` (tableaux `CATS`, `P`, `FEATURED`). Les 15 ids : platre-construction, platre-finition, platre-projeter, platre-staff, plaque-ba13, plaque-hydro, carreau-std, carreau-hydro, filasse-lin, etoupe-chanvre, pate-etancheite, bande-joint, enduit-joint, corniere, colle-carreaux.

**Numéro WhatsApp de départ** (settings) : `2250717593030` (depuis `app.jsx` du mockup). Contact : téléphone, email, adresse — valeurs de placeholder à affiner via le Plan 3 ; mettre par défaut `contact_phone="+225 07 17 59 30 30"`, `contact_email="contact@nsdpf.ci"`, `contact_address="Abidjan, Côte d'Ivoire"`.

---

## Structure des fichiers

- `src/styles.css` — réécrit : tokens du thème industriel + classes composants portées
- `src/lib/catalog.ts` — server functions de lecture D1 (catégories, produits, détail, settings)
- `src/lib/devis-store.tsx` — contexte React + localStorage du panier devis
- `src/lib/wa.ts` — construction du message + URL WhatsApp
- `src/lib/img.ts` — helper d'URL d'image (`/img/<key>`)
- `src/components/Icon.tsx` — wrapper lucide-react (mappe les noms du mockup)
- `src/components/LogoChip.tsx`, `Photo.tsx`, `Badge.tsx`, `SearchBar.tsx`, `ProductCard.tsx`, `CategoryCard.tsx`, `QtyStepper.tsx`
- `src/components/BottomNav.tsx`, `TopNav.tsx`, `AppShell.tsx`
- `src/routes/__root.tsx` — réécrit : shell + providers + nav responsive
- `src/routes/index.tsx` — Accueil
- `src/routes/catalogue.tsx` — Catalogue
- `src/routes/produit.$slug.tsx` — Détail
- `src/routes/devis.tsx` — Devis
- `src/routes/contact.tsx` — Contact
- `src/routes/img.$.tsx` — service d'images R2 (route serveur)
- `src/routes/about.tsx`, `src/components/Header.tsx`, `Footer.tsx`, `ThemeToggle.tsx`, `src/integrations/better-auth/header-user.tsx` — supprimés (starter)
- `migrations/` — nouvelle migration de seed (SQL `INSERT`)
- `scripts/seed-images.ts` — upload des 38 images vers R2 + lignes `product_images` (avec mapping)
- `public/logo-sdpf.jpeg` — logo copié depuis le mockup
- Tests : `src/lib/wa.test.ts`, `src/lib/devis-store.test.tsx`

Les assets du logo : `/tmp/nsdpf-mockup/assets/logo-sdpf.jpeg`.

---

### Task 1 : Supprimer les vestiges du starter + copier le logo

**Files:**
- Delete: `src/routes/about.tsx`, `src/components/Header.tsx`, `src/components/Footer.tsx`, `src/components/ThemeToggle.tsx`, `src/integrations/better-auth/header-user.tsx`
- Create: `public/logo-sdpf.jpeg`

- [ ] **Step 1 : Repérer les références aux fichiers à supprimer**

Run: `grep -rn "Header\|Footer\|ThemeToggle\|header-user\|/about" src/routes src/components | grep -v "BottomNav\|TopNav"`
Noter les imports dans `src/routes/__root.tsx` (ils seront retirés en réécrivant `__root.tsx` à la Task 9 ; pour l'instant on neutralise juste le build).

- [ ] **Step 2 : Copier le logo**

```bash
cp "/tmp/nsdpf-mockup/assets/logo-sdpf.jpeg" public/logo-sdpf.jpeg
```

- [ ] **Step 3 : Supprimer les fichiers starter**

```bash
rm -f src/routes/about.tsx src/components/Header.tsx src/components/Footer.tsx src/components/ThemeToggle.tsx src/integrations/better-auth/header-user.tsx
```

- [ ] **Step 4 : Réécrire temporairement `src/routes/__root.tsx`** en shell minimal pour garder le build vert jusqu'à la Task 9 :

```tsx
import { HeadContent, Outlet, Scripts, createRootRoute } from '@tanstack/react-router'
import appCss from '#/styles.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Catalogue NSDPF — Plâtre & Filasse' },
    ],
    links: [{ rel: 'stylesheet', href: appCss }],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  )
}
```

(Note : si la signature `createRootRoute`/`shellComponent` du starter diffère, conserver la structure existante de `__root.tsx` et n'en retirer que les imports/usages de Header/Footer/ThemeToggle. Vérifier la version réellement présente avant d'écraser.)

- [ ] **Step 5 : Régénérer les routes + vérifier le build de types**

Run: `bun run generate-routes && bunx tsc --noEmit`
Expected: 0 erreur (plus aucune référence aux fichiers supprimés).

- [ ] **Step 6 : Commit**

```bash
git add -A
git commit -m "chore: remove starter UI, add NSDPF logo asset"
```

---

### Task 2 : Porter le design (tokens + classes) dans `src/styles.css`

**Files:**
- Rewrite: `src/styles.css`

**Source :** `/tmp/nsdpf-mockup/styles.css` (thème **industriel uniquement** — ignorer `[data-theme="atelier"|"minimal"]`, `#stage`, `#scaler`, et tout ce qui concerne le cadre device).

- [ ] **Step 1 : Écrire `src/styles.css`** avec, dans l'ordre :
  1. La directive Tailwind v4 existante (`@import "tailwindcss";`) en tête.
  2. L'import des polices Google : `@import url('https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700;800&family=Barlow:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');` (placé avant `@import "tailwindcss";` car les `@import` doivent précéder les règles — sinon utiliser `<link>` dans `__root`).
  3. Un bloc `:root` reprenant **les variables du thème industriel** (les `--bg`, `--surface`, `--surface-2`, `--ink`, `--muted`, `--brand`, `--brand-deep`, `--accent: #1e73ad`, `--on-accent`, `--line`, `--line-strong`, `--radius`, `--radius-lg`, `--chip-r`, `--card-border`, `--shadow`, `--shadow-sm`, `--head-bg`, `--head-ink`, `--label-ff`, `--label-spacing`, `--label-transform`, `--title-ff`, `--photo-bg`, `--logo-navy: #0e3a57`) — copiés depuis le bloc `.app { ... }` du mockup.
  4. Les classes composants portées **telles quelles** (en remplaçant `.app` par `:root`/`body` là où nécessaire) : `.btn` et variantes (`.btn-primary`, `.btn-brand`, `.btn-wa`, `.btn-ghost`, `.btn-block`, `.btn-lg`), `.chip`, `.chip-accent`, `.filters`, `.fchip`, `.searchbar`, `.section-head`, `.empty`, `.qty`, `.field`, `.field-label`, `.card`, `.pcard` et sous-classes (`.pc-body`, `.pc-name`, etc. — voir `components.jsx` + parties `.pgrid`, `.photo` de `styles.css`), `.appbar`, `.bar-title`, `.logo-chip`, `.bottomnav`, `.navitem`, `.nav-badge`, `.fade-in`, `.hr`, `.label`, `.pad`, `.scroll`, `.pb-nav`, `.pgrid`.
  5. **Adapter pour le responsive** (au lieu du cadre device) :
     - `body { background: var(--bg); color: var(--ink); font-family: 'Barlow', system-ui, sans-serif; }`
     - `.pb-nav { padding-bottom: 88px; }` sur mobile ; `@media (min-width: 1024px) { .bottomnav { display: none; } .pb-nav { padding-bottom: 24px; } }`
     - `.appbar` : retirer le `padding-top: 56px` device → `padding: 16px;` (la barre n'est plus sous une encoche).
     - Conteneur central : ajouter `.container-app { max-width: 1100px; margin: 0 auto; }` pour le desktop.

  Récupérer les classes manquantes (`.pgrid`, `.photo`, `.pcard`, `.pc-*`) en lisant `/tmp/nsdpf-mockup/styles.css` en entier (sections non montrées ici) et `components.jsx`.

- [ ] **Step 2 : Vérifier visuellement que la feuille se charge**

Run: `bun run dev` (arrière-plan), ouvrir `http://localhost:3000`, confirmer que la police Barlow et le fond `--bg` s'appliquent (la page est encore vide/minimale à ce stade). Arrêter le serveur.

- [ ] **Step 3 : Commit**

```bash
git add src/styles.css
git commit -m "feat: port NSDPF industrial theme tokens and component classes"
```

---

### Task 3 : Couche d'accès aux données (server functions D1)

**Files:**
- Create: `src/lib/catalog.ts`

- [ ] **Step 1 : Écrire `src/lib/catalog.ts`**

```typescript
import { createServerFn } from '@tanstack/react-start'
import { asc, eq } from 'drizzle-orm'
import { db } from '#/db/index'
import { categories, products, productImages, settings } from '#/db/schema'

export type CategoryDTO = typeof categories.$inferSelect
export type ProductDTO = typeof products.$inferSelect & { images: Array<{ key: string; alt: string }> }

/** Toutes les catégories, triées. */
export const getCategories = createServerFn({ method: 'GET' }).handler(async () => {
  return db.select().from(categories).orderBy(asc(categories.sortOrder))
})

/** Tous les produits + leur première image (pour les grilles). */
export const getProducts = createServerFn({ method: 'GET' }).handler(async () => {
  const rows = await db.select().from(products).orderBy(asc(products.sortOrder))
  const imgs = await db.select().from(productImages).orderBy(asc(productImages.sortOrder))
  return rows.map((p) => ({
    ...p,
    images: imgs
      .filter((i) => i.productId === p.id)
      .map((i) => ({ key: i.r2Key, alt: i.alt })),
  }))
})

/** Produits mis en avant. */
export const getFeatured = createServerFn({ method: 'GET' }).handler(async () => {
  const rows = await db.select().from(products).where(eq(products.featured, true)).orderBy(asc(products.sortOrder))
  const imgs = await db.select().from(productImages).orderBy(asc(productImages.sortOrder))
  return rows.map((p) => ({
    ...p,
    images: imgs.filter((i) => i.productId === p.id).map((i) => ({ key: i.r2Key, alt: i.alt })),
  }))
})

/** Un produit par slug, avec toutes ses images. Renvoie null si absent. */
export const getProductBySlug = createServerFn({ method: 'GET' })
  .inputValidator((slug: string) => slug)
  .handler(async ({ data: slug }) => {
    const [p] = await db.select().from(products).where(eq(products.slug, slug)).limit(1)
    if (!p) return null
    const imgs = await db
      .select()
      .from(productImages)
      .where(eq(productImages.productId, p.id))
      .orderBy(asc(productImages.sortOrder))
    return { ...p, images: imgs.map((i) => ({ key: i.r2Key, alt: i.alt })) }
  })

/** Paramètres du site sous forme d'objet clé→valeur. */
export const getSettings = createServerFn({ method: 'GET' }).handler(async () => {
  const rows = await db.select().from(settings)
  return Object.fromEntries(rows.map((r) => [r.key, r.value])) as Record<string, string>
})
```

- [ ] **Step 2 : Vérifier les types**

Run: `bunx tsc --noEmit`
Expected: 0 erreur. (Si l'API `createServerFn().inputValidator(...).handler(...)` diffère de la version installée, s'aligner sur l'usage existant — comparer avec l'historique du démo drizzle supprimé ou la doc TanStack Start installée.)

- [ ] **Step 3 : Commit**

```bash
git add src/lib/catalog.ts
git commit -m "feat: add D1 catalog read server functions"
```

---

### Task 4 : Route de service d'images R2 `/img/$`

**Files:**
- Create: `src/routes/img.$.tsx`
- Create: `src/lib/img.ts`

- [ ] **Step 1 : Écrire `src/lib/img.ts`**

```typescript
/** URL publique d'une image produit servie depuis R2 via le Worker. */
export function imgUrl(key: string | undefined | null): string {
  if (!key) return '/logo-sdpf.jpeg' // fallback
  return `/img/${key}`
}
```

- [ ] **Step 2 : Écrire `src/routes/img.$.tsx`** (route serveur qui stream R2 avec cache)

```tsx
import { createFileRoute } from '@tanstack/react-router'
import { env } from 'cloudflare:workers'

export const Route = createFileRoute('/img/$')({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const key = params._splat
        if (!key) return new Response('Not found', { status: 404 })
        const object = await env.IMAGES.get(key)
        if (!object) return new Response('Not found', { status: 404 })
        const headers = new Headers()
        object.writeHttpMetadata(headers)
        headers.set('etag', object.httpEtag)
        headers.set('Cache-Control', 'public, max-age=31536000, immutable')
        return new Response(object.body, { headers })
      },
    },
  },
})
```

(Note : l'API exacte des handlers de route serveur dépend de la version de TanStack Start installée. Vérifier le pattern dans `src/routes/api/auth/$.ts` — qui définit déjà un handler serveur — et calquer la signature. Adapter `params._splat` au nom réel du splat.)

- [ ] **Step 3 : Vérifier**

Run: `bun run generate-routes && bunx tsc --noEmit`
Expected: 0 erreur, la route `/img/$` apparaît dans `routeTree.gen.ts`. (Test fonctionnel après le seed des images, Task 6.)

- [ ] **Step 4 : Commit**

```bash
git add src/routes/img.\$.tsx src/lib/img.ts
git commit -m "feat: serve product images from R2 via /img route"
```

---

### Task 5 : Migration de seed (catégories, produits, settings)

**Files:**
- Create: `migrations/0001_seed_catalog.sql` (généré manuellement, pas par drizzle-kit)
- Create: `scripts/build-seed.ts` (génère le SQL depuis `/tmp/nsdpf-mockup/data.js` pour éviter les fautes de recopie)

- [ ] **Step 1 : Écrire `scripts/build-seed.ts`** — lit les données du mockup et écrit le SQL de seed.

```typescript
/**
 * Génère migrations/0001_seed_catalog.sql à partir des données du mockup.
 * Les ids servent d'id ET de slug. Idempotent via INSERT OR IGNORE.
 */
import { readFileSync, writeFileSync } from 'node:fs'

const mockup = readFileSync('/tmp/nsdpf-mockup/data.js', 'utf8')

// Extraction des littéraux via eval encadré : on isole CATS, P, FEATURED.
const sandbox: any = { window: {} }
const fn = new Function('window', mockup + '\nreturn window.SDPF_DATA;')
const D = fn(sandbox.window)
const CATS: Array<any> = D.categories
const P: Array<any> = D.products
const FEATURED: Array<string> = D.featured

const esc = (s: string) => s.replace(/'/g, "''")
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
```

- [ ] **Step 2 : Générer le SQL**

Run: `bun run scripts/build-seed.ts`
Expected: `Écrit migrations/0001_seed_catalog.sql (4 catégories, 15 produits, 4 settings)`.

- [ ] **Step 3 : Inspecter le SQL généré**

Run: `cat migrations/0001_seed_catalog.sql`
Vérifier : 4 INSERT categories, 15 INSERT products (dont `featured=1` pour platre-finition/plaque-ba13/filasse-lin/carreau-std), 4 INSERT settings. Pas d'apostrophe non échappée.

- [ ] **Step 4 : Appliquer en local**

Run: `bunx wrangler d1 migrations apply nsdpf-db --local`
Expected: applique `0001_seed_catalog.sql`.

- [ ] **Step 5 : Vérifier les données**

Run: `bunx wrangler d1 execute nsdpf-db --local --command "SELECT (SELECT count(*) FROM categories) AS cats, (SELECT count(*) FROM products) AS prods, (SELECT count(*) FROM products WHERE featured=1) AS feat, (SELECT count(*) FROM settings) AS settings"`
Expected: `cats=4, prods=15, feat=4, settings=4`.

- [ ] **Step 6 : Commit**

```bash
git add scripts/build-seed.ts migrations/0001_seed_catalog.sql
git commit -m "feat: seed categories, products and settings"
```

---

### Task 6 : Upload + mapping des 38 images vers R2

**Files:**
- Create: `scripts/seed-images.ts`
- Create: `scripts/image-map.json` (le mapping image→produit, établi par revue visuelle)

**Contexte mapping :** 38 photos dans `/tmp/whatsapp-images/` (ré-extraire `"WhatsApp Unknown 2026-06-11 at 21.29.59.zip"` si absent). Il faut associer chaque photo au bon produit (plusieurs photos par produit possibles). Cette association demande une **revue visuelle** : l'implémenteur ouvre les images et les range par produit. Tout produit sans photo identifiable reste sans image (fallback logo). Le mapping est ajustable plus tard via le Plan 3.

- [ ] **Step 1 : Extraire les images**

```bash
mkdir -p /tmp/whatsapp-images
unzip -o -q "WhatsApp Unknown 2026-06-11 at 21.29.59.zip" -d /tmp/whatsapp-images
ls /tmp/whatsapp-images | head
```

- [ ] **Step 2 : Établir le mapping (revue visuelle)**

Examiner les 38 images (les ouvrir une par une) et écrire `scripts/image-map.json` de la forme :
```json
{
  "platre-construction": ["WhatsApp Image 2026-06-11 at 18.49.41.jpeg"],
  "plaque-ba13": ["WhatsApp Image 2026-06-11 at 18.49.42.jpeg", "WhatsApp Image 2026-06-11 at 18.49.42 (1).jpeg"]
}
```
Règles : clés = ids produits (parmi les 15) ; valeurs = noms de fichiers présents dans `/tmp/whatsapp-images/`. Faire au mieux ; il vaut mieux ne pas mapper une image incertaine que de mal l'associer. Mettre les images non attribuées dans une clé spéciale `"_unassigned"` (elles seront uploadées mais non liées, disponibles pour le Plan 3).

- [ ] **Step 3 : Écrire `scripts/seed-images.ts`**

Ce script lit `image-map.json`, uploade chaque fichier vers R2 sous la clé `products/<productId>/<n>.jpeg` (ou `library/<nom>` pour `_unassigned`) via `wrangler r2 object put`, puis insère les lignes `product_images` via `wrangler d1 execute`. Utilise `--local` par défaut, `--remote` si `SEED_REMOTE=1`.

```typescript
/**
 * Upload des images vers R2 + insertion des lignes product_images.
 * Local par défaut ; mettre SEED_REMOTE=1 pour cibler la prod.
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
const uid = (p: string, n: number) => `${p}-${n}`

for (const [productId, files] of Object.entries(map)) {
  files.forEach((file, i) => {
    const ext = file.split('.').pop() || 'jpeg'
    if (productId === '_unassigned') {
      r2Put(`library/${file.replace(/\s+/g, '_')}`, file)
      return
    }
    const key = `products/${productId}/${i}.${ext}`
    r2Put(key, file)
    const id = uid(productId, i)
    const alt = `${productId} image ${i + 1}`
    d1(`INSERT OR IGNORE INTO product_images (id, product_id, r2_key, alt, sort_order) VALUES ('${id}', '${productId}', '${key}', '${alt}', ${i});`)
  })
}
console.log('Images uploadées et liées (scope:', scope, ')')
```

- [ ] **Step 4 : Exécuter en local**

Run: `bun run scripts/seed-images.ts`
Expected: uploads + inserts sans erreur.

- [ ] **Step 5 : Vérifier**

Run: `bunx wrangler d1 execute nsdpf-db --local --command "SELECT product_id, count(*) FROM product_images GROUP BY product_id"`
Expected: des lignes pour les produits mappés.
Run (image servie) : démarrer `bun run dev`, puis `curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/img/products/<un-id>/0.jpeg"` → `200`. Arrêter le serveur.

- [ ] **Step 6 : Commit**

```bash
git add scripts/seed-images.ts scripts/image-map.json
git commit -m "feat: upload product images to R2 and link them"
```

---

### Task 7 : Composants de base (Icon, LogoChip, Photo, Badge)

**Files:**
- Create: `src/components/Icon.tsx`, `src/components/LogoChip.tsx`, `src/components/Photo.tsx`, `src/components/Badge.tsx`

- [ ] **Step 1 : `src/components/Icon.tsx`** — mappe les noms du mockup vers lucide-react.

```tsx
import {
  Home, LayoutGrid, FileText, Phone, Search, ArrowRight, ArrowLeft,
  Plus, Check, Truck, MapPin, Layers, MessageCircle, X, Minus,
  type LucideIcon,
} from 'lucide-react'

const MAP: Record<string, LucideIcon> = {
  home: Home, grid: LayoutGrid, doc: FileText, phone: Phone, search: Search,
  'arrow-r': ArrowRight, back: ArrowLeft, plus: Plus, check: Check,
  truck: Truck, pin: MapPin, layers: Layers, wa: MessageCircle, x: X, minus: Minus,
}

export function Icon({ name, size = 20, stroke = 2, className }: { name: string; size?: number; stroke?: number; className?: string }) {
  const C = MAP[name] ?? Search
  return <C size={size} strokeWidth={stroke} className={className} />
}
```

- [ ] **Step 2 : `src/components/LogoChip.tsx`**

```tsx
export function LogoChip() {
  return (
    <span className="logo-chip">
      <img src="/logo-sdpf.jpeg" alt="NSDPF" />
    </span>
  )
}
```

- [ ] **Step 3 : `src/components/Photo.tsx`** — affiche la 1ʳᵉ image produit (ou fallback), hauteur paramétrable.

```tsx
import { imgUrl } from '#/lib/img'

export function Photo({ image, alt, height = 140 }: { image?: { key: string; alt: string }; alt: string; height?: number }) {
  return (
    <div className="photo" style={{ height, background: 'var(--photo-bg)' }}>
      <img
        src={imgUrl(image?.key)}
        alt={image?.alt || alt}
        loading="lazy"
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />
    </div>
  )
}
```

- [ ] **Step 4 : `src/components/Badge.tsx`**

```tsx
export function Badge({ children, accent = false }: { children: React.ReactNode; accent?: boolean }) {
  return <span className={accent ? 'chip chip-accent' : 'chip'}>{children}</span>
}
```

- [ ] **Step 5 : Vérifier** : `bunx tsc --noEmit` → 0 erreur.

- [ ] **Step 6 : Commit**

```bash
git add src/components/Icon.tsx src/components/LogoChip.tsx src/components/Photo.tsx src/components/Badge.tsx
git commit -m "feat: add base UI components (Icon, LogoChip, Photo, Badge)"
```

---

### Task 8 : Store devis (localStorage) + helper WhatsApp + tests

**Files:**
- Create: `src/lib/wa.ts`, `src/lib/devis-store.tsx`
- Create: `src/lib/wa.test.ts`, `src/lib/devis-store.test.tsx`

- [ ] **Step 1 : Écrire le test `src/lib/wa.test.ts`** (TDD — d'abord le test)

```typescript
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
```

- [ ] **Step 2 : Lancer le test, vérifier l'échec** : `bun run test src/lib/wa.test.ts` → FAIL (module absent).

- [ ] **Step 3 : Écrire `src/lib/wa.ts`**

```typescript
export type DevisLine = { name: string; format: string; qty: number }

export function buildWaUrl(number: string, message: string): string {
  const n = (number || '').replace(/[^0-9]/g, '')
  return `https://wa.me/${n}?text=${encodeURIComponent(message)}`
}

export function buildDevisMessage(lines: Array<DevisLine>, extra?: { name?: string; phone?: string; note?: string }): string {
  let m = 'Bonjour NSDPF, voici ma demande de devis :\n\n'
  for (const l of lines) m += `• ${l.name} — ${l.qty} × (${l.format})\n`
  if (extra?.name) m += `\nNom : ${extra.name}`
  if (extra?.phone) m += `\nTél : ${extra.phone}`
  if (extra?.note) m += `\nNote : ${extra.note}`
  m += '\n\nMerci.'
  return m
}
```

- [ ] **Step 4 : Lancer le test, vérifier le succès** : `bun run test src/lib/wa.test.ts` → PASS.

- [ ] **Step 5 : Écrire `src/lib/devis-store.tsx`** — contexte React + persistance localStorage.

```tsx
import { createContext, useContext, useEffect, useState, useCallback } from 'react'

const KEY = 'sdpf_devis_v1'
type Devis = Record<string, number> // productId -> qty

type Ctx = {
  devis: Devis
  count: number
  has: (id: string) => boolean
  toggle: (id: string) => void
  setQty: (id: string, qty: number) => void
  remove: (id: string) => void
  clear: () => void
}

const DevisContext = createContext<Ctx | null>(null)

function load(): Devis {
  if (typeof localStorage === 'undefined') return {}
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}') || {}
  } catch {
    return {}
  }
}

export function DevisProvider({ children }: { children: React.ReactNode }) {
  const [devis, setDevis] = useState<Devis>({})

  useEffect(() => {
    setDevis(load())
  }, [])

  useEffect(() => {
    if (typeof localStorage !== 'undefined') localStorage.setItem(KEY, JSON.stringify(devis))
  }, [devis])

  const toggle = useCallback((id: string) => {
    setDevis((d) => {
      const n = { ...d }
      if (n[id]) delete n[id]
      else n[id] = 1
      return n
    })
  }, [])
  const setQty = useCallback((id: string, qty: number) => {
    setDevis((d) => {
      const n = { ...d }
      if (qty <= 0) delete n[id]
      else n[id] = Math.min(qty, 999)
      return n
    })
  }, [])
  const remove = useCallback((id: string) => setDevis((d) => { const n = { ...d }; delete n[id]; return n }), [])
  const clear = useCallback(() => setDevis({}), [])

  const count = Object.keys(devis).length
  const has = (id: string) => !!devis[id]

  return (
    <DevisContext.Provider value={{ devis, count, has, toggle, setQty, remove, clear }}>
      {children}
    </DevisContext.Provider>
  )
}

export function useDevis(): Ctx {
  const ctx = useContext(DevisContext)
  if (!ctx) throw new Error('useDevis doit être utilisé dans un DevisProvider')
  return ctx
}
```

- [ ] **Step 6 : Écrire `src/lib/devis-store.test.tsx`** (rendu via @testing-library/react ; jsdom déjà configuré)

```tsx
import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { DevisProvider, useDevis } from './devis-store'

const wrapper = ({ children }: { children: React.ReactNode }) => <DevisProvider>{children}</DevisProvider>

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
```

Note : le `vitest.config.ts` (créé au Plan 1) utilise `environment: 'node'`. Pour ce test React, ajouter `environment: 'jsdom'` — soit globalement, soit via un commentaire `// @vitest-environment jsdom` en tête du fichier de test. Utiliser le commentaire en tête pour ne pas casser les tests node.

- [ ] **Step 7 : Lancer tous les tests** : `bun run test` → tous PASS (schema, wa, devis-store).

- [ ] **Step 8 : Commit**

```bash
git add src/lib/wa.ts src/lib/wa.test.ts src/lib/devis-store.tsx src/lib/devis-store.test.tsx
git commit -m "feat: add devis store and WhatsApp helpers with tests"
```

---

### Task 9 : Shell applicatif + navigation responsive

**Files:**
- Create: `src/components/BottomNav.tsx`, `src/components/TopNav.tsx`, `src/components/AppShell.tsx`
- Rewrite: `src/routes/__root.tsx`

- [ ] **Step 1 : `src/components/BottomNav.tsx`** (mobile ; porté de `components.jsx` `BottomNav`, avec `<Link>` au lieu de `setTab`)

```tsx
import { Link, useRouterState } from '@tanstack/react-router'
import { Icon } from './Icon'
import { useDevis } from '#/lib/devis-store'

const ITEMS = [
  { to: '/', label: 'Accueil', icon: 'home' },
  { to: '/catalogue', label: 'Catalogue', icon: 'grid' },
  { to: '/devis', label: 'Devis', icon: 'doc' },
  { to: '/contact', label: 'Contact', icon: 'phone' },
] as const

export function BottomNav() {
  const { count } = useDevis()
  const path = useRouterState({ select: (s) => s.location.pathname })
  return (
    <nav className="bottomnav">
      {ITEMS.map((it) => {
        const on = it.to === '/' ? path === '/' : path.startsWith(it.to)
        return (
          <Link key={it.to} to={it.to} className="navitem" data-on={on ? 'true' : 'false'}>
            <Icon name={it.icon} size={23} stroke={on ? 2.4 : 2} />
            <span>{it.label}</span>
            {it.to === '/devis' && count > 0 && <span className="nav-badge">{count}</span>}
          </Link>
        )
      })}
    </nav>
  )
}
```

- [ ] **Step 2 : `src/components/TopNav.tsx`** (desktop ; réf. screenshot `desk-hero` : logo + liens + boutons WhatsApp/Devis). Masqué en mobile via la classe `topnav` (CSS : `display:none; @media(min-width:1024px){display:flex}` — ajouter cette règle à `styles.css`).

```tsx
import { Link } from '@tanstack/react-router'
import { LogoChip } from './LogoChip'
import { Icon } from './Icon'
import { useDevis } from '#/lib/devis-store'

export function TopNav({ whatsapp }: { whatsapp: string }) {
  const { count } = useDevis()
  return (
    <header className="topnav">
      <Link to="/" className="topnav-brand">
        <LogoChip />
        <span className="topnav-name">NSDPF<small>PLÂTRE &amp; FILASSE</small></span>
      </Link>
      <nav className="topnav-links">
        <Link to="/">Accueil</Link>
        <Link to="/catalogue">Catalogue</Link>
        <Link to="/contact">Contact</Link>
      </nav>
      <div className="topnav-actions">
        <a className="btn btn-wa" href={`https://wa.me/${whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener">
          <Icon name="wa" size={18} /> WhatsApp
        </a>
        <Link to="/devis" className="btn btn-brand">
          <Icon name="doc" size={18} /> Mon devis{count > 0 ? ` (${count})` : ''}
        </Link>
      </div>
    </header>
  )
}
```

Ajouter à `styles.css` : `.topnav { display:none; } @media(min-width:1024px){ .topnav{ display:flex; align-items:center; gap:24px; padding:14px 24px; background:var(--surface); border-bottom:1px solid var(--line); position:sticky; top:0; z-index:40 } .topnav-brand{display:flex;gap:10px;align-items:center;text-decoration:none;color:var(--ink)} .topnav-name{font-family:var(--title-ff);font-weight:800;line-height:1;display:flex;flex-direction:column} .topnav-name small{font-family:var(--label-ff);font-size:9px;color:var(--muted);letter-spacing:.12em} .topnav-links{display:flex;gap:18px;margin-left:auto} .topnav-links a{color:var(--ink);text-decoration:none;font-family:var(--title-ff);font-weight:600;font-size:14px} .topnav-actions{display:flex;gap:10px} }`

- [ ] **Step 3 : `src/components/AppShell.tsx`** — enveloppe : TopNav (desktop) + contenu + BottomNav (mobile).

```tsx
import { TopNav } from './TopNav'
import { BottomNav } from './BottomNav'

export function AppShell({ whatsapp, children }: { whatsapp: string; children: React.ReactNode }) {
  return (
    <>
      <TopNav whatsapp={whatsapp} />
      <div className="container-app">{children}</div>
      <BottomNav />
    </>
  )
}
```

- [ ] **Step 4 : Réécrire `src/routes/__root.tsx`** — providers + shell + loader des settings (pour le numéro WhatsApp global).

```tsx
import { HeadContent, Outlet, Scripts, createRootRoute } from '@tanstack/react-router'
import appCss from '#/styles.css?url'
import { DevisProvider } from '#/lib/devis-store'
import { AppShell } from '#/components/AppShell'
import { getSettings } from '#/lib/catalog'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Catalogue NSDPF — Plâtre & Filasse' },
    ],
    links: [{ rel: 'stylesheet', href: appCss }],
  }),
  loader: async () => ({ settings: await getSettings() }),
  shellComponent: RootDocument,
  component: RootComponent,
})

function RootComponent() {
  const { settings } = Route.useLoaderData()
  return (
    <DevisProvider>
      <AppShell whatsapp={settings.whatsapp_number ?? ''}>
        <Outlet />
      </AppShell>
    </DevisProvider>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  )
}
```

(Note : adapter `shellComponent`/`component` à l'API réellement exposée par la version de `@tanstack/react-router` installée — vérifier la forme actuelle de `__root.tsx` avant réécriture. Le loader racine doit pouvoir tourner en SSR avec accès D1.)

- [ ] **Step 5 : Vérifier** : `bun run generate-routes && bunx tsc --noEmit` → 0 erreur. Démarrer `bun run dev`, vérifier que la nav s'affiche (bottom-nav en mobile <1024px, top-nav en desktop). Arrêter.

- [ ] **Step 6 : Commit**

```bash
git add src/components/BottomNav.tsx src/components/TopNav.tsx src/components/AppShell.tsx src/routes/__root.tsx src/styles.css
git commit -m "feat: responsive app shell with bottom/top navigation"
```

---

### Task 10 : Composants catalogue (SearchBar, ProductCard, CategoryCard, QtyStepper)

**Files:**
- Create: `src/components/SearchBar.tsx`, `src/components/ProductCard.tsx`, `src/components/CategoryCard.tsx`, `src/components/QtyStepper.tsx`

**Source :** `/tmp/nsdpf-mockup/components.jsx` (`ProductCard`) et `screens.jsx`.

- [ ] **Step 1 : `src/components/SearchBar.tsx`**

```tsx
import { Icon } from './Icon'

export function SearchBar({ value, onChange, placeholder = 'Rechercher…', onSubmit }: {
  value: string; onChange: (v: string) => void; placeholder?: string; onSubmit?: () => void
}) {
  return (
    <form className="searchbar" onSubmit={(e) => { e.preventDefault(); onSubmit?.() }}>
      <Icon name="search" size={20} />
      <input placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
      {value && <span onClick={() => onChange('')} style={{ cursor: 'pointer', color: 'var(--muted)', fontSize: 18 }}>✕</span>}
    </form>
  )
}
```

- [ ] **Step 2 : `src/components/ProductCard.tsx`** (porté de `components.jsx` `ProductCard` : photo, nom, format, bouton ajouter/retirer devis ; `<Link>` vers `/produit/$slug`)

```tsx
import { Link } from '@tanstack/react-router'
import { Photo } from './Photo'
import { Icon } from './Icon'
import { useDevis } from '#/lib/devis-store'
import type { ProductDTO } from '#/lib/catalog'

export function ProductCard({ product }: { product: ProductDTO }) {
  const { has, toggle } = useDevis()
  const inDevis = has(product.id)
  return (
    <div className="card pcard">
      <Link to="/produit/$slug" params={{ slug: product.slug }} className="pcard-link">
        <Photo image={product.images[0]} alt={product.name} height={120} />
        <div className="pc-body">
          <div className="pc-name">{product.name}</div>
          <div className="pc-fmt label">{product.format}</div>
        </div>
      </Link>
      <button
        className="pc-add"
        data-on={inDevis ? 'true' : 'false'}
        aria-label="Ajouter au devis"
        onClick={(e) => { e.preventDefault(); toggle(product.id) }}
      >
        <Icon name={inDevis ? 'check' : 'plus'} size={18} stroke={2.6} />
      </button>
    </div>
  )
}
```

(Récupérer les classes `.pcard`, `.pc-body`, `.pc-name`, `.pc-add` exactes depuis `components.jsx`/`styles.css` du mockup et s'assurer qu'elles sont dans `src/styles.css` — sinon les ajouter.)

- [ ] **Step 3 : `src/components/CategoryCard.tsx`** (réf. home screenshot : « 04 RÉF. », label, description ; `<Link>` vers `/catalogue?cat=<id>`)

```tsx
import { Link } from '@tanstack/react-router'
import type { CategoryDTO } from '#/lib/catalog'

export function CategoryCard({ category, count }: { category: CategoryDTO; count: number }) {
  return (
    <Link to="/catalogue" search={{ cat: category.slug }} className="card catcard">
      <div className="label catcard-count">{String(count).padStart(2, '0')} réf.</div>
      <div className="catcard-label">{category.label}</div>
      <div className="catcard-desc">{category.description}</div>
    </Link>
  )
}
```

Ajouter à `styles.css` les classes `.catcard`, `.catcard-count`, `.catcard-label`, `.catcard-desc` (style sobre cohérent avec les cartes : padding 16px, titre `var(--title-ff)` 800, desc `var(--muted)`).

- [ ] **Step 4 : `src/components/QtyStepper.tsx`** (porté de `.qty` du mockup)

```tsx
import { Icon } from './Icon'

export function QtyStepper({ qty, onChange }: { qty: number; onChange: (q: number) => void }) {
  return (
    <span className="qty">
      <button type="button" aria-label="Diminuer" onClick={() => onChange(qty - 1)}><Icon name="minus" size={15} /></button>
      <span>{qty}</span>
      <button type="button" aria-label="Augmenter" onClick={() => onChange(qty + 1)}><Icon name="plus" size={15} /></button>
    </span>
  )
}
```

- [ ] **Step 5 : Vérifier** : `bunx tsc --noEmit` → 0 erreur.

- [ ] **Step 6 : Commit**

```bash
git add src/components/SearchBar.tsx src/components/ProductCard.tsx src/components/CategoryCard.tsx src/components/QtyStepper.tsx src/styles.css
git commit -m "feat: add catalog UI components"
```

---

### Task 11 : Page Accueil (`/`)

**Files:**
- Rewrite: `src/routes/index.tsx`

**Source :** `screens.jsx` `HomeScreen` (hero, recherche, 3 atouts Livraison/Devis/Retrait, grille catégories, produits vedettes).

- [ ] **Step 1 : Écrire `src/routes/index.tsx`**

```tsx
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { getCategories, getFeatured, getProducts } from '#/lib/catalog'
import { SearchBar } from '#/components/SearchBar'
import { CategoryCard } from '#/components/CategoryCard'
import { ProductCard } from '#/components/ProductCard'
import { Icon } from '#/components/Icon'

export const Route = createFileRoute('/')({
  loader: async () => {
    const [categories, featured, products] = await Promise.all([getCategories(), getFeatured(), getProducts()])
    const counts: Record<string, number> = {}
    for (const p of products) counts[p.categoryId] = (counts[p.categoryId] ?? 0) + 1
    return { categories, featured, counts }
  },
  component: Home,
})

function Home() {
  const { categories, featured, counts } = Route.useLoaderData()
  const [q, setQ] = useState('')
  const navigate = useNavigate()
  const goSearch = () => navigate({ to: '/catalogue', search: { q } })

  return (
    <div className="pb-nav">
      <section className="hero">
        <p className="label hero-kicker">Nouvelle Société de Distribution</p>
        <h1 className="hero-title">Le plâtre &amp; la filasse,<br />au cœur de vos chantiers.</h1>
        <p className="hero-sub">Plâtres, plaques, carreaux, filasse et accessoires de finition. Devis rapide et livraison sur chantier.</p>
        <div className="hero-cta">
          <Link to="/catalogue" className="btn btn-primary">Voir le catalogue <Icon name="arrow-r" size={18} stroke={2.4} /></Link>
          <Link to="/devis" className="btn btn-ghost">Devis</Link>
        </div>
      </section>

      <div className="pad">
        <SearchBar value={q} onChange={setQ} placeholder="Rechercher un produit…" onSubmit={goSearch} />

        <div className="perks">
          <div className="perk"><Icon name="truck" size={22} /><b>Livraison</b><span className="label">sur chantier</span></div>
          <div className="perk"><Icon name="doc" size={22} /><b>Devis</b><span className="label">sous 24 h</span></div>
          <div className="perk"><Icon name="pin" size={22} /><b>Retrait</b><span className="label">au dépôt</span></div>
        </div>

        <div className="section-head"><span className="sh-title">Nos gammes</span><Link to="/catalogue" className="sh-link">Tout voir</Link></div>
        <div className="catgrid">
          {categories.map((c) => <CategoryCard key={c.id} category={c} count={counts[c.id] ?? 0} />)}
        </div>

        <div className="section-head"><span className="sh-title">Produits vedettes</span></div>
        <div className="pgrid">
          {featured.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </div>
    </div>
  )
}
```

Ajouter à `styles.css` : `.hero` (fond `var(--logo-navy)`, texte blanc, padding, `border-radius` bas), `.hero-title` (`var(--title-ff)`, 800, grand), `.hero-sub`, `.hero-cta` (flex gap), `.perks` (grille 3 colonnes de cartes), `.perk`, `.catgrid` (grille 2 colonnes mobile, 4 desktop). S'inspirer du hero `screens.jsx` + screenshot `desk-hero`.

- [ ] **Step 2 : Vérifier en local** : `bun run dev`, ouvrir `/`. Attendu : hero NSDPF, recherche, 3 atouts, 4 cartes catégories (avec compteurs), 4 produits vedettes (avec images si seedées). Cliquer une catégorie → `/catalogue?cat=...`. Arrêter.

- [ ] **Step 3 : Commit**

```bash
git add src/routes/index.tsx src/styles.css
git commit -m "feat: NSDPF home page"
```

---

### Task 12 : Page Catalogue (`/catalogue`) — filtre + recherche

**Files:**
- Create: `src/routes/catalogue.tsx`

**Source :** `screens.jsx` `CatalogueScreen` (recherche + chips de filtre + grille + état vide). État `cat`/`q` dans l'URL (`search`).

- [ ] **Step 1 : Écrire `src/routes/catalogue.tsx`**

```tsx
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { getCategories, getProducts } from '#/lib/catalog'
import { SearchBar } from '#/components/SearchBar'
import { ProductCard } from '#/components/ProductCard'
import { Icon } from '#/components/Icon'

type Search = { cat?: string; q?: string }

export const Route = createFileRoute('/catalogue')({
  validateSearch: (s: Record<string, unknown>): Search => ({
    cat: typeof s.cat === 'string' ? s.cat : undefined,
    q: typeof s.q === 'string' ? s.q : undefined,
  }),
  loader: async () => {
    const [categories, products] = await Promise.all([getCategories(), getProducts()])
    return { categories, products }
  },
  component: Catalogue,
})

function Catalogue() {
  const { categories, products } = Route.useLoaderData()
  const { cat = 'all', q = '' } = Route.useSearch()
  const navigate = useNavigate({ from: '/catalogue' })

  const setCat = (c: string) => navigate({ search: (prev) => ({ ...prev, cat: c === 'all' ? undefined : c }) })
  const setQ = (v: string) => navigate({ search: (prev) => ({ ...prev, q: v || undefined }) })

  const needle = q.trim().toLowerCase()
  const list = products.filter((p) => {
    const okCat = cat === 'all' || p.categoryId === cat
    const okQ = !needle || p.name.toLowerCase().includes(needle) || p.descShort.toLowerCase().includes(needle)
    return okCat && okQ
  })
  const catLabel = categories.find((c) => c.slug === cat)?.label ?? 'Tous les produits'

  return (
    <div className="pb-nav">
      <div className="appbar"><div className="bar-title">Catalogue</div></div>
      <div className="pad">
        <SearchBar value={q} onChange={setQ} />
        <div className="filters" style={{ marginTop: 12 }}>
          <button className="fchip" data-on={cat === 'all'} onClick={() => setCat('all')}>Tous</button>
          {categories.map((c) => (
            <button key={c.id} className="fchip" data-on={cat === c.slug} onClick={() => setCat(c.slug)}>{c.short}</button>
          ))}
        </div>
        <div className="section-head" style={{ marginTop: 18 }}>
          <span className="sh-title">{cat === 'all' ? 'Tous les produits' : catLabel}</span>
          <span className="label" style={{ color: 'var(--muted)' }}>{list.length} réf.</span>
        </div>
        {list.length === 0 ? (
          <div className="empty">
            <div className="em-ic"><Icon name="search" size={44} stroke={1.5} /></div>
            Aucun produit ne correspond.
          </div>
        ) : (
          <div className="pgrid">
            {list.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2 : Vérifier** : `bun run dev`, `/catalogue` → grille 15 produits ; cliquer un chip → filtre + URL `?cat=` ; taper une recherche → filtre + URL `?q=` ; recherche sans résultat → état vide. Depuis l'accueil, cliquer une catégorie ouvre `/catalogue` pré-filtré. Arrêter.

- [ ] **Step 3 : Commit**

```bash
git add src/routes/catalogue.tsx
git commit -m "feat: catalogue page with category filter and search"
```

---

### Task 13 : Fiche produit (`/produit/$slug`)

**Files:**
- Create: `src/routes/produit.$slug.tsx`

**Source :** `screens.jsx` `DetailScreen` (image(s), format, description longue, bouton ajouter au devis, commander via WhatsApp, « Dans la même gamme »).

- [ ] **Step 1 : Écrire `src/routes/produit.$slug.tsx`**

```tsx
import { createFileRoute, Link, notFound } from '@tanstack/react-router'
import { getProductBySlug, getProducts, getSettings } from '#/lib/catalog'
import { Photo } from '#/components/Photo'
import { Icon } from '#/components/Icon'
import { Badge } from '#/components/Badge'
import { useDevis } from '#/lib/devis-store'
import { buildWaUrl } from '#/lib/wa'

export const Route = createFileRoute('/produit/$slug')({
  loader: async ({ params }) => {
    const product = await getProductBySlug({ data: params.slug })
    if (!product) throw notFound()
    const [all, settings] = await Promise.all([getProducts(), getSettings()])
    const related = all.filter((p) => p.categoryId === product.categoryId && p.id !== product.id).slice(0, 4)
    return { product, related, whatsapp: settings.whatsapp_number ?? '' }
  },
  component: Detail,
})

function Detail() {
  const { product, related, whatsapp } = Route.useLoaderData()
  const { has, toggle } = useDevis()
  const inDevis = has(product.id)
  const waUrl = buildWaUrl(whatsapp, `Bonjour NSDPF, je souhaite un devis pour :\n• ${product.name} (${product.format})\n\nMerci.`)

  return (
    <div className="pb-nav">
      <div className="detail-media">
        <Link to="/catalogue" className="detail-back" aria-label="Retour"><Icon name="back" size={22} /></Link>
        <Photo image={product.images[0]} alt={product.name} height={300} />
      </div>
      <div className="pad detail-body fade-in">
        <Badge>{product.format}</Badge>
        <h1 className="detail-title">{product.name}</h1>
        <p className="detail-desc">{product.descLong}</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 22 }}>
          <button className={'btn btn-block btn-lg ' + (inDevis ? 'btn-brand' : 'btn-primary')} onClick={() => toggle(product.id)}>
            <Icon name={inDevis ? 'check' : 'plus'} size={20} stroke={2.4} />
            {inDevis ? 'Ajouté au devis' : 'Ajouter au devis'}
          </button>
          <a className="btn btn-wa btn-block btn-lg" href={waUrl} target="_blank" rel="noopener">
            <Icon name="wa" size={20} /> Commander via WhatsApp
          </a>
        </div>

        {related.length > 0 && (
          <>
            <div className="section-head"><span className="sh-title">Dans la même gamme</span></div>
            <div className="related-row">
              {related.map((p) => (
                <Link key={p.id} to="/produit/$slug" params={{ slug: p.slug }} className="card pcard related-card">
                  <Photo image={p.images[0]} alt={p.name} height={104} />
                  <div className="pc-body"><div className="pc-name" style={{ fontSize: 13 }}>{p.name}</div></div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
```

Ajouter à `styles.css` : `.detail-media` (position relative), `.detail-back` (bouton flottant rond, voir mockup), `.detail-body` (fond `var(--bg)`, coins arrondis en haut, `margin-top:-18px`), `.detail-title`, `.detail-desc`, `.related-row` (flex scroll horizontal), `.related-card` (width 150). Porter depuis le style inline de `DetailScreen`.

- [ ] **Step 2 : Vérifier** : `bun run dev`, ouvrir un produit depuis le catalogue → image, format, description, boutons. « Ajouter au devis » bascule l'état + badge nav. « Commander via WhatsApp » ouvre `wa.me` avec le bon message. Slug inconnu → page 404. Arrêter.

- [ ] **Step 3 : Commit**

```bash
git add src/routes/produit.\$slug.tsx src/styles.css
git commit -m "feat: product detail page"
```

---

### Task 14 : Page Devis (`/devis`) + WhatsApp

**Files:**
- Create: `src/routes/devis.tsx`

**Source :** `screens.jsx` `DevisScreen` (liste avec quantités, champs nom/tél/note, bouton envoyer WhatsApp, vider, état vide).

- [ ] **Step 1 : Écrire `src/routes/devis.tsx`**

```tsx
import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { getProducts, getSettings } from '#/lib/catalog'
import { useDevis } from '#/lib/devis-store'
import { QtyStepper } from '#/components/QtyStepper'
import { Icon } from '#/components/Icon'
import { buildWaUrl, buildDevisMessage } from '#/lib/wa'

export const Route = createFileRoute('/devis')({
  loader: async () => {
    const [products, settings] = await Promise.all([getProducts(), getSettings()])
    return { products, whatsapp: settings.whatsapp_number ?? '' }
  },
  component: DevisPage,
})

function DevisPage() {
  const { products, whatsapp } = Route.useLoaderData()
  const { devis, setQty, remove, clear } = useDevis()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [note, setNote] = useState('')

  const ids = Object.keys(devis)
  const lines = ids
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => !!p)
    .map((p) => ({ id: p.id, name: p.name, format: p.format, qty: devis[p.id] }))

  const waUrl = buildWaUrl(whatsapp, buildDevisMessage(lines, { name, phone, note }))

  if (ids.length === 0) {
    return (
      <div className="pb-nav">
        <div className="appbar"><div className="bar-title">Mon devis</div></div>
        <div className="empty" style={{ paddingTop: 60 }}>
          <div className="em-ic"><Icon name="doc" size={52} stroke={1.4} /></div>
          <div className="empty-title">Votre devis est vide</div>
          <p style={{ maxWidth: 240, margin: '0 auto 20px' }}>Ajoutez des produits depuis le catalogue pour préparer votre demande.</p>
          <Link to="/catalogue" className="btn btn-primary">Parcourir le catalogue</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="pb-nav">
      <div className="appbar"><div className="bar-title">Mon devis</div></div>
      <div className="pad">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span className="label" style={{ color: 'var(--muted)' }}>{ids.length} produit{ids.length > 1 ? 's' : ''}</span>
          <span className="sh-link" style={{ cursor: 'pointer' }} onClick={clear}>Vider</span>
        </div>

        <div className="devis-list">
          {lines.map((l) => (
            <div key={l.id} className="devis-row card">
              <div className="devis-info">
                <div className="pc-name">{l.name}</div>
                <div className="label" style={{ color: 'var(--muted)' }}>{l.format}</div>
              </div>
              <QtyStepper qty={l.qty} onChange={(q) => setQty(l.id, q)} />
              <button className="devis-del" aria-label="Retirer" onClick={() => remove(l.id)}><Icon name="x" size={18} /></button>
            </div>
          ))}
        </div>

        <div className="devis-form">
          <label className="field-label">Nom</label>
          <input className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder="Votre nom" />
          <label className="field-label" style={{ marginTop: 12 }}>Téléphone</label>
          <input className="field" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Votre numéro" />
          <label className="field-label" style={{ marginTop: 12 }}>Note</label>
          <textarea className="field" rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Précisions (chantier, délais…)" />
        </div>

        <a className="btn btn-wa btn-block btn-lg" style={{ marginTop: 18 }} href={waUrl} target="_blank" rel="noopener">
          <Icon name="wa" size={20} /> Envoyer sur WhatsApp
        </a>
      </div>
    </div>
  )
}
```

Ajouter à `styles.css` : `.devis-list`, `.devis-row` (flex align center gap, padding), `.devis-info` (flex:1), `.devis-del`, `.devis-form`, `.empty-title`.

- [ ] **Step 2 : Vérifier** : `bun run dev`. Ajouter des produits au devis depuis le catalogue, ouvrir `/devis` → liste + quantités modifiables, suppression, vider. Remplir nom/tél/note → le lien WhatsApp contient les lignes + coordonnées. Devis vide → état vide. La persistance survit au rechargement (localStorage). Arrêter.

- [ ] **Step 3 : Commit**

```bash
git add src/routes/devis.tsx src/styles.css
git commit -m "feat: devis page with quantities and WhatsApp submission"
```

---

### Task 15 : Page Contact (`/contact`)

**Files:**
- Create: `src/routes/contact.tsx`

- [ ] **Step 1 : Écrire `src/routes/contact.tsx`**

```tsx
import { createFileRoute } from '@tanstack/react-router'
import { getSettings } from '#/lib/catalog'
import { Icon } from '#/components/Icon'
import { buildWaUrl } from '#/lib/wa'

export const Route = createFileRoute('/contact')({
  loader: async () => ({ settings: await getSettings() }),
  component: Contact,
})

function Contact() {
  const { settings } = Route.useLoaderData()
  const wa = settings.whatsapp_number ?? ''
  return (
    <div className="pb-nav">
      <div className="appbar"><div className="bar-title">Contact</div></div>
      <div className="pad">
        <div className="card contact-card">
          <div className="contact-row"><Icon name="phone" size={20} /><span>{settings.contact_phone ?? ''}</span></div>
          <div className="contact-row"><Icon name="doc" size={20} /><span>{settings.contact_email ?? ''}</span></div>
          <div className="contact-row"><Icon name="pin" size={20} /><span>{settings.contact_address ?? ''}</span></div>
        </div>
        <a className="btn btn-wa btn-block btn-lg" style={{ marginTop: 18 }} href={buildWaUrl(wa, 'Bonjour NSDPF,')} target="_blank" rel="noopener">
          <Icon name="wa" size={20} /> Discuter sur WhatsApp
        </a>
      </div>
    </div>
  )
}
```

Ajouter à `styles.css` : `.contact-card`, `.contact-row` (flex gap, padding, séparateur).

- [ ] **Step 2 : Vérifier** : `bun run dev`, `/contact` → coordonnées depuis settings + bouton WhatsApp. Arrêter.

- [ ] **Step 3 : Commit**

```bash
git add src/routes/contact.tsx src/styles.css
git commit -m "feat: contact page"
```

---

### Task 16 : Passe finale — responsive, tests, build

**Files:** divers (ajustements)

- [ ] **Step 1 : Lancer toute la suite de tests** : `bun run test` → tous PASS (schema, wa, devis-store).

- [ ] **Step 2 : Vérifier types + lint** : `bunx tsc --noEmit` → 0 erreur ; `bun run lint` → 0 erreur (corriger le cas échéant).

- [ ] **Step 3 : Vérifier le build de production** : `bun run build` → succès (le bundle SSR Worker compile, y compris les routes serveur et `cloudflare:workers`).

- [ ] **Step 4 : Revue responsive manuelle** : `bun run dev`, tester en largeur mobile (<400px) ET desktop (>1100px) : bottom-nav vs top-nav, hero, grilles (2 col mobile / 4 desktop), fiche produit, devis. Corriger les débordements éventuels dans `styles.css`. Arrêter.

- [ ] **Step 5 : Commit final**

```bash
git add -A
git commit -m "chore: responsive polish and final verification for public catalogue"
```

---

## Self-Review — couverture du spec (sections 5, 6, 7, 8, 9)

- **Routes publiques** (`/`, `/catalogue`, `/produit/$slug`, `/devis`, `/contact`) (spec §5) : Tasks 11–15 ✓
- **Service d'images R2 `/img/$key`** (spec §8) : Task 4 ✓
- **Couche d'accès D1 (loaders)** (spec §2, §3) : Task 3 ✓
- **Nav responsive bottom/top + thème industriel** (spec §6) : Tasks 2, 9 ✓
- **Devis localStorage + WhatsApp** (spec §7) : Tasks 8, 13, 14 ✓
- **Seed 15 produits + 4 catégories + settings** (spec §9) : Task 5 ✓
- **Upload + mapping 38 images** (spec §9) : Task 6 ✓
- **Tests** (spec §11) : Task 8 (wa, devis-store) + Task 16 ✓

Hors périmètre (Plan 3) : back-office d'administration (CRUD produits/catégories/vedettes, upload images via UI, édition settings). Le déploiement distant (Plan 1 Task 9, + `--remote` pour seed/images) reste à déclencher quand le rendu local est validé.

> **Remarque d'exécution :** plusieurs étapes notent « adapter à l'API réellement installée » pour TanStack Start/Router (signatures `createServerFn`, handlers de route serveur, `createRootRoute`). L'implémenteur DOIT vérifier la version présente (`src/routes/api/auth/$.ts` pour un handler serveur existant ; la doc TanStack installée) avant d'écrire, plutôt que de présumer.
