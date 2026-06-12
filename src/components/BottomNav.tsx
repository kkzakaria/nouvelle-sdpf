import { Link, useRouterState } from '@tanstack/react-router'
import { Icon } from './Icon'
import { useDevis } from '#/lib/devis-store'

type NavItem = {
  to: '/' | '/catalogue' | '/devis' | '/contact'
  label: string
  icon: string
}

const ITEMS: NavItem[] = [
  { to: '/', label: 'Accueil', icon: 'home' },
  { to: '/catalogue', label: 'Catalogue', icon: 'grid' },
  { to: '/devis', label: 'Devis', icon: 'doc' },
  { to: '/contact', label: 'Contact', icon: 'phone' },
]

export function BottomNav() {
  const { count } = useDevis()
  const path = useRouterState({ select: (s) => s.location.pathname })
  return (
    <nav className="bottomnav">
      {ITEMS.map((it) => {
        const on = it.to === '/' ? path === '/' : path.startsWith(it.to)
        return (
          <Link
            key={it.to}
            to={it.to}
            className="navitem"
            data-on={on ? 'true' : 'false'}
          >
            <Icon name={it.icon} size={23} stroke={on ? 2.4 : 2} />
            <span>{it.label}</span>
            {it.to === '/devis' && count > 0 && (
              <span className="nav-badge">{count}</span>
            )}
          </Link>
        )
      })}
    </nav>
  )
}
