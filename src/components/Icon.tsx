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
  MessageCircle,
  X,
  Minus
  
} from 'lucide-react'
import type {LucideIcon} from 'lucide-react';

const MAP: Record<string, LucideIcon> = {
  home: Home,
  grid: LayoutGrid,
  doc: FileText,
  phone: Phone,
  search: Search,
  'arrow-r': ArrowRight,
  back: ArrowLeft,
  plus: Plus,
  check: Check,
  truck: Truck,
  pin: MapPin,
  layers: Layers,
  wa: MessageCircle,
  x: X,
  minus: Minus,
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
  const C = MAP[name] ?? Search
  return <C size={size} strokeWidth={stroke} className={className} />
}
