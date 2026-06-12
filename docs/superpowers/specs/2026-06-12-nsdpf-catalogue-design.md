# Catalogue NSDPF — Design

**Date :** 2026-06-12
**Projet :** Nouvelle Société de Distribution de Plâtre et Filasses (NSDPF / SDPF)
**Objet :** Catalogue produit mobile-first avec back-office, déployé sur Cloudflare.

---

## 1. Contexte & objectif

Construire un catalogue produit pour NSDPF (distribution de plâtre, plaques, filasse et
accessoires de finition). Le site présente les produits **sans prix** : le client constitue un
« devis » (panier) qu'il envoie via WhatsApp au commercial.

Un mockup React (`nsdpf2.zip`) définit l'identité visuelle, les écrans et les données de départ
(`data.js` : 4 catégories, 15 produits). 38 photos produit sont fournies (`WhatsApp ... .zip`).

Stack imposée : **TanStack Start** (React 19), déploiement **Cloudflare Workers**, **D1** (base de
données), **R2** (images). Dépendances déjà présentes : drizzle-orm, better-auth, Tailwind v4,
lucide-react, zod, @tanstack/react-form.

### Décisions validées (brainstorming)

1. **Gestion du catalogue : back-office complet** (D1 + R2), protégé par better-auth.
2. **Devis : WhatsApp uniquement** — panier en localStorage, message WhatsApp pré-rempli, rien
   n'est stocké côté serveur.
3. **Amorçage : seed complet** — 15 produits du mockup + upload des 38 images vers R2 avec mapping
   au mieux ; correction ultérieure via l'admin.
4. **Périmètre admin** : Produits (CRUD + images), Catégories (CRUD), Produits vedettes,
   Paramètres **limités au numéro WhatsApp et aux coordonnées de contact** (les textes du hero
   restent dans le code).

---

## 2. Approche retenue

**TanStack Start natif (Approche A).** Les pages publiques lisent D1 via les _loaders_ de route
(SSR pour le SEO) ; l'admin mute via des _server functions_ protégées par la session better-auth ;
les images transitent par une route Worker `/img/$key` lisant R2 avec cache.

Alternatives écartées :

- **API REST séparée (Hono)** : boilerplate redondant, les server functions suffisent.
- **SSG au build** : les modifs admin ne seraient visibles qu'après rebuild — incompatible avec
  l'édition en direct.

---

## 3. Architecture

```
TanStack Start (React 19) — Cloudflare Workers (@cloudflare/vite-plugin)
├── Pages publiques (SSR, mobile-first responsive)  → loaders lisent D1 (drizzle-orm/d1)
├── Server functions (mutations admin)              → protégées par session better-auth
├── better-auth (email/mot de passe) + drizzleAdapter(D1)
├── D1 (SQLite)  ← produits, catégories, images, paramètres, tables auth
└── R2 (images)  ← servies via route Worker /img/$key (Cache API + en-têtes immutables)
```

### Migration du scaffold (état actuel → cible)

Le scaffold actuel est câblé pour du SQLite local et ne tourne pas sur Workers tel quel.

| Fichier             | Actuel                                                    | Cible                                                             |
| ------------------- | --------------------------------------------------------- | ----------------------------------------------------------------- |
| `src/db/index.ts`   | `drizzle-orm/better-sqlite3` + `process.env.DATABASE_URL` | `drizzle-orm/d1` avec binding `env.DB` (via `cloudflare:workers`) |
| `wrangler.jsonc`    | nom `tanstack-start-app`, aucun binding                   | nom `nouvelle-sdpf`, bindings `DB` (D1) + `IMAGES` (R2)           |
| `src/lib/auth.ts`   | better-auth sans base                                     | `drizzleAdapter` sur D1 + tables auth dans le schéma              |
| `drizzle.config.ts` | dialecte sqlite local                                     | dialecte `sqlite` / driver `d1-http` pour migrations D1           |

Les routes de démo (`src/routes/demo/*`, hooks/composants `demo.*`) seront supprimées.

---

## 4. Modèle de données (D1 / drizzle)

| Table                                        | Champs                                                                                                                                                              |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `categories`                                 | `id` (pk), `slug` (unique), `label`, `short`, `description`, `sort_order`                                                                                           |
| `products`                                   | `id` (pk), `slug` (unique), `category_id` (FK→categories), `name`, `format`, `desc_short`, `desc_long`, `featured` (bool, défaut false), `sort_order`, `created_at` |
| `product_images`                             | `id` (pk), `product_id` (FK→products), `r2_key`, `alt`, `sort_order` — **N images par produit**                                                                     |
| `settings`                                   | `key` (pk), `value` — entrées : `whatsapp_number`, `contact_phone`, `contact_email`, `contact_address`                                                              |
| `user`, `session`, `account`, `verification` | tables better-auth (schéma généré/aligné sur la version installée)                                                                                                  |

Suppression d'une catégorie : interdite s'il reste des produits liés (ou réassignation explicite).
Suppression d'un produit : supprime ses `product_images` (et les objets R2 correspondants).

Le panier **Devis** n'a **aucune table** — il vit en localStorage côté client.

