import { Link } from '@tanstack/react-router'
import { LogoChip } from './LogoChip'
import { Icon } from './Icon'
import { useDevis } from '#/lib/devis-store'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const AnyLink = Link as any

// Routes /catalogue, /contact, /devis registered in P2-G/H

export function TopNav({ whatsapp }: { whatsapp: string }) {
  const { count } = useDevis()
  return (
    <header className="topnav">
      <Link to="/" className="topnav-brand">
        <LogoChip />
        <span className="topnav-name">NSDPF<small>PLÂTRE &amp; FILASSE</small></span>
      </Link>
      <nav className="topnav-links">
        <Link to="/">Accueil</Link>
        <AnyLink to="/catalogue">Catalogue</AnyLink>
        <AnyLink to="/contact">Contact</AnyLink>
      </nav>
      <div className="topnav-actions">
        <a className="btn btn-wa" href={`https://wa.me/${whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener">
          <Icon name="wa" size={18} /> WhatsApp
        </a>
        <AnyLink to="/devis" className="btn btn-brand">
          <Icon name="doc" size={18} /> Mon devis{count > 0 ? ` (${count})` : ''}
        </AnyLink>
      </div>
    </header>
  )
}
