import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import {
  adminCreateCategory,
  adminDeleteCategory,
  adminListCategories,
  adminUpdateCategory,
} from '#/lib/admin-categories'

export const Route = createFileRoute('/admin/_authed/categories')({
  loader: async () => ({ categories: await adminListCategories() }),
  component: Categories,
})

type Draft = {
  id?: string
  label: string
  short: string
  description: string
  sortOrder: number
}
const EMPTY: Draft = { label: '', short: '', description: '', sortOrder: 0 }

function Categories() {
  const { categories } = Route.useLoaderData()
  const router = useRouter()
  const [draft, setDraft] = useState<Draft>(EMPTY)
  const [error, setError] = useState('')
  const editing = Boolean(draft.id)

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    try {
      if (draft.id) {
        await adminUpdateCategory({
          data: {
            id: draft.id,
            label: draft.label,
            short: draft.short,
            description: draft.description,
            sortOrder: draft.sortOrder,
          },
        })
      } else {
        await adminCreateCategory({
          data: {
            label: draft.label,
            short: draft.short,
            description: draft.description,
            sortOrder: draft.sortOrder,
          },
        })
      }
      setDraft(EMPTY)
      await router.invalidate()
    } catch {
      setError('Échec de l’enregistrement.')
    }
  }

  async function remove(id: string) {
    setError('')
    try {
      await adminDeleteCategory({ data: { id } })
      await router.invalidate()
    } catch {
      setError(
        'Suppression impossible : la catégorie contient encore des produits.',
      )
    }
  }

  return (
    <div>
      <h1 className="admin-h1">Catégories</h1>
      {error ? <p className="admin-error">{error}</p> : null}

      <form className="admin-card" onSubmit={save} style={{ marginBottom: 20 }}>
        <h2>{editing ? `Modifier « ${draft.label} »` : 'Nouvelle catégorie'}</h2>
        <label className="admin-field">
          <span>Libellé</span>
          <input
            value={draft.label}
            onChange={(e) => setDraft({ ...draft, label: e.target.value })}
            required
          />
        </label>
        <label className="admin-field">
          <span>Sous-titre</span>
          <input
            value={draft.short}
            onChange={(e) => setDraft({ ...draft, short: e.target.value })}
            required
          />
        </label>
        <label className="admin-field">
          <span>Description</span>
          <textarea
            value={draft.description}
            onChange={(e) =>
              setDraft({ ...draft, description: e.target.value })
            }
          />
        </label>
        <label className="admin-field">
          <span>Ordre</span>
          <input
            type="number"
            value={draft.sortOrder}
            onChange={(e) =>
              setDraft({ ...draft, sortOrder: Number(e.target.value) })
            }
          />
        </label>
        <div className="admin-row-actions">
          <button className="btn btn-brand" type="submit">
            {editing ? 'Enregistrer' : 'Créer'}
          </button>
          {editing ? (
            <button
              className="btn"
              type="button"
              onClick={() => setDraft(EMPTY)}
            >
              Annuler
            </button>
          ) : null}
        </div>
      </form>

      <table className="admin-table">
        <thead>
          <tr>
            <th>Libellé</th>
            <th>Slug</th>
            <th>Ordre</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {categories.map((c) => (
            <tr key={c.id}>
              <td>{c.label}</td>
              <td>{c.slug}</td>
              <td>{c.sortOrder}</td>
              <td>
                <div className="admin-row-actions">
                  <button
                    className="btn"
                    type="button"
                    onClick={() =>
                      setDraft({
                        id: c.id,
                        label: c.label,
                        short: c.short,
                        description: c.description,
                        sortOrder: c.sortOrder,
                      })
                    }
                  >
                    Modifier
                  </button>
                  <button
                    className="btn btn-danger"
                    type="button"
                    onClick={() => remove(c.id)}
                  >
                    Supprimer
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
