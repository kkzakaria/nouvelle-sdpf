import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { getProducts, getSettings } from '#/lib/catalog'
import { useDevis } from '#/lib/devis-store'
import { QtyStepper } from '#/components/QtyStepper'
import { Icon } from '#/components/Icon'
import { buildWaUrl, buildDevisMessage } from '#/lib/wa'

export const Route = createFileRoute('/devis')({
  loader: async () => {
    const [products, settings] = await Promise.all([
      getProducts(),
      getSettings(),
    ])
    return { products, whatsapp: settings.whatsapp_number }
  },
  component: DevisPage,
})

function DevisPage() {
  const { products, whatsapp } = Route.useLoaderData()
  const { devis, setQty, remove, clear } = useDevis()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [note, setNote] = useState('')

  const ids = Object.keys(devis)
  const lines = ids
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => !!p)
    .map((p) => ({
      id: p.id,
      name: p.name,
      format: p.format,
      qty: devis[p.id],
    }))

  const waUrl = buildWaUrl(
    whatsapp,
    buildDevisMessage(lines, { name, phone, note }),
  )

  if (lines.length === 0) {
    return (
      <div className="pb-nav">
        <div className="appbar">
          <div className="bar-title">Mon devis</div>
        </div>
        <div className="empty" style={{ paddingTop: 60 }}>
          <div className="em-ic">
            <Icon name="doc" size={52} stroke={1.4} />
          </div>
          <div className="empty-title">Votre devis est vide</div>
          <p style={{ maxWidth: 240, margin: '0 auto 20px' }}>
            Ajoutez des produits depuis le catalogue pour préparer votre
            demande.
          </p>
          <Link to="/catalogue" className="btn btn-primary">
            Parcourir le catalogue
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="pb-nav">
      <div className="appbar">
        <div className="bar-title">Mon devis</div>
      </div>
      <div className="pad">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
          }}
        >
          <span className="label" style={{ color: 'var(--muted)' }}>
            {lines.length} produit{lines.length > 1 ? 's' : ''}
          </span>
          <span
            className="sh-link"
            style={{ cursor: 'pointer' }}
            onClick={clear}
          >
            Vider
          </span>
        </div>

        <div className="devis-list">
          {lines.map((l) => (
            <div key={l.id} className="devis-row card">
              <div className="devis-info">
                <div className="pc-name">{l.name}</div>
                <div className="label" style={{ color: 'var(--muted)' }}>
                  {l.format}
                </div>
              </div>
              <QtyStepper qty={l.qty} onChange={(qq) => setQty(l.id, qq)} />
              <button
                className="devis-del"
                aria-label="Retirer"
                onClick={() => remove(l.id)}
              >
                <Icon name="x" size={18} />
              </button>
            </div>
          ))}
        </div>

        <div className="devis-form">
          <label className="field-label">Nom</label>
          <input
            className="field"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Votre nom"
          />
          <label className="field-label" style={{ marginTop: 12 }}>
            Téléphone
          </label>
          <input
            className="field"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Votre numéro"
          />
          <label className="field-label" style={{ marginTop: 12 }}>
            Note
          </label>
          <textarea
            className="field"
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Précisions (chantier, délais…)"
          />
        </div>

        <a
          className="btn btn-wa btn-block btn-lg"
          style={{ marginTop: 18 }}
          href={waUrl}
          target="_blank"
          rel="noopener"
        >
          <Icon name="wa" size={20} /> Envoyer sur WhatsApp
        </a>
      </div>
    </div>
  )
}
