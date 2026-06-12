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
  return (
    <div className="pb-nav">
      <div className="appbar">
        <div className="bar-title">Contact</div>
      </div>
      <div className="pad">
        <div className="card contact-card">
          <div className="contact-row">
            <Icon name="phone" size={20} />
            <span>{settings.contact_phone}</span>
          </div>
          <div className="contact-row">
            <Icon name="doc" size={20} />
            <span>{settings.contact_email}</span>
          </div>
          <div className="contact-row">
            <Icon name="pin" size={20} />
            <span>{settings.contact_address}</span>
          </div>
        </div>
        <a
          className="btn btn-wa btn-block btn-lg"
          style={{ marginTop: 18 }}
          href={buildWaUrl(wa, 'Bonjour NSDPF,')}
          target="_blank"
          rel="noopener"
        >
          <Icon name="wa" size={20} /> Discuter sur WhatsApp
        </a>
      </div>
    </div>
  )
}
