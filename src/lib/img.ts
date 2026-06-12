/** URL publique d'une image produit servie depuis R2 via le Worker. */
export function imgUrl(key: string | undefined | null): string {
  if (!key) return '/logo-nsdpf.png'
  return `/img/${key}`
}
