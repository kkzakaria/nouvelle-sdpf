# NSDPF — Plan 1 : Fondations (D1 / R2 / better-auth) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrer le scaffold TanStack Start du SQLite local vers Cloudflare D1 + R2 + better-auth persistant, avec le schéma complet du catalogue, des migrations appliquées et un compte admin de connexion fonctionnel.

**Architecture :** TanStack Start (React 19) sur Cloudflare Workers via `@cloudflare/vite-plugin`. Les bindings (`DB` = D1, `IMAGES` = R2) sont accédés par `import { env } from "cloudflare:workers"`. Drizzle (`drizzle-orm/d1`) parle à D1. better-auth utilise `drizzleAdapter` sur la même base. Les migrations sont générées par `drizzle-kit generate` et appliquées par `wrangler d1 migrations apply`.

**Tech Stack :** TanStack Start, React 19, Cloudflare Workers/D1/R2, drizzle-orm + drizzle-kit, better-auth, Vitest, wrangler, bun.

**Périmètre :** Ceci est le **Plan 1 sur 3**. Il livre une application déployable avec base de données + authentification, mais sans pages catalogue (Plan 2) ni back-office (Plan 3). Le « logiciel testable » produit ici = migrations qui s'appliquent, dev server qui démarre, inscription/connexion admin qui fonctionne.

---

## Fichiers concernés

- `wrangler.jsonc` — nom du Worker + bindings D1/R2 (modifié)
- `worker-configuration.d.ts` — types des bindings, généré par `wrangler types` (créé)
- `src/db/schema.ts` — tables auth + catalogue (réécrit)
- `src/db/index.ts` — instance drizzle sur D1 (réécrit)
- `src/lib/auth.ts` — better-auth + drizzleAdapter (réécrit)
- `drizzle.config.ts` — dialecte sqlite, sortie `migrations/` (modifié)
- `migrations/` — SQL généré par drizzle-kit (créé)
- `scripts/create-admin.ts` — création du compte admin via l'API better-auth (créé)
- `src/db/schema.test.ts` — test de fumée du schéma (créé)
- Suppression : `src/routes/demo/`, `src/hooks/demo.*`, `src/components/demo.FormComponents.tsx`, `src/routes/index.tsx` & `src/routes/about.tsx` (contenu starter) seront nettoyés dans le Plan 2 ; ici on supprime seulement les démos qui cassent le build D1.

---

### Task 1 : Provisionner D1 et R2, supprimer les démos qui dépendent de better-sqlite3

**Files:**
- Delete: `src/routes/demo/drizzle.tsx`, `src/routes/demo/better-auth.tsx`, `src/routes/demo/form.address.tsx`, `src/routes/demo/form.simple.tsx`
- Delete: `src/hooks/demo.form.ts`, `src/hooks/demo.form-context.ts`, `src/components/demo.FormComponents.tsx`

- [ ] **Step 1 : Créer la base D1**

Run: `bunx wrangler d1 create nsdpf-db`
Expected: sortie indiquant `database_id` (un UUID). **Noter ce `database_id`**, il sert à la Task 2.

- [ ] **Step 2 : Créer le bucket R2**

Run: `bunx wrangler r2 bucket create nsdpf-images`
Expected: `Created bucket 'nsdpf-images'`.
(Si R2 n'est pas activé sur le compte, l'activer dans le dashboard Cloudflare puis relancer.)

- [ ] **Step 3 : Supprimer les routes et fichiers de démo**

```bash
rm -rf src/routes/demo
rm -f src/hooks/demo.form.ts src/hooks/demo.form-context.ts src/components/demo.FormComponents.tsx
```

- [ ] **Step 4 : Régénérer l'arbre des routes**

Run: `bun run generate-routes`
Expected: succès, `src/routeTree.gen.ts` ne référence plus `/demo/*`.

- [ ] **Step 5 : Commit**

```bash
git add -A
git commit -m "chore: provision D1/R2 and remove starter demos"
```

