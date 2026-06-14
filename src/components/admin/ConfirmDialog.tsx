import { Icon } from '#/components/Icon'

export function ConfirmDialog({
  message,
  busy = false,
  onConfirm,
  onCancel,
}: {
  message: string
  busy?: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div className="adm-modal-back" onClick={onCancel}>
      <div
        className="adm-modal adm-confirm"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="acf-ic">
          <Icon name="trash" size={22} />
        </div>
        <h3>Confirmer la suppression</h3>
        <p>{message}</p>
        <div className="adm-confirm-foot">
          <button className="btn btn-ghost" type="button" onClick={onCancel}>
            Annuler
          </button>
          <button
            className="btn btn-danger"
            type="button"
            disabled={busy}
            onClick={onConfirm}
          >
            {busy ? 'Suppression…' : 'Supprimer'}
          </button>
        </div>
      </div>
    </div>
  )
}
