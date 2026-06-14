import { Link, useNavigate } from '@tanstack/react-router'
import { authClient } from '#/lib/auth-client'
import { useIsMobile } from '#/lib/use-is-mobile'
import { LogoChip } from '#/components/LogoChip'
import { Icon } from '#/components/Icon'

const NAV = [
  { to: '/admin/produits', label: 'Produits', icon: 'box' },
  { to: '/admin/categories', label: 'Gammes', icon: 'layers' },
  { to: '/admin/parametres', label: 'Paramètres', icon: 'gear' },
] as const

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
  const mobile = useIsMobile()
  async function logout() {
    await authClient.signOut()
    navigate({ to: '/admin/login' })
  }

  if (mobile) {
    return (
      <div className="adm-m">
        <div className="adm-m-scroll">{children}</div>
        <nav className="am-nav">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="am-nav-i"
              activeProps={{ className: 'am-nav-i is-active' }}
            >
              <Icon name={n.icon} size={22} />
              <span>{n.label}</span>
            </Link>
          ))}
        </nav>
      </div>
    )
  }

  return (
    <div className="admin">
      <aside className="adm-side">
        <Link to="/admin/produits" className="adm-side-brand">
          <LogoChip />
          <div className="asb-w">
            <b>NSDPF</b>
            <span>Administration</span>
          </div>
        </Link>
        <nav className="adm-nav">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="adm-navitem"
              activeProps={{ className: 'adm-navitem is-active' }}
            >
              <Icon name={n.icon} size={20} />
              <span>{n.label}</span>
            </Link>
          ))}
        </nav>
        <div className="adm-side-foot">
          <a className="adm-sidelink" href="/" target="_blank" rel="noopener">
            <Icon name="external" size={18} />
            <span>Voir le catalogue</span>
          </a>
          <button className="adm-sidelink" type="button" onClick={logout}>
            <Icon name="logout" size={18} />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>
      <main className="adm-main">{children}</main>
    </div>
  )
}
