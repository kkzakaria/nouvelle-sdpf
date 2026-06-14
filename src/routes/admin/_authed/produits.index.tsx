import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { getCategories } from '#/lib/catalog'
import {
  adminDeleteProduct,
  adminListProducts,
  adminToggleFeatured,
} from '#/lib/admin-products'
import { imgUrl } from '#/lib/img'
import { Icon } from '#/components/Icon'
import { ConfirmDialog } from '#/components/admin/ConfirmDialog'

export const Route = createFileRoute('/admin/_authed/produits/')({
  loader: async () => {
    const [products, categories] = await Promise.all([
      adminListProducts(),
      getCategories(),
    ])
    return { products, categories }
  },
  component: ProductsList,
})

function ProductsList() {
  const { products, categories } = Route.useLoaderData()
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [confirm, setConfirm] = useState<{ id: string; name: string } | null>(
    null,
  )
  const [busy, setBusy] = useState(false)

  const catShort: Record<string, string> = {}
  for (const c of categories) catShort[c.id] = c.short

  const q = search.trim().toLowerCase()
  const list = products.filter((p) => {
    const okCat = filter === 'all' || p.categoryId === filter
    const okQ =
      !q || `${p.name} ${p.descShort}`.toLowerCase().includes(q)
    return okCat && okQ
  })

  async function toggle(id: string, featured: boolean) {
    try {
      await adminToggleFeatured({ data: { id, featured } })
      await router.invalidate()
    } catch {
      alert('Échec de la mise à jour du statut vedette.')
    }
  }

  async function remove() {
    if (!confirm) return
    setBusy(true)
    try {
      await adminDeleteProduct({ data: { id: confirm.id } })
      setConfirm(null)
      await router.invalidate()
    } catch {
      alert('Échec de la suppression du produit.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div className="adm-topbar">
        <div>
          <h1 className="adm-h1">Produits</h1>
          <p className="adm-sub">
            {products.length} références dans le catalogue
          </p>
        </div>
        <Link to="/admin/produits/nouveau" className="btn btn-primary">
          <Icon name="plus" size={18} stroke={2.6} /> Nouveau produit
        </Link>
      </div>

      <div className="adm-body">
        <div className="adm-toolbar">
          <div className="searchbar adm-search">
            <Icon name="search" size={18} />
            <input
              placeholder="Rechercher un produit…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <span className="adm-clear" onClick={() => setSearch('')}>
                <Icon name="x" size={15} />
              </span>
            )}
          </div>
          <div className="adm-filters">
            <button
              className="fchip"
              data-on={filter === 'all' ? 'true' : 'false'}
              onClick={() => setFilter('all')}
            >
              Toutes
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                className="fchip"
                data-on={filter === c.id ? 'true' : 'false'}
                onClick={() => setFilter(c.id)}
              >
                {c.short}
              </button>
            ))}
          </div>
        </div>

        <div className="adm-card adm-table-card">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Produit</th>
                <th>Gamme</th>
                <th>Format</th>
                <th>Vedette</th>
                <th className="ta-r">Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div className="adm-prod">
                      <div className="adm-thumb">
                        <img src={imgUrl(p.image?.key)} alt={p.name} />
                      </div>
                      <div className="adm-prod-meta">
                        <div className="adm-prod-name">{p.name}</div>
                        <div className="adm-prod-desc">{p.descShort}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="chip chip-accent">
                      {catShort[p.categoryId] ?? p.categoryId}
                    </span>
                  </td>
                  <td>
                    <span className="adm-fmt">{p.format}</span>
                  </td>
                  <td>
                    <input
                      type="checkbox"
                      checked={p.featured}
                      onChange={(e) => toggle(p.id, e.target.checked)}
                    />
                  </td>
                  <td className="ta-r">
                    <div className="adm-row-actions">
                      <Link
                        to="/admin/produits/$id"
                        params={{ id: p.id }}
                        className="adm-icbtn"
                        title="Modifier"
                      >
                        <Icon name="edit" size={17} />
                      </Link>
                      <button
                        className="adm-icbtn danger"
                        title="Supprimer"
                        onClick={() => setConfirm({ id: p.id, name: p.name })}
                      >
                        <Icon name="trash" size={17} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {list.length === 0 && (
            <div className="adm-empty">
              <Icon name="search" size={40} stroke={1.4} />
              <div>Aucun produit ne correspond à votre recherche.</div>
            </div>
          )}
        </div>
      </div>

      {confirm && (
        <ConfirmDialog
          message={`Le produit « ${confirm.name} » et ses images seront retirés du catalogue. Cette action est définitive.`}
          busy={busy}
          onConfirm={remove}
          onCancel={() => setConfirm(null)}
        />
      )}
    </>
  )
}
