import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { getSettings } from '#/lib/catalog'
import { adminUpdateSettings } from '#/lib/admin-settings'
import { useIsMobile } from '#/lib/use-is-mobile'
import { Icon } from '#/components/Icon'

export const Route = createFileRoute('/admin/_authed/parametres')({
  loader: async () => ({ settings: await getSettings() }),
  component: Settings,
})

type Form = {
  whatsapp_number: string
  contact_phone: string
  contact_phone_call: string
  contact_email: string
  contact_address: string
}

function Settings() {
  const { settings } = Route.useLoaderData()
  const router = useRouter()
  const mobile = useIsMobile()
  const [form, setForm] = useState<Form>({
    whatsapp_number: settings.whatsapp_number,
    contact_phone: settings.contact_phone,
    contact_phone_call: settings.contact_phone_call,
    contact_email: settings.contact_email,
    contact_address: settings.contact_address,
  })
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const set = (k: keyof Form, v: string) => {
    setSaved(false)
    setForm((s) => ({ ...s, [k]: v }))
  }
  const waClean = form.whatsapp_number.replace(/[^0-9]/g, '')

  async function save() {
    setError('')
    setSaved(false)
    setBusy(true)
    try {
      await adminUpdateSettings({ data: form })
      await router.invalidate()
      setSaved(true)
    } catch {
      setError("Échec de l'enregistrement.")
    } finally {
      setBusy(false)
    }
  }

  if (mobile) {
    return (
      <>
        <header className="amb">
          <div className="amb-row">
            <div style={{ minWidth: 0 }}>
              <div className="amb-lab">Configuration</div>
              <h1 className="amb-h1">Paramètres</h1>
            </div>
            <button
              className="amb-add icon-only"
              aria-label="Enregistrer"
              onClick={save}
              disabled={busy}
            >
              <Icon name="save" size={19} />
            </button>
          </div>
        </header>
        <div className="amb-body">
          <div className="am-card">
            <div className="am-set-head">
              <Icon name="pin" size={17} />
              <h3>Coordonnées</h3>
            </div>
            <div className="am-field">
              <label className="field-label">Adresse</label>
              <input
                className="field"
                value={form.contact_address}
                onChange={(e) => set('contact_address', e.target.value)}
              />
            </div>
            <div className="am-field">
              <label className="field-label">Téléphone affiché (WhatsApp)</label>
              <input
                className="field"
                value={form.contact_phone}
                onChange={(e) => set('contact_phone', e.target.value)}
              />
            </div>
            <div className="am-field">
              <label className="field-label">Téléphone appels &amp; SMS</label>
              <input
                className="field"
                value={form.contact_phone_call}
                onChange={(e) => set('contact_phone_call', e.target.value)}
              />
            </div>
            <div className="am-field">
              <label className="field-label">E-mail de contact</label>
              <input
                className="field"
                value={form.contact_email}
                onChange={(e) => set('contact_email', e.target.value)}
              />
            </div>
          </div>

          <div className="am-card" style={{ marginTop: 14 }}>
            <div className="am-set-head">
              <Icon name="wa" size={17} />
              <h3>WhatsApp</h3>
            </div>
            <div className="am-field">
              <label className="field-label">
                Numéro WhatsApp pour le devis
              </label>
              <input
                className="field"
                value={form.whatsapp_number}
                onChange={(e) => set('whatsapp_number', e.target.value)}
                placeholder="+225 07 17 59 30 30"
              />
            </div>
            <div className="am-wa-prev">
              <Icon name="wa" size={15} /> wa.me/{waClean || '…'}
            </div>
          </div>

          {error ? (
            <div className="am-err" style={{ marginTop: 14 }}>
              {error}
            </div>
          ) : null}

          <button
            className="btn btn-primary btn-block btn-lg"
            style={{ marginTop: 14 }}
            onClick={save}
            disabled={busy}
          >
            <Icon name="save" size={18} />{' '}
            {busy ? 'Enregistrement…' : 'Enregistrer les modifications'}
          </button>
        </div>
        {saved && (
          <div className="am-toast">
            <Icon name="check" size={16} stroke={2.6} /> Modifications enregistrées
          </div>
        )}
      </>
    )
  }

  return (
    <>
      <div className="adm-topbar">
        <div>
          <h1 className="adm-h1">Paramètres</h1>
          <p className="adm-sub">
            Coordonnées et informations affichées sur le site.
          </p>
        </div>
        <button className="btn btn-primary" onClick={save} disabled={busy}>
          <Icon name="save" size={17} /> {busy ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </div>

      <div className="adm-body">
        <div className="adm-settings">
          <section className="adm-card adm-set-card">
            <div className="adm-set-head">
              <Icon name="pin" size={18} />
              <h3>Coordonnées</h3>
            </div>
            <div className="adm-field">
              <label className="field-label">Adresse</label>
              <input
                className="field"
                value={form.contact_address}
                onChange={(e) => set('contact_address', e.target.value)}
              />
            </div>
            <div className="adm-grid2">
              <div className="adm-field">
                <label className="field-label">
                  Téléphone affiché (WhatsApp)
                </label>
                <input
                  className="field"
                  value={form.contact_phone}
                  onChange={(e) => set('contact_phone', e.target.value)}
                />
              </div>
              <div className="adm-field">
                <label className="field-label">Téléphone appels &amp; SMS</label>
                <input
                  className="field"
                  value={form.contact_phone_call}
                  onChange={(e) => set('contact_phone_call', e.target.value)}
                />
              </div>
            </div>
            <div className="adm-field" style={{ marginBottom: 0 }}>
              <label className="field-label">E-mail de contact</label>
              <input
                className="field"
                value={form.contact_email}
                onChange={(e) => set('contact_email', e.target.value)}
              />
            </div>
          </section>

          <section className="adm-card adm-set-card">
            <div className="adm-set-head">
              <Icon name="wa" size={18} />
              <h3>WhatsApp</h3>
            </div>
            <div className="adm-field" style={{ marginBottom: 0 }}>
              <label className="field-label">
                Numéro WhatsApp pour le devis (international)
              </label>
              <input
                className="field"
                value={form.whatsapp_number}
                onChange={(e) => set('whatsapp_number', e.target.value)}
                placeholder="+225 07 17 59 30 30"
              />
            </div>
            <div className="adm-wa-prev">
              <Icon name="wa" size={16} /> wa.me/{waClean || '…'}
            </div>
          </section>

          {error ? <div className="adm-err">{error}</div> : null}
          {saved && (
            <div className="adm-saved">
              <Icon name="check" size={16} stroke={2.6} /> Modifications
              enregistrées
            </div>
          )}
        </div>
      </div>
    </>
  )
}
