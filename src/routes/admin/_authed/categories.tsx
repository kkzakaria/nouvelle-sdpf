import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import {
  adminDeleteCategory,
  adminListCategories,
} from '#/lib/admin-categories'
import { adminListProducts } from '#/lib/admin-products'
import { Icon } from '#/components/Icon'
import { GammeModal } from '#/components/admin/GammeModal'
import { ConfirmDialog } from '#/components/admin/ConfirmDialog'

export const Route = createFileRoute('/admin/_authed/categories')({
  loader: async () => {
    const [categories, products] = await Promise.all([
      adminListCategories(),
      adminListProducts(),
    ])
    const counts: Record<string, number> = {}
    for (const p of products)
      counts[p.categoryId] = (counts[p.categoryId] ?? 0) + 1
    return { categories, counts }
  },
  component: Categories,
})

type Cat = {
  id: string
  label: string
  short: string
  description: string
  sortOrder: number
}

function iconFor(id: string): string {
  if (id.includes('plaque')) return 'grid'
  if (id.includes('filasse')) return 'spark'
  if (id.includes('colle') || id.includes('enduit')) return 'doc'
  if (id.includes('sanitaire')) return 'box'
  if (id.includes('outillage') || id.includes('quincaillerie')) return 'tag'
  return 'layers'
}

function Categories() {
  const { categories, counts } = Route.useLoaderData()
  const router = useRouter()
  const [modal, setModal] = useState<'new' | Cat | null>(null)
  const [confirm, setConfirm] = useState<Cat | null>(null)
  const [busy, setBusy] = useState(false)

  async function remove() {
    if (!confirm) return
    setBusy(true)
    try {
      await adminDeleteCategory({ data: { id: confirm.id } })
      setConfirm(null)
      await router.invalidate()
    } catch {
      alert('Suppression impossible : la gamme contient encore des produits.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div className="adm-topbar">
        <div>
          <h1 className="adm-h1">Gammes</h1>
          <p className="adm-sub">{categories.length} familles de produits</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal('new')}>
          <Icon name="plus" size={18} stroke={2.6} /> Nouvelle gamme
        </button>
      </div>

      <div className="adm-body">
        <div className="adm-gammes">
          {categories.map((c) => {
            const n = counts[c.id] ?? 0
            return (
              <div className="adm-card adm-gamme" key={c.id}>
                <div className="adm-gamme-icon">
                  <Icon name={iconFor(c.id)} size={26} />
                </div>
                <div className="adm-gamme-main">
                  <div className="adm-gamme-top">
                    <h3>{c.label}</h3>
                    <span className="chip">
                      {String(n).padStart(2, '0')} réf.
                    </span>
                  </div>
                  <p>{c.description || c.short}</p>
                </div>
                <div className="adm-gamme-actions">
                  <button
                    className="adm-icbtn"
                    title="Modifier"
                    onClick={() => setModal(c)}
                  >
                    <Icon name="edit" size={17} />
                  </button>
                  <button
                    className="adm-icbtn danger"
                    disabled={n > 0}
                    title={
                      n > 0
                        ? 'Gamme non vide — déplacez d’abord ses produits'
                        : 'Supprimer'
                    }
                    onClick={() => setConfirm(c)}
                  >
                    <Icon name="trash" size={17} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {modal && (
        <GammeModal
          category={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={async () => {
            setModal(null)
            await router.invalidate()
          }}
        />
      )}
      {confirm && (
        <ConfirmDialog
          message={`La gamme « ${confirm.label} » sera supprimée.`}
          busy={busy}
          onConfirm={remove}
          onCancel={() => setConfirm(null)}
        />
      )}
    </>
  )
}
