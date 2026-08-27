import { describe, it, expect } from 'vitest'
import { CompilerBridge } from '../../cli/src/generators/CompilerBridge'
import type { RouteManifest } from '@routesync/core'

describe('Category Model Inferred Schema Regression Test', () => {
  it('should infer model columns (id, nama) for categories response instead of z.array(z.unknown())', async () => {
    const mockManifest: RouteManifest = {
      version: '1.0.0',
      baseURL: 'http://localhost/api',
      generatedAt: new Date().toISOString(),
      models: [
        {
          name: 'Category',
          table: 'categories',
          columns: [
            { name: 'id', type: 'bigint', nullable: false },
            { name: 'nama', type: 'varchar', nullable: false },
          ],
        },
      ],
      routes: [
        {
          name: 'categories.index',
          path: '/categories',
          method: 'GET',
          auth: false,
          middleware: [],
          response: {
            kind: 'object',
            fields: {
              data: {
                kind: 'array',
                element: {
                  kind: 'model',
                  model: 'Category',
                  collection: false,
                },
              },
            },
          },
        },
      ],
    }

    const output = await CompilerBridge.generateContractTypes(mockManifest)

    expect(output.code).toContain('export const categoriesShowSchema = z.object({')
    expect(output.code).not.toContain('data: z.array(z.unknown())')
    expect(output.code).toContain('id: z.number()')
    expect(output.code).toContain('nama: z.string()')
  })
})