---

### Task 2 : Configurer wrangler.jsonc avec les bindings D1 et R2

**Files:**
- Modify: `wrangler.jsonc`

- [ ] **Step 1 : Réécrire `wrangler.jsonc`**

Remplacer tout le fichier par (mettre le vrai `database_id` de la Task 1) :

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "nouvelle-sdpf",
  "compatibility_date": "2025-09-02",
  "compatibility_flags": ["nodejs_compat"],
  "main": "@tanstack/react-start/server-entry",
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "nsdpf-db",
      "database_id": "<DATABASE_ID_DE_LA_TASK_1>",
      "migrations_dir": "migrations"
    }
  ],
  "r2_buckets": [
    {
      "binding": "IMAGES",
      "bucket_name": "nsdpf-images"
    }
  ]
}
```

- [ ] **Step 2 : Générer les types des bindings**

Run: `bunx wrangler types`
Expected: crée/maj `worker-configuration.d.ts` avec une interface `Env` exposant `DB: D1Database` et `IMAGES: R2Bucket`.

- [ ] **Step 3 : Vérifier que le fichier de types est référencé**

Run: `cat tsconfig.json`
Si `worker-configuration.d.ts` n'est pas inclus par `include`, l'ajouter (la plupart des configs `"include": ["**/*.ts", ...]` le couvrent déjà à la racine). Aucune action si déjà couvert.

- [ ] **Step 4 : Commit**

```bash
git add wrangler.jsonc worker-configuration.d.ts tsconfig.json
git commit -m "feat: add D1 and R2 bindings to wrangler config"
```

---

### Task 3 : Définir le schéma drizzle (auth + catalogue)

**Files:**
- Rewrite: `src/db/schema.ts`

- [ ] **Step 1 : Réécrire `src/db/schema.ts`**

```typescript
import { sql } from 'drizzle-orm'
import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core'

/* ---------- better-auth ---------- */

export const user = sqliteTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: integer('email_verified', { mode: 'boolean' })
    .default(false)
    .notNull(),
  image: text('image'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .notNull(),
})

