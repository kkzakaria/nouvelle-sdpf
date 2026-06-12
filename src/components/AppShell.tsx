import { TopNav } from './TopNav'
import { BottomNav } from './BottomNav'
import { Footer } from './Footer'
import type { SiteSettings } from '#/lib/catalog'

export function AppShell({
  settings,
  children,
}: {
  settings: SiteSettings
  children: React.ReactNode
}) {
  return (
    <>
      <TopNav whatsapp={settings.whatsapp_number} />
      <div className="container-app">{children}</div>
      <Footer settings={settings} />
      <BottomNav />
    </>
  )
}