---

## 5. Routes

### Public (mobile-first, responsive desktop)

| Route            | Écran     | Contenu                                                                                   |
| ---------------- | --------- | ----------------------------------------------------------------------------------------- |
| `/`              | Accueil   | Hero, recherche, 3 atouts (Livraison/Devis/Retrait), grille catégories, produits vedettes |
| `/catalogue`     | Catalogue | Recherche + filtres catégorie, grille produits ; état dans l'URL (`?cat=`, `?q=`)         |
| `/produit/$slug` | Détail    | Carrousel images, format, description longue, « Ajouter au devis »                        |
| `/devis`         | Mon devis | Liste localStorage + quantités, « Envoyer sur WhatsApp »                                  |
| `/contact`       | Contact   | Coordonnées (depuis `settings`) + lien WhatsApp                                           |

### Admin (`/admin`, protégé better-auth)

| Route                                    | Rôle                                                          |
| ---------------------------------------- | ------------------------------------------------------------- |
| `/admin/login`                           | Connexion email/mot de passe                                  |
| `/admin`                                 | Tableau de bord (compteurs produits/catégories)               |
| `/admin/produits`, `/admin/produits/$id` | CRUD produits, upload/réordonnancement images, toggle vedette |
| `/admin/categories`                      | CRUD + réordonnancement catégories                            |
| `/admin/parametres`                      | Numéro WhatsApp + coordonnées de contact                      |

Garde d'accès : un `beforeLoad` sur le segment `/admin` vérifie la session better-auth et redirige
vers `/admin/login` sinon. Les server functions de mutation revalident la session côté serveur.

---

## 6. UI & navigation

- **Mobile** : bottom-nav (Accueil / Catalogue / Devis / Contact), badge compteur sur Devis,
  app-bar en haut des sous-écrans.
- **Desktop** : top-nav (réf. `desk-hero`) avec boutons WhatsApp + Mon devis.
- Le **cadre iPhone du mockup est un simple habillage de présentation** : le site prod est un vrai
  site responsive, non encadré.
- **Thème industriel** : accent `#1e73ad`, hero bleu foncé, polices Archivo (titres) / Barlow
  (texte), via Tailwind v4. Pas de panneau « tweaks » (outil de mockup uniquement).
- **Composants** isolés et focalisés : `ProductCard`, `CategoryCard`, `SearchBar`, `BottomNav`,
  `TopNav`, `DevisButton`, `ImageCarousel`, `Badge`, `AdminLayout`, `ProductForm`.

---

## 7. Devis (client)

- Store React + localStorage (clé `sdpf_devis_v1`), API : `toggle`, `setQty`, `remove`, `clear`,
  `count`. Reprend la logique du mockup (`app.jsx`).
- Envoi : `https://wa.me/{whatsapp_number}?text=<message encodé>` où le message liste
  « {Nom produit} ×{Qté} ». Le numéro provient de `settings.whatsapp_number`.

---

## 8. Images (R2)

- **Upload (admin)** : server function reçoit le fichier → clé `products/{productId}/{ulid}.{ext}`
  → `env.IMAGES.put()` → insère `r2_key` dans `product_images`. Validation type/taille via zod.
- **Lecture (public)** : route `/img/$key` → `env.IMAGES.get()` → réponse avec
  `Cache-Control: public, max-age=31536000, immutable`, adossée à la Cache API du Worker.
  Évolution possible vers un domaine public R2 sans changer le code applicatif.
- **Suppression** : retirer l'objet R2 + la ligne `product_images`.

---

## 9. Amorçage (seed)

1. **Migration de seed** : 4 catégories + 15 produits issus de `data.js` ;
   `featured = ['platre-finition','plaque-ba13','filasse-lin','carreau-std']`.
2. **Script d'upload images** : 38 photos WhatsApp → R2 + lignes `product_images`, avec mapping
   produit établi en examinant les photos (best effort ; ajustable via l'admin).
3. **Script compte admin** : création du premier utilisateur better-auth avec des **identifiants
   temporaires** (ex. `admin@nsdpf.local` / mot de passe documenté), à changer dès la première
   connexion.

---

## 10. Déploiement

- `wrangler.jsonc` : bindings `DB` (D1) + `IMAGES` (R2), nom `nouvelle-sdpf`.
- Secret `BETTER_AUTH_SECRET` via `wrangler secret put`.
- Migrations : `wrangler d1 migrations apply` (remote & local).
- Build & déploiement : `npm run deploy` (build Vite + `wrangler deploy`).

---

## 11. Tests

- **Unitaires (Vitest)** : génération du message WhatsApp, store devis (toggle/setQty/remove/clear),
  helpers slug & mapping d'images.
- **Server functions** : refus d'accès sans session admin ; validation zod des entrées produit.

---

## 12. Hors périmètre (YAGNI)

- Pas de prix ni de paiement en ligne.
- Pas d'enregistrement serveur des demandes de devis.
- Pas d'édition des textes du hero via l'admin (restent dans le code).
- Pas de multi-langue, pas de gestion multi-utilisateurs avancée (rôles), pas de panneau de thème.
