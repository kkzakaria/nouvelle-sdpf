# NSDPF Admin Back-Office Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the password-protected `/admin` back-office (dashboard, products CRUD + images, categories CRUD, contact settings) for the NSDPF catalogue, per spec sections 4–5.

**Architecture:** Pages under `/admin/_authed/*` are protected by a `beforeLoad` guard that calls a better-auth session server function and redirects to `/admin/login` when there is no session. All mutations are TanStack Start `createServerFn({ method: 'POST' })` handlers that call `requireAdmin()` (server-side session re-validation) before touching D1/R2. The public `AppShell` (TopNav/BottomNav/Footer) is bypassed on `/admin` routes; admin pages use their own `AdminLayout`. Reads/mutations use the existing `db` (drizzle-orm/d1) and `env.IMAGES` (R2) bindings.

**Tech Stack:** TanStack Start 1.168 (React 19), TanStack Router (file-based), better-auth 1.5 (`better-auth/react` client), drizzle-orm/d1, Cloudflare Workers (D1 `env.DB`, R2 `env.IMAGES`), zod 4, Vitest. No new dependencies.

---

## Context the implementer must know (read before Task 1)

**Established patterns in this repo — follow them, do not reinvent:**

- **Path alias:** `#/...` maps to `src/...` (e.g. `#/db/index`, `#/lib/auth`). Use it in every import.
- **Server functions** live in `src/lib/*.ts` and are written as:
  ```ts
  import { createServerFn } from '@tanstack/react-start'
  export const getCategories = createServerFn({ method: 'GET' }).handler(async () => {
    return db.select().from(categories).orderBy(asc(categories.sortOrder))
  })
  ```
  Input validation uses `.inputValidator((d: T) => d)` then `.handler(async ({ data }) => ...)`.
- **DB access:** `import { db } from '#/db/index'` — a `drizzle(env.DB, { schema })` instance. Tables: `import { categories, products, productImages, settings, user } from '#/db/schema'`. Drizzle query builders come from `drizzle-orm` (`asc`, `eq`, `and`, `count`, `max`, `sql`).
- **R2 / env bindings:** `import { env } from 'cloudflare:workers'` → `env.IMAGES` (R2 bucket), `env.DB` (already wrapped by `db`). Works in dev because `@cloudflare/vite-plugin` provides the bindings.
- **Public image route** `src/routes/img.$.tsx` only serves keys under `products/` or `library/` and rejects keys containing `..`. Therefore admin image keys MUST start with `products/`.
- **Routes** are file-based under `src/routes/`. Mixed style exists: flat dotted (`produit.$slug.tsx`) and directories (`api/auth/$.ts`). We use a directory `src/routes/admin/` with a **pathless** `_authed` layout segment so `/admin/login` stays public while `/admin`, `/admin/produits`, etc. are guarded. A file at `src/routes/admin/_authed/index.tsx` resolves to the path `/admin` (the `_authed` segment contributes no URL path).
- **Existing components** use plain controlled `useState` inputs (see `src/routes/index.tsx`). Do NOT pull in `@tanstack/react-form`; match the existing plain-React style.
- **IDs:** the catalogue seed uses human-readable `id === slug` for products/categories. New product/category IDs follow the same convention (slug as id). Image rows use `crypto.randomUUID()` (available in the Workers runtime). No `ulid`/`nanoid` dependency exists; do not add one.
- **Tests** live beside source as `src/**/*.test.{ts,tsx}` and run with `npm run test` (Vitest, `environment: 'node'`). Existing examples: `src/lib/wa.test.ts`, `src/lib/devis-store.test.tsx`, `src/db/schema.test.ts`. Server functions that touch `db`/`env` are NOT unit-tested (no Workers harness); they are verified via the dev server + the final E2E walkthrough. Pure helpers ARE unit-tested.

**Verified facts (already type-checked against installed packages — trust these signatures):**

- `import { getRequest } from '@tanstack/react-start/server'` → `getRequest(): Request`.
- `import { auth } from '#/lib/auth'` → `await auth.api.getSession({ headers: getRequest().headers })` returns `{ user: { email: string, ... }, session: {...} } | null`.
- `import { createAuthClient } from 'better-auth/react'` → `const c = createAuthClient()`; client exposes `c.signIn.email({ email, password })` (returns `{ data, error }`), `c.signOut()`, `c.useSession()`.
- `import { redirect } from '@tanstack/react-router'` for guard redirects.

**Quality gate command (run at the end of every task before committing):**
```bash
npx tsc --noEmit -p tsconfig.json && npm run lint && npm run test
```
Expected: tsc exit 0, eslint no errors, all tests pass.

**Branch:** Work on a feature branch, not `main`. First step of Task 1 creates it.

---

## File structure (what each new/changed file is responsible for)

**New — lib (logic & server functions):**
- `src/lib/slug.ts` — `slugify(name)` pure helper. *(Task 1)*
- `src/lib/admin-schemas.ts` — zod input schemas + inferred types for product/category/settings. *(Task 2)*
- `src/lib/admin-auth.ts` — `requireAdmin()` server-side guard + `getAdminSession` server fn. *(Task 3)*
- `src/lib/auth-client.ts` — browser better-auth client (sign in/out). *(Task 3)*
- `src/lib/admin-categories.ts` — category list/create/update/delete server fns. *(Task 5)*
- `src/lib/admin-products.ts` — product list/get/create/update/delete/toggle-featured server fns + `uniqueSlug`. *(Task 6)*
- `src/lib/admin-images.ts` — product image upload/delete/reorder server fns. *(Task 7)*
- `src/lib/admin-settings.ts` — settings upsert server fn. *(Task 9)*

**New — components:**
- `src/components/admin/AdminLayout.tsx` — sidebar shell + logout for guarded admin pages. *(Task 4)*
- `src/components/admin/ProductForm.tsx` — product create/edit form incl. image manager. *(Task 8)*

**New — routes:**
- `src/routes/admin/login.tsx` — `/admin/login` (public). *(Task 4)*
- `src/routes/admin/_authed.tsx` — pathless guarded layout. *(Task 4)*
- `src/routes/admin/_authed/index.tsx` — `/admin` dashboard. *(Task 4)*
- `src/routes/admin/_authed/categories.tsx` — `/admin/categories`. *(Task 5)*
- `src/routes/admin/_authed/produits.tsx` — `/admin/produits` list. *(Task 8)*
- `src/routes/admin/_authed/produits.$id.tsx` — `/admin/produits/$id` create/edit. *(Task 8)*
- `src/routes/admin/_authed/parametres.tsx` — `/admin/parametres`. *(Task 9)*

**Modified:**
- `src/routes/__root.tsx` — bypass public `AppShell` when pathname starts with `/admin`. *(Task 4)*
- `src/styles.css` — append admin styles (`.admin`, `.admin-side`, `.admin-main`, `.admin-card`, `.admin-table`, `.admin-field`, form/button helpers). *(Task 4, extended in 8/9)*

---

## Task 1: Slug helper

**Files:**
- Create: `src/lib/slug.ts`
- Test: `src/lib/slug.test.ts`

- [ ] **Step 1: Create the feature branch**

```bash
cd /home/pioupiou/codes/nouvelle-sdpf
git checkout -b feat/admin-back-office
```

- [ ] **Step 2: Write the failing test**

