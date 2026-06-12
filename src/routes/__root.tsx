import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
} from '@tanstack/react-router'
import appCss from '#/styles.css?url'
import { DevisProvider } from '#/lib/devis-store'
import { AppShell } from '#/components/AppShell'
import { getSettings } from '#/lib/catalog'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Catalogue NSDPF — Plâtre & Filasse' },
    ],
    links: [
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      {
        rel: 'preconnect',
        href: 'https://fonts.gstatic.com',
        crossOrigin: 'anonymous' as const,
      },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700;800&family=Barlow:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap',
      },
      { rel: 'stylesheet', href: appCss },
    ],
  }),
  loader: async () => ({ settings: await getSettings() }),
  component: RootComponent,
  shellComponent: RootDocument,
})

function RootComponent() {
  const { settings } = Route.useLoaderData()
  return (
    <DevisProvider>
      <AppShell whatsapp={settings.whatsapp_number}>
        <Outlet />
      </AppShell>
    </DevisProvider>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  )
}
