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