Create `src/lib/slug.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { slugify } from './slug'

describe('slugify', () => {
  it('lowercases and hyphenates words', () => {
    expect(slugify('Plaque BA13')).toBe('plaque-ba13')
  })
  it('strips accents', () => {
    expect(slugify('Plâtre de Finition')).toBe('platre-de-finition')
  })
  it('collapses non-alphanumerics and trims hyphens', () => {
    expect(slugify('  Multi  ///  Usage!! ')).toBe('multi-usage')
  })
  it('falls back to "produit" when empty', () => {
    expect(slugify('   ***   ')).toBe('produit')
  })
  it('caps length at 60 characters', () => {
    expect(slugify('a'.repeat(80)).length).toBe(60)
  })
})
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npx vitest run src/lib/slug.test.ts`
Expected: FAIL — `Failed to resolve import "./slug"` / `slugify is not a function`.

- [ ] **Step 4: Write the implementation**

Create `src/lib/slug.ts`:

```ts
/** Convertit un libellé en slug URL : minuscules, sans accents, tirets. */
export function slugify(input: string): string {
  const s = input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // retire les diacritiques
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/g, '') // un éventuel tiret laissé par la troncature
  return s || 'produit'
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx vitest run src/lib/slug.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 6: Quality gate + commit**

```bash
npx tsc --noEmit -p tsconfig.json && npm run lint && npm run test
git add src/lib/slug.ts src/lib/slug.test.ts
git commit -m "feat(admin): add slugify helper"
```

---

## Task 2: Zod input schemas

**Files:**
- Create: `src/lib/admin-schemas.ts`
- Test: `src/lib/admin-schemas.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/admin-schemas.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import {
  productInput,
  categoryInput,
  settingsInput,
} from './admin-schemas'

describe('productInput', () => {
  it('accepts a minimal valid product and applies defaults', () => {
    const r = productInput.parse({ name: 'Plâtre', categoryId: 'platres' })
    expect(r.name).toBe('Plâtre')
    expect(r.format).toBe('')
    expect(r.featured).toBe(false)
    expect(r.sortOrder).toBe(0)
  })
  it('rejects an empty name', () => {
    expect(() => productInput.parse({ name: '  ', categoryId: 'platres' })).toThrow()
  })
  it('rejects a missing category', () => {
    expect(() => productInput.parse({ name: 'X', categoryId: '' })).toThrow()
  })
  it('rejects a malformed explicit slug', () => {
    expect(() =>
      productInput.parse({ name: 'X', categoryId: 'c', slug: 'Bad Slug' }),
    ).toThrow()
  })
})

describe('categoryInput', () => {
  it('accepts a valid category', () => {
    const r = categoryInput.parse({ label: 'Plâtres', short: 'Plâtres & enduits' })
    expect(r.label).toBe('Plâtres')
    expect(r.description).toBe('')
  })
  it('rejects an empty label', () => {
    expect(() => categoryInput.parse({ label: '', short: 'x' })).toThrow()
  })
})

describe('settingsInput', () => {
  it('fills all keys with empty defaults', () => {
    const r = settingsInput.parse({})
    expect(r).toEqual({
      whatsapp_number: '',
      contact_phone: '',
      contact_phone_call: '',
      contact_email: '',
      contact_address: '',
    })
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/lib/admin-schemas.test.ts`
Expected: FAIL — cannot resolve `./admin-schemas`.

- [ ] **Step 3: Write the implementation**

Create `src/lib/admin-schemas.ts`:

```ts
import { z } from 'zod'

const slugRule = z
  .string()
  .trim()
  .regex(/^[a-z0-9-]+$/, 'Slug invalide (a-z, 0-9, tirets)')

export const productInput = z.object({
  name: z.string().trim().min(1, 'Nom requis').max(120),
  categoryId: z.string().trim().min(1, 'Catégorie requise'),
  slug: slugRule.optional(),
  format: z.string().trim().max(120).default(''),
  descShort: z.string().trim().max(400).default(''),
  descLong: z.string().trim().max(4000).default(''),
  featured: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
})
export type ProductInput = z.infer<typeof productInput>

export const productUpdate = productInput.extend({
  id: z.string().trim().min(1),
})
export type ProductUpdate = z.infer<typeof productUpdate>

export const categoryInput = z.object({
  label: z.string().trim().min(1, 'Libellé requis').max(80),
  short: z.string().trim().min(1, 'Sous-titre requis').max(120),
  slug: slugRule.optional(),
  description: z.string().trim().max(2000).default(''),
  sortOrder: z.number().int().default(0),
})
export type CategoryInput = z.infer<typeof categoryInput>

export const categoryUpdate = categoryInput.extend({
  id: z.string().trim().min(1),
})
export type CategoryUpdate = z.infer<typeof categoryUpdate>

export const settingsInput = z.object({
  whatsapp_number: z.string().trim().max(40).default(''),
  contact_phone: z.string().trim().max(40).default(''),
  contact_phone_call: z.string().trim().max(40).default(''),
  contact_email: z.string().trim().max(120).default(''),
  contact_address: z.string().trim().max(300).default(''),
})
export type SettingsInput = z.infer<typeof settingsInput>
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/lib/admin-schemas.test.ts`
Expected: PASS (7 tests).

- [ ] **Step 5: Quality gate + commit**

```bash
npx tsc --noEmit -p tsconfig.json && npm run lint && npm run test
git add src/lib/admin-schemas.ts src/lib/admin-schemas.test.ts
git commit -m "feat(admin): add zod input schemas for products, categories, settings"
```

---

## Task 3: Auth helpers (server guard + browser client)

**Files:**
- Create: `src/lib/admin-auth.ts`
- Create: `src/lib/auth-client.ts`

No unit test (both depend on the Workers/auth runtime); verified during Task 4's dev-server walkthrough. The quality gate (tsc/lint) still runs.

- [ ] **Step 1: Create the server-side guard + session server fn**

Create `src/lib/admin-auth.ts`:

```ts
import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { auth } from '#/lib/auth'

/**
 * À appeler en tête de chaque mutation admin : revalide la session côté
 * serveur. Lève une erreur si aucune session valide n'est présente.
 */
export async function requireAdmin() {
  const session = await auth.api.getSession({
    headers: getRequest().headers,
  })
  if (!session) throw new Error('UNAUTHORIZED')
  return session
}

/** Lue par le garde de route `beforeLoad`. Renvoie l'e-mail ou null. */
export const getAdminSession = createServerFn({ method: 'GET' }).handler(
  async () => {
    const session = await auth.api.getSession({
      headers: getRequest().headers,
    })
    return session ? { email: session.user.email } : null
  },
)
```

- [ ] **Step 2: Create the browser auth client**

Create `src/lib/auth-client.ts`:

```ts
import { createAuthClient } from 'better-auth/react'

// baseURL par défaut = origine courante ; l'app et l'API /api/auth sont
// servies depuis le même domaine.
export const authClient = createAuthClient()
```

- [ ] **Step 3: Quality gate + commit**

```bash
npx tsc --noEmit -p tsconfig.json && npm run lint && npm run test
git add src/lib/admin-auth.ts src/lib/auth-client.ts
git commit -m "feat(admin): add session guard server fn and browser auth client"
```

---

## Task 4: Admin shell, login, guard layout, dashboard

**Files:**
- Modify: `src/routes/__root.tsx`
- Create: `src/components/admin/AdminLayout.tsx`
- Create: `src/routes/admin/login.tsx`
- Create: `src/routes/admin/_authed.tsx`
- Create: `src/routes/admin/_authed/index.tsx`
- Modify: `src/styles.css` (append admin styles)

- [ ] **Step 1: Bypass the public AppShell on `/admin`**

In `src/routes/__root.tsx`, update the imports and `RootComponent`. Replace the existing `RootComponent` function with the version below, and add `useRouterState` to the `@tanstack/react-router` import.

Change the import line:
```ts
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
  useRouterState,
} from '@tanstack/react-router'
```

Replace `RootComponent`:
```tsx
function RootComponent() {
  const { settings } = Route.useLoaderData()
  const isAdmin = useRouterState({
    select: (s) => s.location.pathname.startsWith('/admin'),
  })
  if (isAdmin) return <Outlet />
  return (
    <DevisProvider>
      <AppShell settings={settings}>
        <Outlet />
      </AppShell>
    </DevisProvider>
  )
}
```

- [ ] **Step 2: Create the AdminLayout component**

Create `src/components/admin/AdminLayout.tsx`:

```tsx
import { Link, useNavigate } from '@tanstack/react-router'
import { authClient } from '#/lib/auth-client'

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
  async function logout() {
    await authClient.signOut()
    navigate({ to: '/admin/login' })
  }
  return (
    <div className="admin">
      <aside className="admin-side">
        <div className="admin-brand">NSDPF · Admin</div>
        <nav className="admin-nav">
          <Link
            to="/admin"
            activeOptions={{ exact: true }}
            activeProps={{ className: 'is-active' }}
          >
            Tableau de bord
          </Link>
          <Link to="/admin/produits" activeProps={{ className: 'is-active' }}>
            Produits
          </Link>
          <Link to="/admin/categories" activeProps={{ className: 'is-active' }}>
            Catégories
          </Link>
          <Link to="/admin/parametres" activeProps={{ className: 'is-active' }}>
            Paramètres
          </Link>
        </nav>
        <button className="btn admin-logout" onClick={logout} type="button">
          Déconnexion
        </button>
      </aside>
      <main className="admin-main">{children}</main>
    </div>
  )
}
```

- [ ] **Step 3: Create the public login route**

Create `src/routes/admin/login.tsx`:

```tsx
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { authClient } from '#/lib/auth-client'

export const Route = createFileRoute('/admin/login')({
  component: Login,
})

function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    const { error: err } = await authClient.signIn.email({ email, password })
    setBusy(false)
    if (err) {
      setError('Identifiants invalides.')
      return
    }
    navigate({ to: '/admin' })
  }

  return (
    <div className="admin-login">
      <form className="admin-card admin-login-card" onSubmit={submit}>
        <h1>Administration NSDPF</h1>
        <label className="admin-field">
          <span>E-mail</span>
          <input
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label className="admin-field">
          <span>Mot de passe</span>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        {error ? <p className="admin-error">{error}</p> : null}
        <button className="btn btn-brand" type="submit" disabled={busy}>
          {busy ? 'Connexion…' : 'Se connecter'}
        </button>
      </form>
    </div>
  )
}
```

- [ ] **Step 4: Create the guarded pathless layout**

Create `src/routes/admin/_authed.tsx`:

```tsx
import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'
import { getAdminSession } from '#/lib/admin-auth'
import { AdminLayout } from '#/components/admin/AdminLayout'

