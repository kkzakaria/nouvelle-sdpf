export function Badge({
  children,
  accent = false,
}: {
  children: React.ReactNode
  accent?: boolean
}) {
  return (
    <span className={accent ? 'chip chip-accent' : 'chip'}>{children}</span>
  )
}
