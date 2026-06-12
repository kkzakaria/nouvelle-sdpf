import { imgUrl } from '#/lib/img'

export function Photo({ image, alt, height = 140 }: { image?: { key: string; alt: string }; alt: string; height?: number }) {
  return (
    <div className="photo" style={{ height, background: 'var(--photo-bg)' }}>
      <img
        src={imgUrl(image?.key)}
        alt={image?.alt || alt}
        loading="lazy"
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />
    </div>
  )
}
