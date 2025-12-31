'use client'

import { useProducts } from '@it-enterprise/api-client'
import { SkeletonCard, SkeletonList } from '@it-enterprise/ui'

export function ProductList() {
  const { data: products, isLoading, error } = useProducts()

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        Chyba při načítání produktů
      </div>
    )
  }

  if (!products || products.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        Žádné produkty k dispozici
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map((product) => (
        <div
          key={product.id}
          className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
        >
          <h3 className="text-xl font-semibold mb-2">{product.name}</h3>
          <p className="text-gray-600 mb-4 line-clamp-3">{product.description}</p>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-blue-600">
              {product.price.toFixed(2)} Kč
            </span>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
              Koupit
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

