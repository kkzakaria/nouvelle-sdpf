import { Icon } from '#/components/Icon'
import { useIsMobile } from '#/lib/use-is-mobile'

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
  const mobile = useIsMobile()

  if (mobile) {
    return (
      <div className="am-sheet-back" onClick={onCancel}>
        <div className="am-sheet" onClick={(e) => e.stopPropagation()}>
          <div className="am-sheet-grip" />
          <div className="am-confirm">
            <div className="acf-ic">
              <Icon name="trash" size={24} />
            </div>
            <h3>Confirmer la suppression</h3>
            <p>{message}</p>
            <div className="am-confirm-foot">
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
      </div>
    )
  }

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
