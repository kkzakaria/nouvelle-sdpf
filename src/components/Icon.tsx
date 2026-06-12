import {
  Home,
  LayoutGrid,
  FileText,
  Phone,
  Search,
  ArrowRight,
  ArrowLeft,
  Plus,
  Check,
  Truck,
  MapPin,
  Layers,
  X,
  Minus,
  Mail,
  Clock,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const MAP: Record<string, LucideIcon> = {
  home: Home,
  grid: LayoutGrid,
  doc: FileText,
  phone: Phone,
  mail: Mail,
  clock: Clock,
  search: Search,
  'arrow-r': ArrowRight,
  back: ArrowLeft,
  plus: Plus,
  check: Check,
  truck: Truck,
  pin: MapPin,
  layers: Layers,
  x: X,
  minus: Minus,
}

/** Logo officiel WhatsApp (glyphe rempli). lucide n'inclut pas les logos de marque. */
function WaIcon({ size, className }: { size: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 2a10 10 0 0 0-8.6 15l-1.3 4.8 4.9-1.3A10 10 0 1 0 12 2Zm5.8 14.2c-.25.7-1.45 1.34-2 1.4-.5.06-1.16.08-1.86-.12a14.6 14.6 0 0 1-1.7-.63 11.2 11.2 0 0 1-4.3-3.8c-.32-.44-1.04-1.46-1.04-2.78s.69-1.97.94-2.24a1 1 0 0 1 .72-.34h.52c.17 0 .4-.06.62.47.23.55.78 1.9.85 2.04.07.13.12.3.02.47-.1.18-.15.29-.3.45-.14.16-.3.36-.43.48-.14.14-.29.3-.12.58.16.29.73 1.2 1.56 1.94 1.07.95 1.97 1.25 2.25 1.4.28.13.45.11.61-.07.17-.18.71-.82.9-1.1.18-.29.37-.24.61-.15.25.1 1.57.74 1.84.87.27.14.45.2.51.32.07.11.07.64-.18 1.34Z" />
    </svg>
  )
}

export function Icon({
  name,
  size = 20,
  stroke = 2,
  className,
}: {
  name: string
  size?: number
  stroke?: number
  className?: string
}) {
  if (name === 'wa') return <WaIcon size={size} className={className} />
  const C = MAP[name] ?? Search
  return <C size={size} strokeWidth={stroke} className={className} />
}
