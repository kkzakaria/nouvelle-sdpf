import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'
import { getAdminSession } from '#/lib/admin-auth'
import { AdminLayout } from '#/components/admin/AdminLayout'

export const Route = createFileRoute('/admin/_authed')({
  beforeLoad: async () => {
    const session = await getAdminSession()
    if (!session) throw redirect({ to: '/admin/login' })
    return { adminEmail: session.email }
  },
  component: () => (
    <AdminLayout>
      <Outlet />
    </AdminLayout>
  ),
})
