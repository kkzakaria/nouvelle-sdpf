import { TopNav } from './TopNav'
import { BottomNav } from './BottomNav'

export function AppShell({ whatsapp, children }: { whatsapp: string; children: React.ReactNode }) {
  return (
    <>
      <TopNav whatsapp={whatsapp} />
      <div className="container-app">{children}</div>
      <BottomNav />
    </>
  )
}
