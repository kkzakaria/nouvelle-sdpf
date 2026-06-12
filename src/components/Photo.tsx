import { imgUrl } from '#/lib/img'

export function Photo({
  image,
  alt,
  height = 140,
}: {
  image?: { key: string; alt: string }
  alt: string
  height?: number
}) {
  return (
    <div
      className="photo"
      style={{
        height,
        background: '#fff',
        padding: 8,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <img
        src={imgUrl(image?.key)}
        alt={image?.alt || alt}
        loading="lazy"
        style={{
          maxWidth: '100%',
          maxHeight: '100%',
          width: 'auto',
          height: 'auto',
          objectFit: 'contain',
          display: 'block',
        }}
      />
    </div>
  )
}
