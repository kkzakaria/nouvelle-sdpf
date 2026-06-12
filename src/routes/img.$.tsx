import { createFileRoute } from '@tanstack/react-router'
import { env } from 'cloudflare:workers'

export const Route = createFileRoute('/img/$')({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const key = params._splat
        // Restreint aux clés publiques du catalogue (pas de traversée de chemin).
        const ALLOWED = ['products/', 'library/']
        if (
          !key ||
          key.includes('..') ||
          !ALLOWED.some((prefix) => key.startsWith(prefix))
        ) {
          return new Response('Not found', { status: 404 })
        }
        const object = await env.IMAGES.get(key)
        if (!object) return new Response('Not found', { status: 404 })
        const headers = new Headers()
        object.writeHttpMetadata(headers)
        headers.set('etag', object.httpEtag)
        headers.set('Cache-Control', 'public, max-age=31536000, immutable')
        return new Response(object.body, { headers })
      },
    },
  },
})