export const session = sqliteTable(
  'session',
  {
    id: text('id').primaryKey(),
    expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
    token: text('token').notNull().unique(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
  },
  (table) => [index('session_userId_idx').on(table.userId)],
)

export const account = sqliteTable(
  'account',
  {
    id: text('id').primaryKey(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: integer('access_token_expires_at', { mode: 'timestamp_ms' }),
    refreshTokenExpiresAt: integer('refresh_token_expires_at', { mode: 'timestamp_ms' }),
    scope: text('scope'),
    password: text('password'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => [index('account_userId_idx').on(table.userId)],
)

export const verification = sqliteTable(
  'verification',
  {
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
  },
  (table) => [index('verification_identifier_idx').on(table.identifier)],
)

/* ---------- catalogue ---------- */

export const categories = sqliteTable('categories', {
  id: text('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  label: text('label').notNull(),
  short: text('short').notNull(),
  description: text('description').notNull().default(''),
  sortOrder: integer('sort_order').notNull().default(0),
})

export const products = sqliteTable(
  'products',
  {
    id: text('id').primaryKey(),
    slug: text('slug').notNull().unique(),
    categoryId: text('category_id')
      .notNull()
      .references(() => categories.id, { onDelete: 'restrict' }),
    name: text('name').notNull(),
    format: text('format').notNull().default(''),
    descShort: text('desc_short').notNull().default(''),
    descLong: text('desc_long').notNull().default(''),
    featured: integer('featured', { mode: 'boolean' }).notNull().default(false),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
  },
  (table) => [index('products_categoryId_idx').on(table.categoryId)],
)

export const productImages = sqliteTable(
  'product_images',
  {
    id: text('id').primaryKey(),
    productId: text('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    r2Key: text('r2_key').notNull(),
    alt: text('alt').notNull().default(''),
    sortOrder: integer('sort_order').notNull().default(0),
  },
  (table) => [index('product_images_productId_idx').on(table.productId)],
)

export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull().default(''),
})
```

- [ ] **Step 2 : Vérifier la compilation des types**

Run: `bunx tsc --noEmit`
Expected: aucune erreur dans `src/db/schema.ts` (des erreurs peuvent subsister ailleurs ; elles seront corrigées aux tasks suivantes).

- [ ] **Step 3 : Commit**

```bash
git add src/db/schema.ts
git commit -m "feat: define auth and catalogue drizzle schema"
```

---

### Task 4 : Brancher drizzle sur D1

**Files:**
- Rewrite: `src/db/index.ts`

- [ ] **Step 1 : Réécrire `src/db/index.ts`**

```typescript
import { drizzle } from 'drizzle-orm/d1'
import { env } from 'cloudflare:workers'

import * as schema from './schema.ts'

export const db = drizzle(env.DB, { schema })
```

- [ ] **Step 2 : Vérifier les types**

Run: `bunx tsc --noEmit`
Expected: `src/db/index.ts` compile (`env.DB` est typé `D1Database` grâce à `worker-configuration.d.ts`).

- [ ] **Step 3 : Commit**

```bash
git add src/db/index.ts
git commit -m "feat: wire drizzle to D1 binding"
```

---

### Task 5 : Configurer drizzle-kit pour générer les migrations

**Files:**
- Modify: `drizzle.config.ts`

- [ ] **Step 1 : Réécrire `drizzle.config.ts`**

```typescript
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './migrations',
  dialect: 'sqlite',
})
```

- [ ] **Step 2 : Générer la migration initiale**

Run: `bun run db:generate`
Expected: crée `migrations/0000_*.sql` + `migrations/meta/`. Le SQL contient `CREATE TABLE user`, `session`, `account`, `verification`, `categories`, `products`, `product_images`, `settings`.

- [ ] **Step 3 : Appliquer la migration en local**

Run: `bunx wrangler d1 migrations apply nsdpf-db --local`
Expected: `Migrations applied successfully`. (Le `--local` cible la base SQLite locale dans `.wrangler/`.)

- [ ] **Step 4 : Vérifier les tables créées en local**

Run: `bunx wrangler d1 execute nsdpf-db --local --command "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"`
Expected: liste incluant `account`, `categories`, `product_images`, `products`, `session`, `settings`, `user`, `verification`.

- [ ] **Step 5 : Commit**

```bash
git add drizzle.config.ts migrations
git commit -m "feat: generate initial D1 migration"
```

---

### Task 6 : Brancher better-auth sur D1 via drizzleAdapter

**Files:**
- Rewrite: `src/lib/auth.ts`

- [ ] **Step 1 : Réécrire `src/lib/auth.ts`**

```typescript
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { tanstackStartCookies } from 'better-auth/tanstack-start'
import { env } from 'cloudflare:workers'

import { db } from '#/db/index'
import * as schema from '#/db/schema'

export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: 'sqlite',
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [tanstackStartCookies()],
})
```

- [ ] **Step 2 : Déclarer les vars d'environnement attendues**

Ajouter dans `wrangler.jsonc` une section `vars` pour `BETTER_AUTH_URL` (non secret) :

```jsonc
  "vars": {
    "BETTER_AUTH_URL": "http://localhost:3000"
  }
