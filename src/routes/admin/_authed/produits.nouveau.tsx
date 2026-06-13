import { createFileRoute } from '@tanstack/react-router'
import { getCategories } from '#/lib/catalog'
import { ProductForm } from '#/components/admin/ProductForm'
import type { ProductFormData } from '#/components/admin/ProductForm'

export const Route = createFileRoute('/admin/_authed/produits/nouveau')({
  loader: async () => ({ categories: await getCategories() }),
  component: NewProduct,
})

function NewProduct() {
  const { categories } = Route.useLoaderData()
  const empty: ProductFormData = {
    categoryId: '',
    name: '',
    format: '',
    descShort: '',
    descLong: '',
    featured: false,
    sortOrder: 0,
    images: [],
  }
  return <ProductForm key="nouveau" categories={categories} initial={empty} />
}
