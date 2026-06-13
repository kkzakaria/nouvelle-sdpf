import { useState } from 'react'
import { useRouter } from '@tanstack/react-router'
import {
  adminCreateProduct,
  adminUpdateProduct,
} from '#/lib/admin-products'
import {
  adminDeleteImage,
  adminReorderImages,
  adminUploadImage,
} from '#/lib/admin-images'

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
  const [f, setF] = useState<ProductFormData>(initial)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const isNew = !f.id

  async function save(e: React.FormEvent) {
    e.preventDefault()
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
        await router.navigate({ to: '/admin/produits/$id', params: { id } })
      }
    } catch {
      setError('Échec de l’enregistrement.')
    } finally {
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
      // Reflète tout de suite la nouvelle image (le composant ne se remonte pas
      // tant que l'id de produit ne change pas) ; invalidate resynchronise le loader.
      setF((prev) => ({
        ...prev,
        images: [
          ...prev.images,
          { id, key, alt: '', sortOrder: prev.images.length },
        ],
      }))
      await router.invalidate()
      e.target.value = ''
    } catch {
      setError('Échec de l’envoi de l’image (type/taille ?).')
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
      setError('Échec de la suppression de l’image.')
    }
  }

  async function move(index: number, dir: -1 | 1) {
    const j = index + dir
    if (j < 0 || j >= f.images.length) return
    setError('')
    const next = [...f.images]
    ;[next[index], next[j]] = [next[j], next[index]]
    setF((prev) => ({ ...prev, images: next }))
    try {
      await adminReorderImages({ data: { orderedIds: next.map((im) => im.id) } })
      await router.invalidate()
    } catch {
      setError('Échec du réordonnancement.')
    }
  }

  return (
    <form className="admin-card" onSubmit={save}>
      <h1 className="admin-h1">
        {isNew ? 'Nouveau produit' : `Modifier « ${f.name} »`}
      </h1>
      {error ? <p className="admin-error">{error}</p> : null}

      <label className="admin-field">
        <span>Nom</span>
        <input
          value={f.name}
          onChange={(e) => setF({ ...f, name: e.target.value })}
          required
        />
      </label>
      <label className="admin-field">
        <span>Gamme</span>
        <select
          value={f.categoryId}
          onChange={(e) => setF({ ...f, categoryId: e.target.value })}
          required
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
      </label>
      <label className="admin-field">
        <span>Format / conditionnement</span>
        <input
          value={f.format}
          onChange={(e) => setF({ ...f, format: e.target.value })}
        />
      </label>
      <label className="admin-field">
        <span>Description courte</span>
        <textarea
          value={f.descShort}
          onChange={(e) => setF({ ...f, descShort: e.target.value })}
        />
      </label>
      <label className="admin-field">
        <span>Description longue</span>
        <textarea
          value={f.descLong}
          onChange={(e) => setF({ ...f, descLong: e.target.value })}
        />
      </label>
      <label className="admin-field" style={{ flexDirection: 'row', gap: 8 }}>
        <input
          type="checkbox"
          checked={f.featured}
          onChange={(e) => setF({ ...f, featured: e.target.checked })}
        />
        <span>Produit vedette</span>
      </label>
      <label className="admin-field">
        <span>Ordre</span>
        <input
          type="number"
          value={f.sortOrder}
          onChange={(e) => setF({ ...f, sortOrder: Number(e.target.value) })}
        />
      </label>

      <div className="admin-row-actions">
        <button className="btn btn-brand" type="submit" disabled={busy}>
          {busy ? 'Enregistrement…' : isNew ? 'Créer' : 'Enregistrer'}
        </button>
      </div>

      {!isNew ? (
        <div style={{ marginTop: 24 }}>
          <h2>Images</h2>
          <div className="admin-images">
            {f.images.map((im, i) => (
              <div key={im.id} className="admin-img">
                <img src={`/img/${im.key}`} alt={im.alt} />
                <div className="admin-row-actions">
                  <button type="button" className="btn" onClick={() => move(i, -1)}>
                    ↑
                  </button>
                  <button type="button" className="btn" onClick={() => move(i, 1)}>
                    ↓
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => deleteImg(im.id)}
                  >
                    Suppr.
                  </button>
                </div>
              </div>
            ))}
          </div>
          <label className="admin-field" style={{ marginTop: 12 }}>
            <span>Ajouter une image (png, jpeg, webp — max 5 Mo)</span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={upload}
            />
          </label>
        </div>
      ) : (
        <p style={{ marginTop: 16, color: '#5a6b7b' }}>
          Enregistrez d&apos;abord le produit pour pouvoir ajouter des images.
        </p>
      )}
    </form>
  )
}
