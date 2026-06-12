import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { getCategories, getFeatured, getProducts } from '#/lib/catalog'
import { SearchBar } from '#/components/SearchBar'
import { CategoryCard } from '#/components/CategoryCard'
import { ProductCard } from '#/components/ProductCard'
import { Icon } from '#/components/Icon'

export const Route = createFileRoute('/')({
  loader: async () => {
    const [categories, featured, products] = await Promise.all([
      getCategories(),
      getFeatured(),
      getProducts(),
    ])
    const counts: Record<string, number> = {}
    for (const p of products)
      counts[p.categoryId] = (counts[p.categoryId] ?? 0) + 1
    return { categories, featured, counts }
  },
  component: Home,
})

function Home() {
  const { categories, featured, counts } = Route.useLoaderData()
  const [q, setQ] = useState('')
  const navigate = useNavigate()
  const goSearch = () =>
    navigate({
      to: '/catalogue',
      search: { q: q || undefined, cat: undefined },
    })

  return (
    <div className="pb-nav">
      <section className="hero">
        <p className="label hero-kicker">Nouvelle Société de Distribution</p>
        <h1 className="hero-title">
          Le plâtre &amp; la filasse,
          <br />
          au cœur de vos chantiers.
        </h1>
        <p className="hero-sub">
          Plâtres, plaques, carreaux, filasse et accessoires de finition. Devis
          rapide et livraison sur chantier.
        </p>
        <div className="hero-cta">
          <Link to="/catalogue" className="btn btn-primary">
            Voir le catalogue <Icon name="arrow-r" size={18} stroke={2.4} />
          </Link>
          <Link to="/devis" className="btn btn-ghost">
            Devis
          </Link>
        </div>
      </section>

      <div className="pad">
        <SearchBar
          value={q}
          onChange={setQ}
          placeholder="Rechercher un produit…"
          onSubmit={goSearch}
        />

        <div className="perks">
          <div className="perk">
            <Icon name="truck" size={22} />
            <b>Livraison</b>
            <span className="label">sur chantier</span>
          </div>
          <div className="perk">
            <Icon name="doc" size={22} />
            <b>Devis</b>
            <span className="label">sous 24 h</span>
          </div>
          <div className="perk">
            <Icon name="pin" size={22} />
            <b>Retrait</b>
            <span className="label">au dépôt</span>
          </div>
        </div>

        <div className="section-head">
          <span className="sh-title">Nos gammes</span>
          <Link to="/catalogue" className="sh-link">
            Tout voir
          </Link>
        </div>
        <div className="cat-grid">
          {categories.map((c) => (
            <CategoryCard
              key={c.slug}
              category={c}
              count={counts[c.slug] ?? 0}
            />
          ))}
        </div>

        <div className="section-head">
          <span className="sh-title">Produits vedettes</span>
        </div>
        <div className="pgrid">
          {featured.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>
    </div>
  )
}
