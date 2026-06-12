import { Link } from '@tanstack/react-router'
import { Photo } from './Photo'
import { Icon } from './Icon'
import { useDevis } from '#/lib/devis-store'
import type { ProductDTO } from '#/lib/catalog'

export function ProductCard({ product }: { product: ProductDTO }) {
  const { has, toggle } = useDevis()
  const inDevis = has(product.id)
  return (
    <div className="card pcard fade-in">
      <Link
        to="/produit/$slug"
        params={{ slug: product.slug }}
        style={{ textDecoration: 'none', color: 'inherit' }}
      >
        <Photo image={product.images[0]} alt={product.name} height={180} />
        <div className="pc-body">
          <div className="pc-name">{product.name}</div>
          <div className="pc-desc">{product.format}</div>
          <div className="pc-foot">
            <span className="chip">{product.format}</span>
            <button
              className="add-btn"
              data-in={inDevis ? 'true' : 'false'}
              aria-label="Ajouter au devis"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                toggle(product.id)
              }}
            >
              <Icon name={inDevis ? 'check' : 'plus'} size={18} stroke={2.6} />
            </button>
          </div>
        </div>
      </Link>
    </div>
  )
}
