import { createFileRoute } from '@tanstack/react-router'
import { getSettings } from '#/lib/catalog'
import { Icon } from '#/components/Icon'
import { buildWaUrl } from '#/lib/wa'

export const Route = createFileRoute('/contact')({
  loader: async () => ({ settings: await getSettings() }),
  component: Contact,
})

function Contact() {
  const { settings } = Route.useLoaderData()
  const wa = settings.whatsapp_number
  const callHref = settings.contact_phone_call.replace(/\s+/g, '')
  return (
    <div className="pb-nav">
      <div className="appbar">
        <div className="bar-title">Contact</div>
      </div>
      <div className="pad">
        <div className="card contact-card">
          <a
            className="contact-row"
            href={buildWaUrl(wa, 'Bonjour NSDPF,')}
            target="_blank"
            rel="noopener"
          >
            <Icon name="wa" size={20} />
            <span>
              <b>WhatsApp</b>
              <br />
              {settings.contact_phone}
            </span>
          </a>
          <a className="contact-row" href={`tel:${callHref}`}>
            <Icon name="phone" size={20} />
            <span>
              <b>Appels &amp; SMS</b>
              <br />
              {settings.contact_phone_call}
            </span>
          </a>
          <a className="contact-row" href={`mailto:${settings.contact_email}`}>
            <Icon name="mail" size={20} />
            <span>{settings.contact_email}</span>
          </a>
          <div className="contact-row">
            <Icon name="pin" size={20} />
            <span>{settings.contact_address}</span>
          </div>
        </div>

        <div className="contact-actions">
          <a
            className="btn btn-wa btn-lg"
            href={buildWaUrl(wa, 'Bonjour NSDPF,')}
            target="_blank"
            rel="noopener"
          >
            <Icon name="wa" size={20} /> WhatsApp
          </a>
          <a className="btn btn-brand btn-lg" href={`tel:${callHref}`}>
            <Icon name="phone" size={20} /> Appeler
          </a>
          <a className="btn btn-ghost btn-lg" href={`sms:${callHref}`}>
            <Icon name="doc" size={20} /> SMS
          </a>
        </div>
      </div>
    </div>
  )
}
