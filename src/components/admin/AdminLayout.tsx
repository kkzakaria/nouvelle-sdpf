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
          <Link to="/admin" activeOptions={{ exact: true }} activeProps={{ className: 'is-active' }}>
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
