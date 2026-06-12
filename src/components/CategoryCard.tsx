import { Link } from '@tanstack/react-router'
import { Icon } from './Icon'
import type { CategoryDTO } from '#/lib/catalog'

const CAT_ICON: Record<string, string> = {
  platres: 'layers',
  plaques: 'grid',
  filasse: 'spark',
  finition: 'doc',
}

export function CategoryCard({
  category,
  count,
}: {
  category: CategoryDTO
  count: number
}) {
  const icon = CAT_ICON[category.slug] ?? 'layers'
  return (
    <Link
      to="/catalogue"
      search={{ cat: category.slug }}
      className="card cat-tile"
      style={{ textDecoration: 'none', color: 'inherit' }}
    >
      <div className="ct-mark">
        <Icon name={icon} size={78} stroke={1.4} />
      </div>
      <div className="label" style={{ color: 'var(--accent)' }}>
        {String(count).padStart(2, '0')} réf.
      </div>
      <div>
        <div className="ct-name">{category.short}</div>
        <div className="ct-count">{category.description}</div>
      </div>
    </Link>
  )
}
