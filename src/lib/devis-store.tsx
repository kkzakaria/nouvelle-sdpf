import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react'

const KEY = 'sdpf_devis_v1'
type Devis = Record<string, number>

type Ctx = {
  devis: Devis
  count: number
  has: (id: string) => boolean
  toggle: (id: string) => void
  setQty: (id: string, qty: number) => void
  remove: (id: string) => void
  clear: () => void
}

const DevisContext = createContext<Ctx | null>(null)

function load(): Devis {
  if (typeof localStorage === 'undefined') return {}
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}') || {}
  } catch {
    return {}
  }
}

export function DevisProvider({ children }: { children: React.ReactNode }) {
  const [devis, setDevis] = useState<Devis>({})
  useEffect(() => {
    setDevis(load())
  }, [])
  useEffect(() => {
    if (typeof localStorage !== 'undefined')
      localStorage.setItem(KEY, JSON.stringify(devis))
  }, [devis])

  const toggle = useCallback((id: string) => {
    setDevis((d) => {
      const n = { ...d }
      if (n[id]) delete n[id]
      else n[id] = 1
      return n
    })
  }, [])
  const setQty = useCallback((id: string, qty: number) => {
    setDevis((d) => {
      const n = { ...d }
      if (qty <= 0) delete n[id]
      else n[id] = Math.min(qty, 999)
      return n
    })
  }, [])
  const remove = useCallback(
    (id: string) =>
      setDevis((d) => {
        const n = { ...d }
        delete n[id]
        return n
      }),
    [],
  )
  const clear = useCallback(() => setDevis({}), [])

  const count = Object.keys(devis).length
  const has = (id: string) => !!devis[id]

  return (
    <DevisContext.Provider
      value={{ devis, count, has, toggle, setQty, remove, clear }}
    >
      {children}
    </DevisContext.Provider>
  )
}

export function useDevis(): Ctx {
  const ctx = useContext(DevisContext)
  if (!ctx) throw new Error('useDevis doit être utilisé dans un DevisProvider')
  return ctx
}
