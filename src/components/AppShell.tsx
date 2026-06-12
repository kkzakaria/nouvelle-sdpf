import { TopNav } from './TopNav'
import { BottomNav } from './BottomNav'
import { Footer } from './Footer'

export function AppShell({
  settings,
  children,
}: {
  settings: Record<string, string>
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
