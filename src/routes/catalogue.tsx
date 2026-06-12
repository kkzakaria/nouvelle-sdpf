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
            <button key={c.slug} className="fchip" data-on={cat === c.slug} onClick={() => setCat(c.slug)}>{c.short}</button>
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
