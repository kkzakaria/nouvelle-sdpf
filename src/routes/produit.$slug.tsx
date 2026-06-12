import { createFileRoute, Link, notFound } from '@tanstack/react-router'
import { getProductBySlug, getProducts, getSettings } from '#/lib/catalog'
import { Photo } from '#/components/Photo'
import { Icon } from '#/components/Icon'
import { Badge } from '#/components/Badge'
import { useDevis } from '#/lib/devis-store'
import { buildWaUrl } from '#/lib/wa'

export const Route = createFileRoute('/produit/$slug')({
  loader: async ({ params }) => {
    const product = await getProductBySlug({ data: params.slug })
    if (!product) throw notFound()
    const [all, settings] = await Promise.all([getProducts(), getSettings()])
    const related = all
      .filter((p) => p.categoryId === product.categoryId && p.id !== product.id)
      .slice(0, 4)
    return { product, related, whatsapp: settings.whatsapp_number }
  },
  component: Detail,
})

function Detail() {
  const { product, related, whatsapp } = Route.useLoaderData()
  const { has, toggle } = useDevis()
  const inDevis = has(product.id)
  const waUrl = buildWaUrl(
    whatsapp,
    `Bonjour NSDPF, je souhaite un devis pour :\n• ${product.name} (${product.format})\n\nMerci.`,
  )

  return (
    <div className="pb-nav">
      <div className="detail-media">
        <Link to="/catalogue" className="detail-back" aria-label="Retour">
          <Icon name="back" size={22} />
        </Link>
        <Photo image={product.images[0]} alt={product.name} height={300} />
      </div>
      <div className="pad detail-body fade-in">
        <Badge>{product.format}</Badge>
        <h1 className="detail-title">{product.name}</h1>
        <p className="detail-desc">{product.descLong}</p>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            marginTop: 22,
          }}
        >
          <button
            className={
              'btn btn-block btn-lg ' + (inDevis ? 'btn-brand' : 'btn-primary')
            }
            onClick={() => toggle(product.id)}
          >
            <Icon name={inDevis ? 'check' : 'plus'} size={20} stroke={2.4} />
            {inDevis ? 'Ajouté au devis' : 'Ajouter au devis'}
          </button>
          <a
            className="btn btn-wa btn-block btn-lg"
            href={waUrl}
            target="_blank"
            rel="noopener"
          >
            <Icon name="wa" size={20} /> Commander via WhatsApp
          </a>
        </div>

        {related.length > 0 && (
          <>
            <div className="section-head">
              <span className="sh-title">Dans la même gamme</span>
            </div>
            <div className="related-row">
              {related.map((p) => (
                <Link
                  key={p.id}
                  to="/produit/$slug"
                  params={{ slug: p.slug }}
                  className="card pcard related-card"
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <Photo image={p.images[0]} alt={p.name} height={104} />
                  <div className="pc-body">
                    <div className="pc-name" style={{ fontSize: 13 }}>
                      {p.name}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
