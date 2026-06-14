import { useState } from 'react'
import { useNavigate, useRouter } from '@tanstack/react-router'
import {
  adminCreateProduct,
  adminDeleteProduct,
  adminUpdateProduct,
} from '#/lib/admin-products'
import {
  adminDeleteImage,
  adminReorderImages,
  adminUploadImage,
} from '#/lib/admin-images'
import { imgUrl } from '#/lib/img'
import { Icon } from '#/components/Icon'
import { ConfirmDialog } from '#/components/admin/ConfirmDialog'

type Category = { id: string; label: string }
type Image = { id: string; key: string; alt: string; sortOrder: number }
export type ProductFormData = {
  id?: string
  categoryId: string
  name: string
  format: string
  descShort: string
  descLong: string
  featured: boolean
  sortOrder: number
  images: Array<Image>
}

export function ProductForm({
  categories,
  initial,
}: {
  categories: Array<Category>
  initial: ProductFormData
}) {
  const router = useRouter()
  const navigate = useNavigate()
  const [f, setF] = useState<ProductFormData>(initial)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [confirmDel, setConfirmDel] = useState(false)
  const isNew = !f.id
  const valid = f.name.trim() !== '' && f.categoryId !== ''

  function back() {
    navigate({ to: '/admin/produits' })
  }

  async function save() {
    if (!valid) return
    setBusy(true)
    setError('')
    try {
      if (f.id) {
        await adminUpdateProduct({
          data: {
            id: f.id,
            categoryId: f.categoryId,
            name: f.name,
            format: f.format,
            descShort: f.descShort,
            descLong: f.descLong,
            featured: f.featured,
            sortOrder: f.sortOrder,
          },
        })
        await router.invalidate()
      } else {
        const { id } = await adminCreateProduct({
          data: {
            categoryId: f.categoryId,
            name: f.name,
            format: f.format,
            descShort: f.descShort,
            descLong: f.descLong,
            featured: f.featured,
            sortOrder: f.sortOrder,
          },
        })
        await navigate({ to: '/admin/produits/$id', params: { id } })
      }
    } catch {
      setError("Échec de l'enregistrement.")
    } finally {
      setBusy(false)
    }
  }

  async function del() {
    if (!f.id) return
    setBusy(true)
    try {
      await adminDeleteProduct({ data: { id: f.id } })
      await navigate({ to: '/admin/produits' })
    } catch {
      setError('Échec de la suppression.')
      setBusy(false)
    }
  }

  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !f.id) return
    setError('')
    const fd = new FormData()
    fd.set('productId', f.id)
    fd.set('file', file)
    try {
      const { id, key } = await adminUploadImage({ data: fd })
      setF((prev) => ({
        ...prev,
        images: [
          ...prev.images,
          { id, key, alt: '', sortOrder: prev.images.length },
        ],
      }))
      await router.invalidate()
    } catch {
      setError("Échec de l'envoi de l'image (type/taille ?).")
    } finally {
      e.target.value = ''
    }
  }

  async function deleteImg(id: string) {
    setError('')
    try {
      await adminDeleteImage({ data: { id } })
      setF((prev) => ({
        ...prev,
        images: prev.images.filter((im) => im.id !== id),
      }))
      await router.invalidate()
    } catch {
      setError("Échec de la suppression de l'image.")
    }
  }

  async function move(index: number, dir: -1 | 1) {
    if (!f.id) return
    const j = index + dir
    if (j < 0 || j >= f.images.length) return
    setError('')
    const previous = f.images
    const next = [...previous]
    ;[next[index], next[j]] = [next[j], next[index]]
    setF((prev) => ({ ...prev, images: next }))
    try {
      await adminReorderImages({
        data: { productId: f.id, orderedIds: next.map((im) => im.id) },
      })
      await router.invalidate()
    } catch {
      setF((prev) => ({ ...prev, images: previous }))
      setError('Échec du réordonnancement.')
    }
  }

  const cover: Image | undefined = f.images.length ? f.images[0] : undefined

  return (
    <>
      <div className="adm-topbar">
        <div className="adm-crumb">
          <button className="adm-back" type="button" onClick={back}>
            <Icon name="back" size={18} /> Produits
          </button>
          <span className="adm-crumb-sep">/</span>
          <span className="adm-crumb-cur">
            {isNew ? 'Nouveau produit' : f.name || 'Produit'}
          </span>
        </div>
        <div className="adm-topbar-actions">
          {!isNew && (
            <button
              className="btn btn-ghost adm-del-btn"
              type="button"
              onClick={() => setConfirmDel(true)}
            >
              <Icon name="trash" size={17} /> Supprimer
            </button>
          )}
          <button className="btn btn-ghost" type="button" onClick={back}>
            Annuler
          </button>
          <button
            className="btn btn-primary"
            type="button"
            disabled={!valid || busy}
            onClick={save}
          >
            <Icon name="save" size={17} /> {busy ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </div>

      <div className="adm-body">
        <div className="adm-editor">
          <div className="adm-card adm-form">
            <h2 className="adm-form-h">
              {isNew ? 'Nouveau produit' : 'Modifier le produit'}
            </h2>
            {error ? <div className="adm-err">{error}</div> : null}
            <div className="adm-field">
              <label className="field-label">Nom du produit</label>
              <input
                className="field"
                value={f.name}
                onChange={(e) => setF({ ...f, name: e.target.value })}
                placeholder="Ex. Plâtre de finition"
              />
            </div>
            <div className="adm-grid2">
              <div className="adm-field">
                <label className="field-label">Gamme</label>
                <div className="adm-select-wrap">
                  <select
                    className="field"
                    value={f.categoryId}
                    onChange={(e) => setF({ ...f, categoryId: e.target.value })}
                  >
                    <option value="" disabled>
                      — Choisir —
                    </option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                  <Icon name="chevron" size={16} />
                </div>
              </div>
              <div className="adm-field">
                <label className="field-label">Format / conditionnement</label>
                <input
                  className="field"
                  value={f.format}
                  onChange={(e) => setF({ ...f, format: e.target.value })}
                  placeholder="Ex. Sac 25 kg"
                />
              </div>
            </div>
            <div className="adm-field">
              <label className="field-label">Description courte</label>
              <input
                className="field"
                value={f.descShort}
                onChange={(e) => setF({ ...f, descShort: e.target.value })}
                placeholder="Une ligne affichée sur la carte produit"
              />
            </div>
            <div className="adm-field">
              <label className="field-label">Description détaillée</label>
              <textarea
                className="field"
                rows={5}
                value={f.descLong}
                onChange={(e) => setF({ ...f, descLong: e.target.value })}
                placeholder="Texte complet affiché sur la fiche produit"
              />
            </div>
            <label
              className="adm-field"
              style={{ display: 'flex', flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 0 }}
            >
              <input
                type="checkbox"
                checked={f.featured}
                onChange={(e) => setF({ ...f, featured: e.target.checked })}
              />
              <span className="field-label" style={{ margin: 0 }}>
                Produit vedette (page d'accueil)
              </span>
            </label>
          </div>

          <div className="adm-editor-side">
            <div className="adm-card adm-photo-card">
              <div className="adm-card-lab">Photos du produit</div>
              {isNew ? (
                <p className="adm-photo-hint">
                  Enregistrez d'abord le produit pour pouvoir ajouter des images.
                </p>
              ) : (
                <>
                  {f.images.length > 0 && (
                    <div className="adm-imgs">
                      {f.images.map((im, i) => (
                        <div key={im.id} className="adm-imgcell">
                          <img src={imgUrl(im.key)} alt={im.alt} />
                          <div className="adm-imgcell-bar">
                            <button
                              className="adm-icbtn"
                              type="button"
                              title="Monter"
                              onClick={() => move(i, -1)}
                            >
                              <Icon name="back" size={14} />
                            </button>
                            <button
                              className="adm-icbtn"
                              type="button"
                              title="Descendre"
                              onClick={() => move(i, 1)}
                            >
                              <Icon name="arrow-r" size={14} />
                            </button>
                            <button
                              className="adm-icbtn danger"
                              type="button"
                              title="Supprimer"
                              onClick={() => deleteImg(im.id)}
                            >
                              <Icon name="trash" size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <label className="btn btn-ghost adm-fileinput" style={{ marginTop: 12 }}>
                    <Icon name="image" size={16} /> Ajouter une image
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={upload}
                      style={{ display: 'none' }}
                    />
                  </label>
                  <p className="adm-photo-hint">
                    PNG, JPEG ou WebP — 5 Mo max. La première image sert de
                    couverture.
                  </p>
                </>
              )}
            </div>

            <div className="adm-card adm-preview">
              <div className="adm-card-lab">Aperçu catalogue</div>
              <div className="adm-prev-card">
                <div
                  className="photo"
                  style={{
                    height: 130,
                    background: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 8,
                  }}
                >
                  <img
                    src={imgUrl(cover?.key)}
                    alt={f.name}
                    style={{
                      maxWidth: '100%',
                      maxHeight: '100%',
                      objectFit: 'contain',
                    }}
                  />
                </div>
                <div className="adm-prev-body">
                  <div className="adm-prev-name">
                    {f.name || 'Nom du produit'}
                  </div>
                  <div className="adm-prev-desc">
                    {f.descShort || 'Description courte du produit.'}
                  </div>
                  <div className="adm-prev-foot">
                    <span className="chip">{f.format || 'Format'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {confirmDel && (
        <ConfirmDialog
          message={`Le produit « ${f.name} » et ses images seront retirés du catalogue. Cette action est définitive.`}
          busy={busy}
          onConfirm={del}
          onCancel={() => setConfirmDel(false)}
        />
      )}
    </>
  )
}
