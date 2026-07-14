import { describe, it, expect } from 'vitest'
import { ZodTierGenerator } from '../../cli/src/generators/ZodTierGenerator'
import { RouteManifest } from '@routesync/core'
import fs from 'fs-extra'
import path from 'path'

describe('ZodTierGenerator - ProdukItem Appended Fields', () => {
  it('should process appends and accessors from manifest and generate ProdukItemTransformed', async () => {
    const manifest: RouteManifest = {
      version: '1.0.0',
      baseURL: 'http://localhost/api',
      generatedAt: new Date().toISOString(),
      routes: [],
      channels: [],
      models: [
        {
          name: 'ProdukItem',
          table: 'produk_items',
          columns: [
            { name: 'id', type: 'bigint(20) unsigned', nullable: false },
            { name: 'nama', type: 'varchar(255)', nullable: false },
            { name: 'deskripsi', type: 'text', nullable: true },
            { name: 'category_id', type: 'bigint(20) unsigned', nullable: true },
            { name: 'harga', type: 'int(11)', nullable: false },
            { name: 'stok', type: 'int(11)', nullable: false },
            { name: 'created_at', type: 'timestamp', nullable: true },
            { name: 'updated_at', type: 'timestamp', nullable: true }
          ],
          hidden: [],
          appends: [
            'image',
            'image_url',
            'category_name',
            'rating',
            'review_count'
          ],
          casts: {
            id: 'int',
            category_id: 'integer',
            harga: 'integer',
            stok: 'integer'
          },
          relations: {},
          accessors: {
            image: {
              source: { file: '' },
              ast: null,
              semantic: {
                status: 'resolved',
                type: 'string',
                confidence: 100,
                trace: []
              }
            },
            image_url: {
              source: { file: '' },
              ast: null,
              semantic: {
                status: 'resolved',
                type: 'string',
                confidence: 100,
                trace: []
              }
            },
            category_name: {
              source: { file: '' },
              ast: null,
              semantic: {
                status: 'resolved',
                type: 'string',
                confidence: 100,
                trace: []
              }
            },
            rating: {
              source: { file: '' },
              ast: null,
              semantic: {
                status: 'resolved',
                type: 'number',
                confidence: 100,
                trace: []
              }
            },
            review_count: {
              source: { file: '' },
              ast: null,
              semantic: {
                status: 'resolved',
                type: 'number',
                confidence: 100,
                trace: []
              }
            }
          }
        }
      ]
    }

    const tempDir = path.join(__dirname, 'temp-zod-tier-test')
    await fs.ensureDir(tempDir)

    try {
      await ZodTierGenerator.generate(manifest, tempDir)

      const filePath = path.join(tempDir, 'types/api-read.ts')
      const content = await fs.readFile(filePath, 'utf-8')

      // Assert it contains the model interface
      expect(content).toContain('export interface ProdukItemTransformed {')
      expect(content).toContain('image?: string // appended')
      expect(content).toContain('imageUrl?: string // appended')
      expect(content).toContain('categoryName?: string // appended')
      expect(content).toContain('rating?: number // appended')
      expect(content).toContain('reviewCount?: number // appended')

      console.log('--- TEST PASSED: ZodTierGenerator processes model.appends and generates image/imageUrl/etc. with correct semantic types ---')
    } finally {
      await fs.remove(tempDir)
    }
  })
})
