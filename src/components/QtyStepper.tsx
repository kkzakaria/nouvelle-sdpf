import { Icon } from './Icon'

export function QtyStepper({
  qty,
  onChange,
}: {
  qty: number
  onChange: (q: number) => void
}) {
  return (
    <span className="qty">
      <button
        type="button"
        aria-label="Diminuer"
        onClick={() => onChange(qty - 1)}
      >
        <Icon name="minus" size={15} />
      </button>
      <span>{qty}</span>
      <button
        type="button"
        aria-label="Augmenter"
        onClick={() => onChange(qty + 1)}
      >
        <Icon name="plus" size={15} />
      </button>
    </span>
  )
}