export const Route = createFileRoute('/admin/_authed')({
  beforeLoad: async () => {
    const session = await getAdminSession()
    if (!session) throw redirect({ to: '/admin/login' })
    return { adminEmail: session.email }
  },
  component: () => (
    <AdminLayout>
      <Outlet />
    </AdminLayout>
  ),
})
```

- [ ] **Step 5: Create the dashboard route**

Create `src/routes/admin/_authed/index.tsx`. It reuses the existing public read server fns `getProducts`/`getCategories` from `#/lib/catalog` for counts:

```tsx
import { createFileRoute, Link } from '@tanstack/react-router'
import { getCategories, getProducts } from '#/lib/catalog'

export const Route = createFileRoute('/admin/_authed/')({
  loader: async () => {
    const [categories, products] = await Promise.all([
      getCategories(),
      getProducts(),
    ])
    return {
      categoryCount: categories.length,
      productCount: products.length,
      featuredCount: products.filter((p) => p.featured).length,
    }
  },
  component: Dashboard,
})

function Dashboard() {
  const { categoryCount, productCount, featuredCount } = Route.useLoaderData()
  return (
    <div>
      <h1 className="admin-h1">Tableau de bord</h1>
      <div className="admin-stats">
        <Link to="/admin/produits" className="admin-card admin-stat">
          <span className="admin-stat-n">{productCount}</span>
          <span className="admin-stat-l">Produits</span>
        </Link>
        <Link to="/admin/categories" className="admin-card admin-stat">
          <span className="admin-stat-n">{categoryCount}</span>
          <span className="admin-stat-l">Catégories</span>
        </Link>
        <div className="admin-card admin-stat">
          <span className="admin-stat-n">{featuredCount}</span>
          <span className="admin-stat-l">Produits vedettes</span>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Append admin styles**

Append to the end of `src/styles.css`:

```css
/* ---------- Admin back-office ---------- */
.admin {
  display: grid;
  grid-template-columns: 240px 1fr;
  min-height: 100vh;
  background: #f4f6f8;
}
.admin-side {
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 22px 16px;
  background: #0f2740;
  color: #fff;
}
.admin-brand {
  font-family: 'Archivo', sans-serif;
  font-weight: 800;
  letter-spacing: 0.02em;
}
.admin-nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.admin-nav a {
  color: #cdd9e5;
  text-decoration: none;
  padding: 9px 12px;
  border-radius: 8px;
  font-weight: 600;
}
.admin-nav a:hover {
  background: rgba(255, 255, 255, 0.08);
}
.admin-nav a.is-active {
  background: #1e73ad;
  color: #fff;
}
.admin-logout {
  margin-top: auto;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}
