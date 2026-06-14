import { useState } from 'react'
import {
  adminCreateCategory,
  adminUpdateCategory,
} from '#/lib/admin-categories'
import { Icon } from '#/components/Icon'
import { useIsMobile } from '#/lib/use-is-mobile'

type Category = {
  id: string
  label: string
  short: string
  description: string
  sortOrder: number
}

export function GammeModal({
  category,
  onClose,
  onSaved,
}: {
  category: Category | null
  onClose: () => void
  onSaved: () => void
}) {
  const mobile = useIsMobile()
  const isNew = !category
  const [label, setLabel] = useState(category?.label ?? '')
  const [short, setShort] = useState(category?.short ?? '')
  const [description, setDescription] = useState(category?.description ?? '')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const valid = label.trim() !== '' && short.trim() !== ''

  async function save() {
    if (!valid) return
    setBusy(true)
    setError('')
    try {
      if (category) {
        await adminUpdateCategory({
          data: {
            id: category.id,
            label,
            short,
            description,
            sortOrder: category.sortOrder,
          },
        })
      } else {
        await adminCreateCategory({
          data: { label, short, description, sortOrder: 0 },
        })
      }
      onSaved()
    } catch {
      setError("Échec de l'enregistrement.")
      setBusy(false)
    }
  }

  const fields = (
    <>
      <div className="adm-field am-field">
        <label className="field-label">Nom complet</label>
        <input
          className="field"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Ex. Plâtres de construction"
          autoFocus
        />
      </div>
      <div className="adm-field am-field">
        <label className="field-label">Nom court (menu &amp; filtres)</label>
        <input
          className="field"
          value={short}
          onChange={(e) => setShort(e.target.value)}
          placeholder="Ex. Plâtres"
        />
      </div>
      <div className="adm-field am-field">
        <label className="field-label">Description</label>
        <textarea
          className="field"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Courte description de la gamme"
        />
      </div>
      {error ? <div className="adm-err am-err">{error}</div> : null}
    </>
  )
  const title = isNew ? 'Nouvelle gamme' : 'Modifier la gamme'

  if (mobile) {
    return (
      <div className="am-sheet-back" onClick={onClose}>
        <div className="am-sheet" onClick={(e) => e.stopPropagation()}>
          <div className="am-sheet-grip" />
          <div className="am-sheet-head">
            <h3>{title}</h3>
            <button className="am-icbtn" type="button" onClick={onClose}>
              <Icon name="x" size={18} />
            </button>
          </div>
          <div className="am-sheet-body">{fields}</div>
          <div className="am-sheet-foot">
            <button className="btn btn-ghost" type="button" onClick={onClose}>
              Annuler
            </button>
            <button
              className="btn btn-primary"
              type="button"
              disabled={!valid || busy}
              onClick={save}
            >
              {busy ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="adm-modal-back" onClick={onClose}>
      <div className="adm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="adm-modal-head">
          <h3>{title}</h3>
          <button className="adm-icbtn" type="button" onClick={onClose}>
            <Icon name="x" size={18} />
          </button>
        </div>
        <div className="adm-modal-body">{fields}</div>
        <div className="adm-modal-foot">
          <button className="btn btn-ghost" type="button" onClick={onClose}>
            Annuler
          </button>
          <button
            className="btn btn-primary"
            type="button"
            disabled={!valid || busy}
            onClick={save}
          >
            {busy ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  )
}
