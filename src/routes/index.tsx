import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { getCategories, getFeatured, getProducts } from '#/lib/catalog'
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
      <section className="dhero">
        <div className="grid-tex" />
        <div className="dhero-wrap">
          <div className="dhero-copy">
            <span className="label dhero-kicker">
              Nouvelle Société de Distribution
            </span>
            <h1>
              Le plâtre &amp; la filasse,
              <br />
              au cœur de vos chantiers.
            </h1>
            <p className="lead">
              Distribution professionnelle de plâtres, plaques, carreaux,
              filasse et accessoires de finition. Devis rapide et livraison sur
              chantier.
            </p>
            <form
              className="hero-search"
              onSubmit={(e) => {
                e.preventDefault()
                goSearch()
              }}
            >
              <Icon name="search" size={20} />
              <input
                placeholder="Rechercher un produit…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </form>
            <div className="hero-cta">
              <Link to="/catalogue" className="btn btn-primary btn-lg">
                Voir le catalogue <Icon name="arrow-r" size={18} stroke={2.4} />
              </Link>
              <a href="#gammes" className="btn btn-ghost btn-lg">
                Nos gammes
              </a>
            </div>
          </div>
          <div className="hero-logo">
            <img src="/logo-sdpf.jpeg" alt="NSDPF" />
          </div>
        </div>
        <div className="dhero-strip">
          <div className="vstrip">
            <div>
              <Icon name="truck" size={22} />
              <div>
                <div className="vt">Livraison</div>
                <div className="vs">sur chantier</div>
              </div>
            </div>
            <div>
              <Icon name="doc" size={22} />
              <div>
                <div className="vt">Devis</div>
                <div className="vs">sous 24 h</div>
              </div>
            </div>
            <div>
              <Icon name="layers" size={22} />
              <div>
                <div className="vt">Retrait</div>
                <div className="vs">au dépôt</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="pad" id="gammes">
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