.admin-main {
  padding: 28px clamp(16px, 4vw, 40px);
  max-width: 1000px;
}
.admin-h1 {
  font-family: 'Archivo', sans-serif;
  margin: 0 0 20px;
}
.admin-card {
  background: #fff;
  border: 1px solid #e3e8ee;
  border-radius: 12px;
  padding: 18px;
}
.admin-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 16px;
}
.admin-stat {
  display: flex;
  flex-direction: column;
  gap: 4px;
  text-decoration: none;
  color: inherit;
}
.admin-stat-n {
  font-size: 34px;
  font-weight: 800;
  font-family: 'Archivo', sans-serif;
  color: #1e73ad;
}
.admin-stat-l {
  color: #5a6b7b;
  font-weight: 600;
}
.admin-login {
  display: grid;
  place-items: center;
  min-height: 100vh;
  background: #0f2740;
  padding: 20px;
}
.admin-login-card {
  width: 100%;
  max-width: 360px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.admin-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-weight: 600;
  font-size: 14px;
}
.admin-field input,
.admin-field select,
.admin-field textarea {
  border: 1px solid #cdd6df;
  border-radius: 8px;
  padding: 9px 11px;
  font: inherit;
}
.admin-field textarea {
  min-height: 90px;
  resize: vertical;
}
.admin-error {
  color: #c0392b;
  font-weight: 600;
  margin: 0;
}
.admin-row-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.admin-table {
  width: 100%;
  border-collapse: collapse;
  background: #fff;
  border: 1px solid #e3e8ee;
  border-radius: 12px;
  overflow: hidden;
}
.admin-table th,
.admin-table td {
  text-align: left;
  padding: 10px 12px;
  border-bottom: 1px solid #eef2f6;
}
.admin-table th {
  background: #f7f9fb;
  font-size: 13px;
  color: #5a6b7b;
}
.admin-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}
.btn-danger {
  background: #c0392b;
  color: #fff;
}
@media (max-width: 720px) {
  .admin {
    grid-template-columns: 1fr;
  }
  .admin-side {
    flex-direction: row;
    flex-wrap: wrap;
    align-items: center;
  }
  .admin-nav {
    flex-direction: row;
    flex-wrap: wrap;
  }
  .admin-logout {
    margin: 0;
  }
}
```

- [ ] **Step 7: Regenerate the route tree**

Run: `npm run generate-routes`
Expected: updates `src/routeTree.gen.ts` with the new `/admin/login`, `/admin/_authed`, and `/admin/_authed/` routes, no errors. (If the dev server in the next step is running, it regenerates automatically — but run this so tsc sees the routes.)

- [ ] **Step 8: Dev-server walkthrough (manual verification)**

Run the dev server in the background and verify the guard:
```bash
npm run dev
```
Then verify (in another shell, or via the agent-browser skill):
1. `curl -s -o /dev/null -w '%{http_code} %{redirect_url}\n' http://localhost:3000/admin` → expect a redirect (307/302) to `/admin/login`, OR load `/admin` in a browser and confirm it lands on the login form.
2. Load `http://localhost:3000/admin/login` → login form renders, public TopNav/Footer are ABSENT.
3. Sign in with the existing temporary admin credentials (the account created earlier in prod via `scripts/create-admin.ts`; for local, run `bun run scripts/create-admin.ts` against the local D1 first if no local admin exists — see that script's env usage). After login you land on `/admin` showing product/category counts.
4. Click "Déconnexion" → returns to `/admin/login`; revisiting `/admin` redirects to login again.

If local auth has no admin user yet, create one against local D1:
```bash
BETTER_AUTH_URL=http://localhost:3000 bun run scripts/create-admin.ts
```
(The script prints the temporary e-mail; password handling is documented in the script. It targets whatever `BETTER_AUTH_URL` points to.)

- [ ] **Step 9: Quality gate + commit**

```bash
npx tsc --noEmit -p tsconfig.json && npm run lint && npm run test
git add src/routes/__root.tsx src/components/admin/AdminLayout.tsx \
  src/routes/admin/login.tsx src/routes/admin/_authed.tsx \
  src/routes/admin/_authed/index.tsx src/styles.css src/routeTree.gen.ts
git commit -m "feat(admin): login, session guard, admin shell and dashboard"
```

---

## Task 5: Categories CRUD (server fns + route)

**Files:**
- Create: `src/lib/admin-categories.ts`
- Create: `src/routes/admin/_authed/categories.tsx`

- [ ] **Step 1: Create the category server functions**

Create `src/lib/admin-categories.ts`:

```ts
import { createServerFn } from '@tanstack/react-start'
import { asc, count, eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '#/db/index'
import { categories, products } from '#/db/schema'
import { requireAdmin } from '#/lib/admin-auth'
import { categoryInput, categoryUpdate } from '#/lib/admin-schemas'
import { slugify } from '#/lib/slug'

export const adminListCategories = createServerFn({ method: 'GET' }).handler(
  async () => {
    await requireAdmin()
    return db.select().from(categories).orderBy(asc(categories.sortOrder))
  },
)

export const adminCreateCategory = createServerFn({ method: 'POST' })
  .inputValidator((d: unknown) => categoryInput.parse(d))
  .handler(async ({ data }) => {
    await requireAdmin()
    const slug = data.slug ?? slugify(data.label)
    await db.insert(categories).values({
      id: slug,
      slug,
      label: data.label,
      short: data.short,
      description: data.description,
      sortOrder: data.sortOrder,
    })
    return { id: slug }
  })

export const adminUpdateCategory = createServerFn({ method: 'POST' })
  .inputValidator((d: unknown) => categoryUpdate.parse(d))
  .handler(async ({ data }) => {
    await requireAdmin()
    await db
      .update(categories)
      .set({
        label: data.label,
        short: data.short,
        description: data.description,
        sortOrder: data.sortOrder,
      })
      .where(eq(categories.id, data.id))
    return { id: data.id }
  })

export const adminDeleteCategory = createServerFn({ method: 'POST' })
  .inputValidator((d: unknown) => z.object({ id: z.string().min(1) }).parse(d))
  .handler(async ({ data }) => {
    await requireAdmin()
    const [{ n }] = await db
      .select({ n: count() })
      .from(products)
      .where(eq(products.categoryId, data.id))
    if (n > 0) throw new Error('CATEGORY_NOT_EMPTY')
    await db.delete(categories).where(eq(categories.id, data.id))
    return { ok: true }
  })
```

Note: slug doubles as the primary key (matches the seed convention). Editing the label does NOT change the slug/id (stable URLs and FK integrity).

- [ ] **Step 2: Create the categories route**

Create `src/routes/admin/_authed/categories.tsx`:

```tsx
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import {
  adminCreateCategory,
  adminDeleteCategory,
  adminListCategories,
  adminUpdateCategory,
} from '#/lib/admin-categories'

export const Route = createFileRoute('/admin/_authed/categories')({
  loader: async () => ({ categories: await adminListCategories() }),
  component: Categories,
})

type Draft = {
  id?: string
  label: string
  short: string
  description: string
  sortOrder: number
}
const EMPTY: Draft = { label: '', short: '', description: '', sortOrder: 0 }

function Categories() {
  const { categories } = Route.useLoaderData()
  const router = useRouter()
  const [draft, setDraft] = useState<Draft>(EMPTY)
  const [error, setError] = useState('')
  const editing = Boolean(draft.id)

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    try {
      if (draft.id) {
        await adminUpdateCategory({
          data: {
            id: draft.id,
            label: draft.label,
            short: draft.short,
            description: draft.description,
            sortOrder: draft.sortOrder,
          },
        })
      } else {
        await adminCreateCategory({
          data: {
            label: draft.label,
            short: draft.short,
            description: draft.description,
            sortOrder: draft.sortOrder,
          },
        })
      }
      setDraft(EMPTY)
      await router.invalidate()
    } catch {
      setError('Échec de l’enregistrement.')
    }
  }

  async function remove(id: string) {
    setError('')
    try {
      await adminDeleteCategory({ data: { id } })
      await router.invalidate()
    } catch {
      setError(
        'Suppression impossible : la catégorie contient encore des produits.',
      )
    }
  }

  return (
    <div>
      <h1 className="admin-h1">Catégories</h1>
      {error ? <p className="admin-error">{error}</p> : null}

      <form className="admin-card" onSubmit={save} style={{ marginBottom: 20 }}>
        <h2>{editing ? `Modifier « ${draft.label} »` : 'Nouvelle catégorie'}</h2>
        <label className="admin-field">
          <span>Libellé</span>
          <input
            value={draft.label}
            onChange={(e) => setDraft({ ...draft, label: e.target.value })}
            required
          />
        </label>
        <label className="admin-field">
          <span>Sous-titre</span>
          <input
            value={draft.short}
            onChange={(e) => setDraft({ ...draft, short: e.target.value })}
            required
          />
        </label>
        <label className="admin-field">
          <span>Description</span>
          <textarea
            value={draft.description}
            onChange={(e) =>
              setDraft({ ...draft, description: e.target.value })
            }
          />
        </label>
        <label className="admin-field">
          <span>Ordre</span>
          <input
            type="number"
            value={draft.sortOrder}
            onChange={(e) =>
              setDraft({ ...draft, sortOrder: Number(e.target.value) })
            }
          />
        </label>
        <div className="admin-row-actions">
          <button className="btn btn-brand" type="submit">
            {editing ? 'Enregistrer' : 'Créer'}
          </button>
          {editing ? (
            <button
              className="btn"
              type="button"
              onClick={() => setDraft(EMPTY)}
            >
              Annuler
            </button>
          ) : null}
        </div>
      </form>

      <table className="admin-table">
        <thead>
          <tr>
            <th>Libellé</th>
            <th>Slug</th>
            <th>Ordre</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {categories.map((c) => (
            <tr key={c.id}>
              <td>{c.label}</td>
              <td>{c.slug}</td>
              <td>{c.sortOrder}</td>
              <td>
                <div className="admin-row-actions">
                  <button
                    className="btn"
                    type="button"
                    onClick={() =>
                      setDraft({
                        id: c.id,
                        label: c.label,
                        short: c.short,
                        description: c.description,
                        sortOrder: c.sortOrder,
                      })
                    }
                  >
                    Modifier
                  </button>
                  <button
                    className="btn btn-danger"
                    type="button"
                    onClick={() => remove(c.id)}
                  >
                    Supprimer
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 3: Regenerate routes + verify on dev server**

Run: `npm run generate-routes`
Then with `npm run dev` running and logged in, open `/admin/categories`:
1. Create a category "Test Gamme" → appears in the table.
2. Edit it (change sous-titre) → table reflects change after save.
3. Delete the empty "Test Gamme" → row disappears.
4. Try deleting a category that has products (e.g. `platres`) → red error "Suppression impossible…" shows and the row remains.

- [ ] **Step 4: Quality gate + commit**

```bash
npx tsc --noEmit -p tsconfig.json && npm run lint && npm run test
git add src/lib/admin-categories.ts src/routes/admin/_authed/categories.tsx src/routeTree.gen.ts
git commit -m "feat(admin): category CRUD with non-empty delete guard"
```

---

## Task 6: Product CRUD server functions

**Files:**
- Create: `src/lib/admin-products.ts`

No route yet (Task 8 builds the UI). No unit test (depends on db); verified via Task 8 walkthrough.

- [ ] **Step 1: Create the product server functions**

Create `src/lib/admin-products.ts`:

```ts
import { createServerFn } from '@tanstack/react-start'
import { asc, eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '#/db/index'
import { products, productImages } from '#/db/schema'
import { requireAdmin } from '#/lib/admin-auth'
import { productInput, productUpdate } from '#/lib/admin-schemas'
import { slugify } from '#/lib/slug'

/** Renvoie un slug non utilisé par un autre produit (suffixe -2, -3, …). */
async function uniqueSlug(base: string, excludeId?: string): Promise<string> {
  const root = slugify(base)
  let candidate = root
  let i = 2
  // Boucle bornée par la taille du catalogue ; sort dès qu'un slug est libre.
  for (;;) {
    const rows = await db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.slug, candidate))
      .limit(1)
    if (rows.length === 0 || rows[0].id === excludeId) return candidate
    candidate = `${root}-${i++}`
  }
}

