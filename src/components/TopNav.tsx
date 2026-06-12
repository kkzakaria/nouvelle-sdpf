import { Link } from '@tanstack/react-router'
import { LogoChip } from './LogoChip'
import { Icon } from './Icon'
import { useDevis } from '#/lib/devis-store'

export function TopNav({ whatsapp }: { whatsapp: string }) {
  const { count } = useDevis()
  return (
    <header className="topnav">
      <div className="topnav-inner">
        <Link to="/" className="topnav-brand">
          <LogoChip />
          <span className="topnav-name">
            NSDPF<small>PLÂTRE &amp; FILASSE</small>
          </span>
        </Link>
        <nav className="topnav-links">
          <Link to="/" activeOptions={{ exact: true }} activeProps={{ className: 'is-active' }}>
            Accueil
          </Link>
          <Link to="/catalogue" activeProps={{ className: 'is-active' }}>
            Catalogue
          </Link>
          <Link to="/contact" activeProps={{ className: 'is-active' }}>
            Contact
          </Link>
        </nav>
        <div className="topnav-actions">
          <a
            className="btn btn-wa"
            href={`https://wa.me/${whatsapp.replace(/[^0-9]/g, '')}`}
            target="_blank"
            rel="noopener"
          >
            <Icon name="wa" size={18} /> WhatsApp
          </a>
          <Link to="/devis" className="btn btn-brand">
            <Icon name="doc" size={18} /> Mon devis
            {count > 0 ? ` (${count})` : ''}
          </Link>
        </div>
      </div>
    </header>
  )
}
