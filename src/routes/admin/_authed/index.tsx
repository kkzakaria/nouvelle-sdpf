import { createFileRoute, redirect } from '@tanstack/react-router'

// La maquette n'a pas de tableau de bord : /admin atterrit sur la liste produits.
export const Route = createFileRoute('/admin/_authed/')({
  beforeLoad: () => {
    throw redirect({ to: '/admin/produits' })
  },
})
