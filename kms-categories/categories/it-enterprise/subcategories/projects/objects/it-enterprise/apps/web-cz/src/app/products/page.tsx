'use client'

import { Navbar } from '../../components/Navigation/Navbar'
import { ProductList } from '../../components/Products/ProductList'

export default function ProductsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Naše produkty</h1>
          <p className="mt-2 text-gray-600">
            Objevte naše AI-powered platformy a nástroje
          </p>
        </div>
        <ProductList />
      </div>
    </div>
    </div>
  )
}