```

(En production, mettre à jour cette valeur avec l'URL déployée ; `BETTER_AUTH_SECRET` sera un secret, posé à la Task 8.)

- [ ] **Step 3 : Régénérer les types**

Run: `bunx wrangler types`
Expected: `Env` inclut désormais `BETTER_AUTH_URL: string`. (`BETTER_AUTH_SECRET` sera ajouté manuellement ou apparaîtra après `wrangler secret put` ; si `tsc` se plaint, ajouter `BETTER_AUTH_SECRET: string` à l'interface `Env` dans `worker-configuration.d.ts` ou via un `.dev.vars`.)

- [ ] **Step 4 : Fournir le secret en dev via `.dev.vars`**

Créer `.dev.vars` (déjà ignoré par git via `.gitignore` — vérifier ; sinon l'ajouter) :

```
BETTER_AUTH_SECRET=dev-secret-change-me-0123456789abcdef
```

Run pour vérifier l'ignore: `git check-ignore .dev.vars`
Expected: affiche `.dev.vars`. Sinon : `echo ".dev.vars" >> .gitignore`.

- [ ] **Step 5 : Vérifier les types**

Run: `bunx tsc --noEmit`
Expected: `src/lib/auth.ts` compile.

- [ ] **Step 6 : Commit**

```bash
git add src/lib/auth.ts wrangler.jsonc worker-configuration.d.ts .gitignore
git commit -m "feat: connect better-auth to D1 via drizzle adapter"
```

---

### Task 7 : Test de fumée du schéma + démarrage du dev server

**Files:**
- Create: `src/db/schema.test.ts`

- [ ] **Step 1 : Écrire le test de fumée**

Ce test vérifie que le schéma exporte les tables attendues avec les bons noms (sans toucher à D1 — pas d'I/O, juste la forme du schéma).

```typescript
import { describe, it, expect } from 'vitest'
import { getTableConfig } from 'drizzle-orm/sqlite-core'
import * as schema from './schema'

describe('schema', () => {
  it('expose les tables du catalogue avec les bons noms SQL', () => {
    expect(getTableConfig(schema.categories).name).toBe('categories')
    expect(getTableConfig(schema.products).name).toBe('products')
    expect(getTableConfig(schema.productImages).name).toBe('product_images')
    expect(getTableConfig(schema.settings).name).toBe('settings')
  })

  it('products a une FK category_id et un flag featured', () => {
    const cols = getTableConfig(schema.products).columns.map((c) => c.name)
    expect(cols).toContain('category_id')
    expect(cols).toContain('featured')
    expect(cols).toContain('slug')
  })

  it('expose les tables better-auth', () => {
    expect(getTableConfig(schema.user).name).toBe('user')
    expect(getTableConfig(schema.session).name).toBe('session')
    expect(getTableConfig(schema.account).name).toBe('account')
    expect(getTableConfig(schema.verification).name).toBe('verification')
  })
})
```

- [ ] **Step 2 : Lancer le test, vérifier qu'il passe**

Run: `bun run test`
Expected: les 3 tests de `schema.test.ts` PASS.

- [ ] **Step 3 : Démarrer le dev server et vérifier qu'il boote**

Run (en arrière-plan, ~10 s) : `bun run dev`
Expected: Vite démarre sur `http://localhost:3000` sans erreur d'import (`cloudflare:workers`, `drizzle-orm/d1`, `better-auth` résolus). Arrêter ensuite le serveur.

- [ ] **Step 4 : Commit**

```bash
git add src/db/schema.test.ts
git commit -m "test: add schema smoke test"
```

---

### Task 8 : Script de création du compte admin + vérification de connexion

**Files:**
- Create: `scripts/create-admin.ts`

- [ ] **Step 1 : Écrire le script de création d'admin**

Ce script appelle l'endpoint d'inscription better-auth du dev server local (le plus simple et fiable, car better-auth gère le hash du mot de passe et l'insertion). Identifiants **temporaires à changer**.

```typescript
/**
 * Crée le compte admin initial via l'API better-auth du dev server.
 * Prérequis : `bun run dev` doit tourner sur http://localhost:3000.
 * Identifiants temporaires — à changer après la première connexion.
 */
const BASE = process.env.BETTER_AUTH_URL ?? 'http://localhost:3000'
const EMAIL = process.env.ADMIN_EMAIL ?? 'admin@nsdpf.local'
const PASSWORD = process.env.ADMIN_PASSWORD ?? 'ChangeMoi!2026'

async function main() {
  const res = await fetch(`${BASE}/api/auth/sign-up/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Admin NSDPF', email: EMAIL, password: PASSWORD }),
  })
  const body = await res.text()
  if (!res.ok) {
    console.error(`Échec (${res.status}): ${body}`)
    process.exit(1)
  }
  console.log(`Compte admin créé : ${EMAIL} (mot de passe temporaire : ${PASSWORD})`)
  console.log('⚠️  Changez ce mot de passe après la première connexion.')
}

