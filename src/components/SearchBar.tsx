import { Icon } from './Icon'

export function SearchBar({ value, onChange, placeholder = 'Rechercher…', onSubmit }: {
  value: string; onChange: (v: string) => void; placeholder?: string; onSubmit?: () => void
}) {
  return (
    <form className="searchbar" onSubmit={(e) => { e.preventDefault(); onSubmit?.() }}>
      <Icon name="search" size={20} />
      <input placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
      {value && <span onClick={() => onChange('')} style={{ cursor: 'pointer', color: 'var(--muted)', fontSize: 18 }}>✕</span>}
    </form>
  )
}
