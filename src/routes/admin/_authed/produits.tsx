import { Outlet, createFileRoute } from '@tanstack/react-router'

// Route de mise en page : monte les enfants (liste à l'index, formulaire à /$id)
// dans son Outlet. Sans cet Outlet, /admin/produits/$id ne s'affiche jamais.
export const Route = createFileRoute('/admin/_authed/produits')({
  component: () => <Outlet />,
})