main()
```

- [ ] **Step 2 : Démarrer le dev server**

Run (arrière-plan) : `bun run dev`
Expected: serveur up sur `http://localhost:3000`.

- [ ] **Step 3 : Exécuter le script de création d'admin**

Run: `bun run scripts/create-admin.ts`
Expected: `Compte admin créé : admin@nsdpf.local ...`.

- [ ] **Step 4 : Vérifier la persistance en base locale**

Run: `bunx wrangler d1 execute nsdpf-db --local --command "SELECT email FROM user"`
Expected: une ligne avec `admin@nsdpf.local`. (Confirme que better-auth écrit bien dans D1.)

- [ ] **Step 5 : Vérifier la connexion**

Run: `curl -i -s -X POST http://localhost:3000/api/auth/sign-in/email -H "Content-Type: application/json" -d '{"email":"admin@nsdpf.local","password":"ChangeMoi!2026"}'`
Expected: HTTP `200` et un en-tête `Set-Cookie` de session. Arrêter le dev server.

- [ ] **Step 6 : Commit**

```bash
git add scripts/create-admin.ts
git commit -m "feat: add admin account creation script"
```

---

### Task 9 : Appliquer les migrations en distant + déploiement de vérification

**Files:** aucun (opérations de déploiement)

- [ ] **Step 1 : Poser le secret better-auth en production**

Run: `bunx wrangler secret put BETTER_AUTH_SECRET`
Expected: invite à saisir une valeur — coller une chaîne aléatoire forte (`openssl rand -base64 32`).

- [ ] **Step 2 : Appliquer les migrations sur la D1 distante**

Run: `bunx wrangler d1 migrations apply nsdpf-db --remote`
Expected: `Migrations applied successfully` sur la base distante.

- [ ] **Step 3 : Build + déploiement**

Run: `bun run deploy`
Expected: build Vite OK puis `wrangler deploy` publie le Worker ; l'URL `*.workers.dev` est affichée.

- [ ] **Step 4 : Vérifier l'endpoint auth en production**

Run: `curl -i -s -X POST https://<URL-DEPLOYEE>/api/auth/sign-up/email -H "Content-Type: application/json" -d '{"name":"Admin","email":"admin@nsdpf.local","password":"ChangeMoi!2026"}'`
Expected: HTTP `200`. (Confirme D1 distant + auth en prod. Mettre à jour `BETTER_AUTH_URL` dans `wrangler.jsonc` avec l'URL de prod puis redéployer si l'inscription échoue pour cause de baseURL.)

- [ ] **Step 5 : Commit (si `wrangler.jsonc` a changé)**

```bash
git add wrangler.jsonc
git commit -m "chore: set production BETTER_AUTH_URL"
```

---

## Self-Review — couverture du spec (sections 3, 4, 10)

- **Migration scaffold → D1/R2** (spec §3) : Tasks 1, 2, 4 ✓
- **Modèle de données complet** (spec §4) : Task 3 (toutes les tables) + Task 5 (migration) ✓
- **better-auth sur D1** (spec §3) : Task 6 ✓
- **Compte admin temporaire** (spec §9.3) : Task 8 ✓
- **Déploiement + secret + migrations distantes** (spec §10) : Task 9 ✓
- **Tests** (spec §11) : Task 7 (schéma) ; les tests devis/WhatsApp/server functions relèvent des Plans 2 et 3.

Hors périmètre de ce plan (couverts plus tard) : pages publiques, seed des 15 produits + 38 images, service d'images `/img/$key`, back-office. → **Plan 2** (catalogue public + seed) puis **Plan 3** (admin).
