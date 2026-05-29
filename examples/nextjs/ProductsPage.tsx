/**
 * Example: RouteSync with Next.js + React Query hooks
 * (after running npx routesync sync --output src/api)
 *
 * Assumes generated hooks in src/api/hooks.ts
 */

// src/app/products/page.tsx
'use client'

import { useProdukList, useCart } from '@/api/hooks' // auto-generated

export default function ProductsPage() {
  const { data, isLoading } = useProdukList({ page: 1, limit: 20 })

  if (isLoading) return <div>Loading...</div>

  return (
    <div>
      {data?.data?.map((product: any) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}

function ProductCard({ product }: { product: any }) {
  // Auto-generated mutation hook
  const addToCart = useCreateCart()

  return (
    <div>
      <h3>{product.name}</h3>
      <button onClick={() => addToCart.mutate({ produk_id: product.id, qty: 1 })}>
        Add to Cart
      </button>
    </div>
  )
}

// Placeholder to satisfy TypeScript
function useCreateCart() {
  return { mutate: (data: any) => {} }
}
