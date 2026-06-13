import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { getSettings } from '#/lib/catalog'
import { adminUpdateSettings } from '#/lib/admin-settings'

export const Route = createFileRoute('/admin/_authed/parametres')({
  loader: async () => ({ settings: await getSettings() }),
  component: Settings,
})

const FIELDS: Array<{ key: keyof Form; label: string }> = [
  { key: 'whatsapp_number', label: 'Numéro WhatsApp (devis)' },
  { key: 'contact_phone', label: 'Téléphone affiché (WhatsApp)' },
  { key: 'contact_phone_call', label: 'Téléphone appels & SMS' },
  { key: 'contact_email', label: 'E-mail de contact' },
  { key: 'contact_address', label: 'Adresse' },
]

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
  const [form, setForm] = useState<Form>({
    whatsapp_number: settings.whatsapp_number,
    contact_phone: settings.contact_phone,
    contact_phone_call: settings.contact_phone_call,
    contact_email: settings.contact_email,
    contact_address: settings.contact_address,
  })
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSaved(false)
    try {
      await adminUpdateSettings({ data: form })
      await router.invalidate()
      setSaved(true)
    } catch {
      setError("Échec de l’enregistrement.")
    }
  }

  return (
    <div>
      <h1 className="admin-h1">Paramètres de contact</h1>
      <form className="admin-card" onSubmit={save}>
        {FIELDS.map((field) => (
          <label className="admin-field" key={field.key}>
            <span>{field.label}</span>
            <input
              value={form[field.key]}
              onChange={(e) => {
                setSaved(false)
                setForm({ ...form, [field.key]: e.target.value })
              }}
            />
          </label>
        ))}
        {error ? <p className="admin-error">{error}</p> : null}
        {saved ? (
          <p style={{ color: '#1e8a4c', fontWeight: 600 }}>Enregistré.</p>
        ) : null}
        <div className="admin-row-actions">
          <button className="btn btn-brand" type="submit">
            Enregistrer
          </button>
        </div>
      </form>
    </div>
  )
}
