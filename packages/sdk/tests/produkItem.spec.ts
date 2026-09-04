import { describe, it, expect } from 'vitest'
import { CompilerBridge } from '../../cli/src/generators/CompilerBridge'
import { RouteManifest, StaticLaravelScanner } from '@routesync/core'

describe('CompilerBridge - ProdukItem Appended Fields', () => {
  it('should process appends and accessors from manifest and generate ProdukItemTransformed', async () => {
    const models = [
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
      ] as any[]

    const manifest: RouteManifest = {
      version: '1.0.0',
      baseURL: 'http://localhost/api',
      generatedAt: new Date().toISOString(),
      routes: [],
      channels: [],
      models,
      resources: [],
      routeGroups: [],
      requestTypes: [],
      semanticTypes: StaticLaravelScanner.deriveSemanticTypes([], models)
    }

    const result = await CompilerBridge.generateTypeScript(manifest)
    const content = result.code

    // Assert it contains the model interface
    expect(content).toContain('export interface ProdukItemTransformed {')
    expect(content).toContain('image: string')
    expect(content).toContain('imageUrl: string')
    expect(content).toContain('categoryName: string')
    expect(content).toContain('rating: number')
    expect(content).toContain('reviewCount: number')
  })
})
