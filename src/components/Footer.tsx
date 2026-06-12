import { Link } from '@tanstack/react-router'
import { Icon } from './Icon'
import { buildWaUrl } from '#/lib/wa'

export function Footer({ settings }: { settings: Record<string, string> }) {
  const wa = settings.whatsapp_number
  const year = new Date().getFullYear()
  return (
    <footer className="dfoot">
      <div className="dfoot-wrap">
        <div className="foot-grid">
          <div>
            <div className="foot-logo">
              <img src="/logo-nsdpf.png" alt="NSDPF" />
            </div>
            <p className="foot-about">
              Nouvelle Société de Distribution de Plâtre et Filasses. Votre
              partenaire matériaux pour la plâtrerie, l&apos;étanchéité, le
              sanitaire et la finition.
            </p>
          </div>

          <div>
            <h4>Coordonnées</h4>
            {settings.contact_address && (
              <div className="frow">
                <Icon name="pin" size={18} />
                <span>{settings.contact_address}</span>
              </div>
            )}
            {settings.contact_phone && (
              <div className="frow">
                <Icon name="wa" size={18} />
                <span>WhatsApp : {settings.contact_phone}</span>
              </div>
            )}
            {settings.contact_phone_call && (
              <div className="frow">
                <Icon name="phone" size={18} />
                <span>Appels &amp; SMS : {settings.contact_phone_call}</span>
              </div>
            )}
            {settings.contact_email && (
              <div className="frow">
                <Icon name="mail" size={18} />
                <span>{settings.contact_email}</span>
              </div>
            )}
          </div>

          <div>
            <h4>Navigation</h4>
            <div className="foot-links">
              <Link to="/">Accueil</Link>
              <Link to="/catalogue">Catalogue</Link>
              <Link to="/devis">Mon devis</Link>
              <Link to="/contact">Contact</Link>
            </div>
          </div>

          <div>
            <h4>Commande rapide</h4>
            <a
              className="btn btn-wa"
              href={buildWaUrl(wa, "Bonjour NSDPF, j'aimerais passer commande.")}
              target="_blank"
              rel="noopener"
            >
              <Icon name="wa" size={18} /> WhatsApp
            </a>
          </div>
        </div>

        <div className="foot-legal">
          <span>
            © {year} NSDPF — Nouvelle Société de Distribution de Plâtre et
            Filasses
          </span>
          <span>Catalogue indicatif · prix sur devis</span>
        </div>
      </div>
    </footer>
  )
}
