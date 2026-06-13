import { createFileRoute, notFound } from '@tanstack/react-router'
import { getCategories } from '#/lib/catalog'
import { adminGetProduct } from '#/lib/admin-products'
import type { ProductFormData } from '#/components/admin/ProductForm'
import { ProductForm } from '#/components/admin/ProductForm'

export const Route = createFileRoute('/admin/_authed/produits/$id')({
  loader: async ({ params }) => {
    const categories = await getCategories()
    if (params.id === 'nouveau') {
      return { categories, initial: null }
    }
    const product = await adminGetProduct({ data: { id: params.id } })
    if (!product) throw notFound()
    return { categories, initial: product }
  },
  component: ProductEdit,
})

function ProductEdit() {
  const { categories, initial } = Route.useLoaderData()
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
  const data: ProductFormData = initial
    ? {
        id: initial.id,
        categoryId: initial.categoryId,
        name: initial.name,
        format: initial.format,
        descShort: initial.descShort,
        descLong: initial.descLong,
        featured: initial.featured,
        sortOrder: initial.sortOrder,
        images: initial.images,
      }
    : empty
  return (
    <ProductForm
      key={initial?.id ?? 'nouveau'}
      categories={categories}
      initial={data}
    />
  )
}
