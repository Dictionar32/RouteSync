import { describe, it } from 'vitest'
import { ZodTierGenerator } from '../../cli/src/generators/ZodTierGenerator'
import { RouteManifest } from '@routesync/core'
import fs from 'fs-extra'
import path from 'path'

describe('RouteSync - Toko Online Demo', () => {
  it('should compile online store models and generate type-safe frontend APIs', async () => {
    const manifest: RouteManifest = {
      version: '1.0.0',
      baseURL: 'https://api.toko-online-cuy.com/v1',
      generatedAt: new Date().toISOString(),
      routes: [],
      channels: [],
      models: [
        {
          name: 'Product',
          table: 'products',
          columns: [
            { name: 'id', type: 'bigint(20) unsigned', nullable: false },
            { name: 'name', type: 'varchar(255)', nullable: false },
            { name: 'slug', type: 'varchar(255)', nullable: false },
            { name: 'price', type: 'decimal(12,2)', nullable: false },
            { name: 'stock', type: 'int(11)', nullable: false },
            { name: 'description', type: 'text', nullable: true },
            { name: 'created_at', type: 'timestamp', nullable: true }
          ],
          hidden: [],
          appends: ['imageUrl', 'averageRating', 'reviewsCount'],
          casts: {
            id: 'int',
            price: 'float',
            stock: 'integer'
          },
          relations: {},
          accessors: {
            imageUrl: {
              source: { file: '' },
              ast: null,
              semantic: { status: 'resolved', type: 'string', confidence: 100, trace: [] }
            },
            averageRating: {
              source: { file: '' },
              ast: null,
              semantic: { status: 'resolved', type: 'number', confidence: 100, trace: [] }
            },
            reviewsCount: {
              source: { file: '' },
              ast: null,
              semantic: { status: 'resolved', type: 'number', confidence: 100, trace: [] }
            }
          }
        },
        {
          name: 'CartItem',
          table: 'cart_items',
          columns: [
            { name: 'id', type: 'bigint(20) unsigned', nullable: false },
            { name: 'product_id', type: 'bigint(20) unsigned', nullable: false },
            { name: 'quantity', type: 'int(11)', nullable: false },
            { name: 'user_id', type: 'bigint(20) unsigned', nullable: false }
          ],
          hidden: [],
          appends: ['subtotal'],
          casts: {
            id: 'int',
            product_id: 'int',
            quantity: 'int',
            user_id: 'int'
          },
          relations: {},
          accessors: {
            subtotal: {
              source: { file: '' },
              ast: null,
              semantic: { status: 'resolved', type: 'number', confidence: 100, trace: [] }
            }
          }
        },
        {
          name: 'Order',
          table: 'orders',
          columns: [
            { name: 'id', type: 'bigint(20) unsigned', nullable: false },
            { name: 'order_number', type: 'varchar(100)', nullable: false },
            { name: 'total_amount', type: 'decimal(12,2)', nullable: false },
            { name: 'status', type: 'varchar(50)', nullable: false },
            { name: 'shipping_address', type: 'text', nullable: false }
          ],
          hidden: [],
          appends: ['isPaid'],
          casts: {
            id: 'int',
            total_amount: 'float'
          },
          relations: {},
          accessors: {
            isPaid: {
              source: { file: '' },
              ast: null,
              semantic: { status: 'resolved', type: 'boolean', confidence: 100, trace: [] }
            }
          }
        }
      ]
    }

    const outputDir = path.join(__dirname, 'toko-online-generated')
    await fs.ensureDir(outputDir)

    try {
      await ZodTierGenerator.generate(manifest, outputDir)

      const typesFilePath = path.join(outputDir, 'types/api-read.ts')
      const typesContent = await fs.readFile(typesFilePath, 'utf-8')

      console.log('\n======================================================')
      console.log('🎉 HASIL GENERASI TIPE FRONTEND (types/api-read.ts) 🎉')
      console.log('======================================================')
      console.log(typesContent.trim())
      console.log('======================================================\n')
    } finally {
      await fs.remove(outputDir)
    }
  })
})
