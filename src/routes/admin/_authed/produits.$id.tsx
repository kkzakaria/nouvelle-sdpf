import { createFileRoute, notFound } from '@tanstack/react-router'
import { getCategories } from '#/lib/catalog'
import { adminGetProduct } from '#/lib/admin-products'
import { ProductForm } from '#/components/admin/ProductForm'
import type { ProductFormData } from '#/components/admin/ProductForm'

export const Route = createFileRoute('/admin/_authed/produits/$id')({
  loader: async ({ params }) => {
    const [categories, product] = await Promise.all([
      getCategories(),
      adminGetProduct({ data: { id: params.id } }),
    ])
    if (!product) throw notFound()
    return { categories, product }
  },
  component: ProductEdit,
})

function ProductEdit() {
  const { categories, product } = Route.useLoaderData()
  const data: ProductFormData = {
    id: product.id,
    categoryId: product.categoryId,
    name: product.name,
    format: product.format,
    descShort: product.descShort,
    descLong: product.descLong,
    featured: product.featured,
    sortOrder: product.sortOrder,
    images: product.images,
  }
  return <ProductForm key={product.id} categories={categories} initial={data} />
}