export const adminListProducts = createServerFn({ method: 'GET' }).handler(
  async () => {
    await requireAdmin()
    return db.select().from(products).orderBy(asc(products.sortOrder))
  },
)

export const adminGetProduct = createServerFn({ method: 'GET' })
  .inputValidator((d: unknown) => z.object({ id: z.string().min(1) }).parse(d))
  .handler(async ({ data }) => {
    await requireAdmin()
    const rows = await db
      .select()
      .from(products)
      .where(eq(products.id, data.id))
      .limit(1)
    if (rows.length === 0) return null
    const imgs = await db
      .select()
      .from(productImages)
      .where(eq(productImages.productId, data.id))
      .orderBy(asc(productImages.sortOrder))
    return {
      ...rows[0],
      images: imgs.map((im) => ({
        id: im.id,
        key: im.r2Key,
        alt: im.alt,
        sortOrder: im.sortOrder,
      })),
    }
  })

export const adminCreateProduct = createServerFn({ method: 'POST' })
  .inputValidator((d: unknown) => productInput.parse(d))
  .handler(async ({ data }) => {
    await requireAdmin()
    const slug = await uniqueSlug(data.slug ?? data.name)
    await db.insert(products).values({
      id: slug,
      slug,
      categoryId: data.categoryId,
      name: data.name,
      format: data.format,
      descShort: data.descShort,
      descLong: data.descLong,
      featured: data.featured,
      sortOrder: data.sortOrder,
    })
    return { id: slug }
  })

export const adminUpdateProduct = createServerFn({ method: 'POST' })
  .inputValidator((d: unknown) => productUpdate.parse(d))
  .handler(async ({ data }) => {
    await requireAdmin()
    // Le slug/id reste stable ; on ne met à jour que les champs éditables.
    await db
      .update(products)
      .set({
        categoryId: data.categoryId,
        name: data.name,
        format: data.format,
        descShort: data.descShort,
        descLong: data.descLong,
        featured: data.featured,
        sortOrder: data.sortOrder,
      })
      .where(eq(products.id, data.id))
    return { id: data.id }
  })

export const adminToggleFeatured = createServerFn({ method: 'POST' })
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().min(1), featured: z.boolean() }).parse(d),
  )
  .handler(async ({ data }) => {
    await requireAdmin()
    await db
      .update(products)
      .set({ featured: data.featured })
      .where(eq(products.id, data.id))
    return { ok: true }
  })

export const adminDeleteProduct = createServerFn({ method: 'POST' })
  .inputValidator((d: unknown) => z.object({ id: z.string().min(1) }).parse(d))
  .handler(async ({ data }) => {
    await requireAdmin()
    // Les lignes product_images sont supprimées en cascade (FK onDelete:cascade).
    // Les objets R2 correspondants sont retirés explicitement au préalable.
    const imgs = await db
      .select({ key: productImages.r2Key })
      .from(productImages)
      .where(eq(productImages.productId, data.id))
    const { env } = await import('cloudflare:workers')
    for (const im of imgs) await env.IMAGES.delete(im.key)
    await db.delete(products).where(eq(products.id, data.id))
    return { ok: true }
  })
```

Note on the dynamic `import('cloudflare:workers')` inside the delete handler: it keeps the R2 binding usage local to the one handler that needs it here; the static `import { env } from 'cloudflare:workers'` form (used in Task 7) is equivalent and also fine. Prefer the static import at the top of the file if the implementer finds the dynamic form awkward — both type-check.

- [ ] **Step 2: Quality gate + commit**

```bash
npx tsc --noEmit -p tsconfig.json && npm run lint && npm run test
git add src/lib/admin-products.ts
git commit -m "feat(admin): product CRUD server fns with unique slug and R2-aware delete"
```

---

## Task 7: Product image server functions (R2)

**Files:**
- Create: `src/lib/admin-images.ts`

- [ ] **Step 1: Create the image server functions**

Create `src/lib/admin-images.ts`:

```ts
import { createServerFn } from '@tanstack/react-start'
import { env } from 'cloudflare:workers'
import { asc, eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '#/db/index'
import { products, productImages } from '#/db/schema'
import { requireAdmin } from '#/lib/admin-auth'

const ALLOWED_TYPES: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
}
const MAX_BYTES = 5 * 1024 * 1024 // 5 Mo

async function assertProductExists(productId: string) {
  const rows = await db
    .select({ id: products.id })
    .from(products)
    .where(eq(products.id, productId))
    .limit(1)
  if (rows.length === 0) throw new Error('PRODUCT_NOT_FOUND')
}

export const adminUploadImage = createServerFn({ method: 'POST' })
  .inputValidator((d: unknown) => {
    if (!(d instanceof FormData)) throw new Error('FormData attendu')
    return d
  })
  .handler(async ({ data }) => {
    await requireAdmin()
    const productId = String(data.get('productId') ?? '')
    const file = data.get('file')
    if (!productId) throw new Error('productId requis')
    if (!(file instanceof File)) throw new Error('Fichier requis')
    const ext = ALLOWED_TYPES[file.type]
    if (!ext) throw new Error('Type non autorisé (png, jpeg, webp)')
    if (file.size > MAX_BYTES) throw new Error('Fichier trop volumineux (max 5 Mo)')
    // Empêche l'injection d'une clé R2 arbitraire : le productId doit exister.
    await assertProductExists(productId)

    const id = crypto.randomUUID()
    const key = `products/${productId}/${id}.${ext}`
    await env.IMAGES.put(key, await file.arrayBuffer(), {
      httpMetadata: { contentType: file.type },
    })

    const existing = await db
      .select({ sortOrder: productImages.sortOrder })
      .from(productImages)
      .where(eq(productImages.productId, productId))
      .orderBy(asc(productImages.sortOrder))
    const nextOrder = existing.length
      ? Math.max(...existing.map((r) => r.sortOrder)) + 1
      : 0

    await db.insert(productImages).values({
      id,
      productId,
      r2Key: key,
      alt: '',
      sortOrder: nextOrder,
    })
    return { id, key }
  })

