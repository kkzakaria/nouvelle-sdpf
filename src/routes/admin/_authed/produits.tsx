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
