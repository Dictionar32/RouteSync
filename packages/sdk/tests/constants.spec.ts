import { describe, it, expect } from 'vitest'
import { ConstantsGenerator } from '../../cli/src/generators/ConstantsGenerator'
import { RouteManifest } from '@routesync/core'
import fs from 'fs-extra'
import path from 'path'

describe('ConstantsGenerator', () => {
  it('should generate constants.ts correctly', async () => {
    const manifest: RouteManifest = {
      version: '1.0.0',
      baseURL: 'http://localhost/api',
      generatedAt: new Date().toISOString(),
      routes: [
        {
          method: 'GET',
          path: '/produk',
          name: 'produk.index',
          auth: false,
          middleware: [],
        },
        {
          method: 'GET',
          path: '/produk/{id}',
          name: 'produk.show',
          auth: false,
          middleware: [],
        },
        {
          method: 'POST',
          path: '/cart/items',
          name: 'cart.items.store',
          auth: false,
          middleware: [],
        },
        {
          method: 'DELETE',
          path: '/cart/items/{produkItemId}',
          name: 'cart.items.destroy',
          auth: false,
          middleware: [],
        }
      ],
      channels: [],
      models: [
        {
          name: 'Order',
          table: 'orders',
          columns: [
            { name: 'id', type: 'integer', nullable: false },
            { name: 'status', type: "enum('pending','paid','failed')", nullable: false }
          ]
        }
      ]
    }

    const tempDir = path.join(__dirname, 'temp-constants-test')
    await fs.ensureDir(tempDir)
    
    try {
      await ConstantsGenerator.generate(manifest, tempDir)
      
      const filePath = path.join(tempDir, 'constants.ts')
      const content = await fs.readFile(filePath, 'utf-8')
      
      expect(content).toContain("export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost/api'")
      expect(content).toContain("PRODUK: '/produk'")
      expect(content).toContain("PRODUK_DETAIL: (id: string | number) => `/produk/${id}`")
      expect(content).toContain("CART_ITEM: (produkItemId: string | number) => `/cart/items/${produkItemId}`")
      expect(content).toContain("Enums")
      expect(content).toContain("PENDING: 'pending'")
      expect(content).toContain("PAID: 'paid'")
      expect(content).toContain("FAILED: 'failed'")
      expect(content).toContain("export type OrderStatus = (typeof Enums.Order.Status)[keyof typeof Enums.Order.Status]")
      expect(content).toContain("export const ROUTES = {")
      expect(content).toContain("HOME: '/'")
      expect(content).toContain("PRODUK: '/produk'")
    } finally {
      await fs.remove(tempDir)
    }
  })
})