export const adminDeleteImage = createServerFn({ method: 'POST' })
  .inputValidator((d: unknown) => z.object({ id: z.string().min(1) }).parse(d))
  .handler(async ({ data }) => {
    await requireAdmin()
    const rows = await db
      .select({ key: productImages.r2Key })
      .from(productImages)
      .where(eq(productImages.id, data.id))
      .limit(1)
    if (rows.length === 0) return { ok: true }
    await env.IMAGES.delete(rows[0].key)
    await db.delete(productImages).where(eq(productImages.id, data.id))
    return { ok: true }
  })

export const adminReorderImages = createServerFn({ method: 'POST' })
  .inputValidator((d: unknown) =>
    z.object({ orderedIds: z.array(z.string().min(1)) }).parse(d),
  )
  .handler(async ({ data }) => {
    await requireAdmin()
    for (let i = 0; i < data.orderedIds.length; i++) {
      await db
        .update(productImages)
        .set({ sortOrder: i })
        .where(eq(productImages.id, data.orderedIds[i]))
    }
    return { ok: true }
  })
```

Keys are always `products/{productId}/{uuid}.{ext}` → they start with `products/` and contain no `..`, so the public `src/routes/img.$.tsx` route serves them unchanged.

- [ ] **Step 2: Quality gate + commit**

```bash
npx tsc --noEmit -p tsconfig.json && npm run lint && npm run test
git add src/lib/admin-images.ts
git commit -m "feat(admin): R2 image upload, delete and reorder server fns"
```

---

## Task 8: Product list + edit UI

**Files:**
- Create: `src/components/admin/ProductForm.tsx`
- Create: `src/routes/admin/_authed/produits.tsx`
- Create: `src/routes/admin/_authed/produits.$id.tsx`

- [ ] **Step 1: Create the product list route**

Create `src/routes/admin/_authed/produits.tsx`:

```tsx
import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { getCategories } from '#/lib/catalog'
import {
  adminDeleteProduct,
  adminListProducts,
  adminToggleFeatured,
} from '#/lib/admin-products'

export const Route = createFileRoute('/admin/_authed/produits')({
  loader: async () => {
    const [products, categories] = await Promise.all([
      adminListProducts(),
      getCategories(),
    ])
    const catLabel: Record<string, string> = {}
    for (const c of categories) catLabel[c.id] = c.label
    return { products, catLabel }
  },
  component: ProductsList,
})

function ProductsList() {
  const { products, catLabel } = Route.useLoaderData()
  const router = useRouter()

  async function toggle(id: string, featured: boolean) {
    await adminToggleFeatured({ data: { id, featured } })
    await router.invalidate()
  }
  async function remove(id: string) {
    if (!confirm('Supprimer ce produit et ses images ?')) return
    await adminDeleteProduct({ data: { id } })
    await router.invalidate()
  }

  return (
    <div>
      <div className="admin-toolbar">
        <h1 className="admin-h1" style={{ margin: 0 }}>
          Produits ({products.length})
        </h1>
        <Link
          to="/admin/produits/$id"
          params={{ id: 'nouveau' }}
          className="btn btn-brand"
        >
          + Nouveau produit
        </Link>
      </div>
      <table className="admin-table">
        <thead>
          <tr>
            <th>Nom</th>
            <th>Gamme</th>
            <th>Vedette</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id}>
              <td>{p.name}</td>
              <td>{catLabel[p.categoryId] ?? p.categoryId}</td>
              <td>
                <input
                  type="checkbox"
                  checked={p.featured}
                  onChange={(e) => toggle(p.id, e.target.checked)}
                />
              </td>
              <td>
                <div className="admin-row-actions">
                  <Link
                    to="/admin/produits/$id"
                    params={{ id: p.id }}
                    className="btn"
                  >
                    Modifier
                  </Link>
                  <button
                    className="btn btn-danger"
                    type="button"
                    onClick={() => remove(p.id)}
                  >
                    Supprimer
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 2: Create the ProductForm component**

Create `src/components/admin/ProductForm.tsx`. It handles both create and edit, plus the image manager (upload/delete/reorder via up/down buttons). The `categories` and optional `product` are passed by the route.

```tsx
import { useState } from 'react'
import { useRouter } from '@tanstack/react-router'
import {
  adminCreateProduct,
  adminUpdateProduct,
} from '#/lib/admin-products'
import {
  adminDeleteImage,
  adminReorderImages,
  adminUploadImage,
} from '#/lib/admin-images'

type Category = { id: string; label: string }
type Image = { id: string; key: string; alt: string; sortOrder: number }
export type ProductFormData = {
  id?: string
  categoryId: string
  name: string
  format: string
  descShort: string
  descLong: string
  featured: boolean
  sortOrder: number
  images: Array<Image>
}

export function ProductForm({
  categories,
  initial,
}: {
  categories: Array<Category>
  initial: ProductFormData
}) {
  const router = useRouter()
  const [f, setF] = useState<ProductFormData>(initial)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const isNew = !f.id

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      if (f.id) {
        await adminUpdateProduct({
          data: {
            id: f.id,
            categoryId: f.categoryId,
            name: f.name,
            format: f.format,
            descShort: f.descShort,
            descLong: f.descLong,
            featured: f.featured,
            sortOrder: f.sortOrder,
          },
        })
        await router.invalidate()
      } else {
        const { id } = await adminCreateProduct({
          data: {
            categoryId: f.categoryId,
            name: f.name,
            format: f.format,
            descShort: f.descShort,
            descLong: f.descLong,
            featured: f.featured,
            sortOrder: f.sortOrder,
          },
        })
        // Bascule vers l'écran d'édition pour permettre l'ajout d'images.
        router.navigate({ to: '/admin/produits/$id', params: { id } })
      }
    } catch {
      setError('Échec de l’enregistrement.')
    } finally {
      setBusy(false)
    }
  }

  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !f.id) return
    setError('')
    const fd = new FormData()
    fd.set('productId', f.id)
    fd.set('file', file)
    try {
      await adminUploadImage({ data: fd })
      await router.invalidate()
      // Recharge les images depuis le loader via la navigation invalidée :
      // le parent re-render avec les nouvelles données ; ici on remet à zéro
      // l'input fichier.
      e.target.value = ''
    } catch {
      setError('Échec de l’envoi de l’image (type/taille ?).')
    }
  }

  async function deleteImg(id: string) {
    await adminDeleteImage({ data: { id } })
    setF({ ...f, images: f.images.filter((im) => im.id !== id) })
    await router.invalidate()
  }

  async function move(index: number, dir: -1 | 1) {
    const next = [...f.images]
    const j = index + dir
    if (j < 0 || j >= next.length) return
    ;[next[index], next[j]] = [next[j], next[index]]
    setF({ ...f, images: next })
    await adminReorderImages({ data: { orderedIds: next.map((im) => im.id) } })
    await router.invalidate()
  }

  return (
    <form className="admin-card" onSubmit={save}>
      <h1 className="admin-h1">
        {isNew ? 'Nouveau produit' : `Modifier « ${f.name} »`}
      </h1>
      {error ? <p className="admin-error">{error}</p> : null}

      <label className="admin-field">
        <span>Nom</span>
        <input
          value={f.name}
          onChange={(e) => setF({ ...f, name: e.target.value })}
          required
        />
      </label>
      <label className="admin-field">
        <span>Gamme</span>
        <select
          value={f.categoryId}
          onChange={(e) => setF({ ...f, categoryId: e.target.value })}
          required
        >
          <option value="" disabled>
            — Choisir —
          </option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </label>
      <label className="admin-field">
        <span>Format / conditionnement</span>
        <input
          value={f.format}
          onChange={(e) => setF({ ...f, format: e.target.value })}
        />
      </label>
      <label className="admin-field">
        <span>Description courte</span>
        <textarea
          value={f.descShort}
          onChange={(e) => setF({ ...f, descShort: e.target.value })}
        />
      </label>
      <label className="admin-field">
        <span>Description longue</span>
        <textarea
          value={f.descLong}
          onChange={(e) => setF({ ...f, descLong: e.target.value })}
        />
      </label>
      <label className="admin-field" style={{ flexDirection: 'row', gap: 8 }}>
        <input
          type="checkbox"
          checked={f.featured}
          onChange={(e) => setF({ ...f, featured: e.target.checked })}
        />
        <span>Produit vedette</span>
      </label>
      <label className="admin-field">
        <span>Ordre</span>
        <input
          type="number"
          value={f.sortOrder}
          onChange={(e) => setF({ ...f, sortOrder: Number(e.target.value) })}
        />
      </label>

      <div className="admin-row-actions">
        <button className="btn btn-brand" type="submit" disabled={busy}>
          {busy ? 'Enregistrement…' : isNew ? 'Créer' : 'Enregistrer'}
        </button>
      </div>

      {!isNew ? (
        <div style={{ marginTop: 24 }}>
          <h2>Images</h2>
          <div className="admin-images">
            {f.images.map((im, i) => (
              <div key={im.id} className="admin-img">
                <img src={`/img/${im.key}`} alt={im.alt} />
                <div className="admin-row-actions">
                  <button type="button" className="btn" onClick={() => move(i, -1)}>
                    ↑
                  </button>
                  <button type="button" className="btn" onClick={() => move(i, 1)}>
                    ↓
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => deleteImg(im.id)}
                  >
                    Suppr.
                  </button>
                </div>
              </div>
            ))}
          </div>
          <label className="admin-field" style={{ marginTop: 12 }}>
            <span>Ajouter une image (png, jpeg, webp — max 5 Mo)</span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={upload}
            />
          </label>
        </div>
      ) : (
        <p style={{ marginTop: 16, color: '#5a6b7b' }}>
          Enregistrez d’abord le produit pour pouvoir ajouter des images.
        </p>
      )}
    </form>
  )
}
```

- [ ] **Step 3: Create the create/edit route**

Create `src/routes/admin/_authed/produits.$id.tsx`. The id `nouveau` means "create"; any other id loads that product:

```tsx
import { createFileRoute, notFound } from '@tanstack/react-router'
import { getCategories } from '#/lib/catalog'
import { adminGetProduct } from '#/lib/admin-products'
import { ProductForm, type ProductFormData } from '#/components/admin/ProductForm'

export const Route = createFileRoute('/admin/_authed/produits/$id')({
  loader: async ({ params }) => {
    const categories = await getCategories()
    if (params.id === 'nouveau') {
      return { categories, initial: null }
    }
    const product = await adminGetProduct({ data: { id: params.id } })
    if (!product) throw notFound()
    return { categories, initial: product }
  },
  component: ProductEdit,
})

function ProductEdit() {
  const { categories, initial } = Route.useLoaderData()
  const empty: ProductFormData = {
    categoryId: '',
    name: '',
    format: '',
    descShort: '',
    descLong: '',
    featured: false,
    sortOrder: 0,
    images: [],
  }
  const data: ProductFormData = initial
    ? {
        id: initial.id,
        categoryId: initial.categoryId,
        name: initial.name,
        format: initial.format,
        descShort: initial.descShort,
        descLong: initial.descLong,
        featured: initial.featured,
        sortOrder: initial.sortOrder,
        images: initial.images,
      }
    : empty
  // key=id force un remount du formulaire quand on passe de "nouveau" à l'id réel.
  return (
    <ProductForm
      key={initial?.id ?? 'nouveau'}
      categories={categories}
      initial={data}
    />
  )
}
```

- [ ] **Step 4: Append image-grid styles**

Append to `src/styles.css`:

```css
.admin-images {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
}
.admin-img {
  border: 1px solid #e3e8ee;
  border-radius: 10px;
  padding: 8px;
  background: #fff;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.admin-img img {
  width: 100%;
  aspect-ratio: 1 / 1;
  object-fit: contain;
  background: #fff;
}
```

- [ ] **Step 5: Regenerate routes + dev-server walkthrough**

Run: `npm run generate-routes`
With `npm run dev` running and logged in:
1. `/admin/produits` lists all products with their gamme and a "Vedette" checkbox.
2. Toggle a "Vedette" checkbox → reload the public home page `/` and confirm the featured set changed.
3. "+ Nouveau produit" → fill name + gamme → "Créer" → URL switches to `/admin/produits/<slug>` and the image uploader appears.
4. Upload a PNG → it appears in the grid; open `/img/products/<slug>/<uuid>.png` directly → returns 200 with the image.
5. Use ↑/↓ to reorder, "Suppr." to delete an image (confirm the R2 object is gone: re-requesting its `/img/...` URL returns 404).
6. Edit an existing product's text fields → "Enregistrer" → re-open it, changes persisted.
7. Delete a product from the list (confirm dialog) → row disappears and its images' `/img/...` URLs return 404.

- [ ] **Step 6: Quality gate + commit**

```bash
npx tsc --noEmit -p tsconfig.json && npm run lint && npm run test
git add src/components/admin/ProductForm.tsx \
  src/routes/admin/_authed/produits.tsx \
  src/routes/admin/_authed/produits.\$id.tsx \
  src/styles.css src/routeTree.gen.ts
git commit -m "feat(admin): product list and create/edit UI with image manager"
```

---

## Task 9: Settings (contact & WhatsApp)

**Files:**
- Create: `src/lib/admin-settings.ts`
- Create: `src/routes/admin/_authed/parametres.tsx`

- [ ] **Step 1: Create the settings upsert server fn**

Create `src/lib/admin-settings.ts`:

```ts
import { createServerFn } from '@tanstack/react-start'
import { db } from '#/db/index'
import { settings } from '#/db/schema'
import { requireAdmin } from '#/lib/admin-auth'
import { settingsInput } from '#/lib/admin-schemas'

export const adminUpdateSettings = createServerFn({ method: 'POST' })
  .inputValidator((d: unknown) => settingsInput.parse(d))
  .handler(async ({ data }) => {
    await requireAdmin()
    for (const [key, value] of Object.entries(data)) {
      await db
        .insert(settings)
        .values({ key, value })
        .onConflictDoUpdate({ target: settings.key, set: { value } })
    }
    return { ok: true }
  })
```

- [ ] **Step 2: Create the settings route**

Create `src/routes/admin/_authed/parametres.tsx`. It reads current values via the existing public `getSettings` and writes via `adminUpdateSettings`:

```tsx
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { getSettings } from '#/lib/catalog'
import { adminUpdateSettings } from '#/lib/admin-settings'

export const Route = createFileRoute('/admin/_authed/parametres')({
  loader: async () => ({ settings: await getSettings() }),
  component: Settings,
})

const FIELDS: Array<{ key: keyof Form; label: string }> = [
  { key: 'whatsapp_number', label: 'Numéro WhatsApp (devis)' },
  { key: 'contact_phone', label: 'Téléphone affiché (WhatsApp)' },
  { key: 'contact_phone_call', label: 'Téléphone appels & SMS' },
  { key: 'contact_email', label: 'E-mail de contact' },
  { key: 'contact_address', label: 'Adresse' },
]

type Form = {
  whatsapp_number: string
  contact_phone: string
  contact_phone_call: string
  contact_email: string
  contact_address: string
}

function Settings() {
  const { settings } = Route.useLoaderData()
  const router = useRouter()
  const [form, setForm] = useState<Form>({
    whatsapp_number: settings.whatsapp_number,
    contact_phone: settings.contact_phone,
    contact_phone_call: settings.contact_phone_call,
    contact_email: settings.contact_email,
    contact_address: settings.contact_address,
  })
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSaved(false)
    try {
      await adminUpdateSettings({ data: form })
      await router.invalidate()
      setSaved(true)
    } catch {
      setError('Échec de l’enregistrement.')
    }
  }

  return (
    <div>
      <h1 className="admin-h1">Paramètres de contact</h1>
      <form className="admin-card" onSubmit={save}>
        {FIELDS.map((field) => (
          <label className="admin-field" key={field.key}>
            <span>{field.label}</span>
            <input
              value={form[field.key]}
              onChange={(e) =>
                setForm({ ...form, [field.key]: e.target.value })
              }
            />
          </label>
        ))}
        {error ? <p className="admin-error">{error}</p> : null}
        {saved ? (
          <p style={{ color: '#1e8a4c', fontWeight: 600 }}>Enregistré.</p>
        ) : null}
        <div className="admin-row-actions">
          <button className="btn btn-brand" type="submit">
            Enregistrer
          </button>
        </div>
      </form>
    </div>
  )
}
```

- [ ] **Step 3: Regenerate routes + dev-server walkthrough**

Run: `npm run generate-routes`
With `npm run dev` running and logged in:
1. `/admin/parametres` shows the current 5 contact values pre-filled.
2. Change the address → "Enregistrer" → "Enregistré." appears.
3. Open the public `/contact` page and the footer → the new address shows (settings are read live via the root loader).

- [ ] **Step 4: Quality gate + commit**

```bash
npx tsc --noEmit -p tsconfig.json && npm run lint && npm run test
git add src/lib/admin-settings.ts src/routes/admin/_authed/parametres.tsx src/routeTree.gen.ts
git commit -m "feat(admin): contact & WhatsApp settings editor"
```

---

## Task 10: Full verification, deploy, production admin check

**Files:** none (verification + deploy only).

- [ ] **Step 1: Full local quality gate + production build**

```bash
npx tsc --noEmit -p tsconfig.json && npm run lint && npm run test && npm run build
```
Expected: tsc 0 errors, eslint clean, all tests pass, Vite build succeeds.

- [ ] **Step 2: Confirm no new D1 migration is required**

The admin feature adds NO schema changes (all tables already exist). Confirm there are no pending drizzle changes:
```bash
git status --porcelain migrations/
```
Expected: empty (no new migration files). The settings rows are upserted at runtime; no seed migration needed.

- [ ] **Step 3: Deploy to production**

Use the full build+deploy (a bare `wrangler deploy` reuses a stale `.wrangler/deploy/config.json`):
```bash
bun run deploy
```
Expected: "Deployed nouvelle-sdpf … nouvelle-sdpf.com (custom domain)", a new Version ID, `BETTER_AUTH_URL https://nouvelle-sdpf.com`.

- [ ] **Step 4: Verify the production guard and login**

```bash
# Guard: /admin must redirect unauthenticated users to /admin/login
curl -s -o /dev/null -w '%{http_code} -> %{redirect_url}\n' https://nouvelle-sdpf.com/admin
# Login page must be publicly reachable
curl -s -o /dev/null -w '%{http_code}\n' https://nouvelle-sdpf.com/admin/login
```
Expected: `/admin` returns a redirect (3xx) to `/admin/login` (or the SSR-rendered login — if it returns 200, open it in a browser to confirm it shows the login form, not the dashboard); `/admin/login` returns 200.

Then in a browser: log in at `https://nouvelle-sdpf.com/admin/login` with the production admin account (created earlier via `scripts/create-admin.ts`). Confirm:
- Dashboard shows correct product/category counts.
- Editing a product's text and saving persists after reload.
- Uploading an image makes it visible on the public product page.
- Changing a contact setting updates the public footer/contact page.
- "Déconnexion" returns to the login screen and `/admin` redirects again.

- [ ] **Step 5: Commit any build artifacts and push the branch**

```bash
git add -A
git commit -m "chore(admin): production build verification" --allow-empty
git push -u origin feat/admin-back-office
```

- [ ] **Step 6: Open a PR**

```bash
gh pr create --title "Admin back-office (Plan 3)" \
  --body "Implements the password-protected /admin back-office: dashboard, product CRUD + R2 image manager, category CRUD with non-empty delete guard, and contact/WhatsApp settings. Guard via better-auth session; all mutations re-validate the session server-side.

🤖 Generated with [Claude Code](https://claude.com/claude-code)"
```

After the final reviewer (subagent-driven-development's final code-review step) and CodeRabbit pass, the controller proceeds to `superpowers:finishing-a-development-branch`.

---

## Self-Review (against spec sections 4–5, 8)

**Spec coverage:**
- §5 `/admin/login` → Task 4 ✓; `/admin` dashboard with counts → Task 4 ✓; `/admin/produits` + `/admin/produits/$id` CRUD + image upload/reorder + featured toggle → Tasks 6, 7, 8 ✓; `/admin/categories` CRUD + reorder (via `sortOrder` field) → Task 5 ✓; `/admin/parametres` WhatsApp + contact → Task 9 ✓.
- §5 guard: `beforeLoad` on the `/admin/_authed` segment checks the better-auth session and redirects to `/admin/login` → Task 4 ✓; mutations re-validate via `requireAdmin()` → Tasks 5–9 ✓.
- §4 delete rules: category delete forbidden while products are linked → Task 5 `adminDeleteCategory` ✓; product delete removes its `product_images` (FK cascade) AND R2 objects → Task 6 `adminDeleteProduct` ✓.
- §8 images: upload → key `products/{productId}/{uuid}.{ext}` → `env.IMAGES.put()` → insert `product_images`, zod-style type/size validation → Task 7 ✓; delete removes R2 object + row → Task 7 ✓; public read unchanged (keys stay under `products/`) ✓.
- §12 YAGNI honored: no hero-text editing, no roles/multi-user, no quote persistence.

**Placeholder scan:** No TBD/TODO/"add validation"/"handle errors" left; every code step contains complete code. Image reorder uses explicit up/down buttons (no drag-drop dependency) — intentional YAGNI, fully specified.

**Type consistency:** `requireAdmin()` / `getAdminSession` (Task 3) reused unchanged in Tasks 5–9. `ProductFormData` defined in Task 8 and consumed by `produits.$id.tsx` in the same task. `productInput`/`productUpdate`/`categoryInput`/`categoryUpdate`/`settingsInput` defined in Task 2 and imported by name in Tasks 5/6/9. Image key shape `products/{productId}/{uuid}.{ext}` (Task 7) matches the `ALLOWED = ['products/', …]` prefix in the existing `img.$.tsx`. Server-fn call convention `fn({ data })` used consistently in all route/component callers.

**Known runtime check deferred to execution:** TanStack Start `createServerFn` with a `FormData` argument (Task 7 upload, called as `adminUploadImage({ data: fd })` in Task 8). This is the one path not pre-type-checked against a running server; Task 8 Step 5.4 explicitly verifies an upload round-trips (200 on `/img/...`). If FormData transport misbehaves, the fallback is a dedicated server route handler `src/routes/admin/upload.ts` reading `request.formData()` with a `requireAdmin()` check — same logic, different transport.
