import { describe, it, expect } from 'vitest'
import { CompilerBridge } from '../../cli/src/generators/CompilerBridge'
import { manifestToContractInput } from '../../cli/src/generators/utils/manifest-to-types'
import { ContractGeneratorPass } from '../../core/src/compiler/passes/ContractGeneratorPass'
import { PrimitiveType, PrimitiveKind } from '../../core/src/compiler/types/SemanticType'
import type { RouteManifest, RequestTypesArtifact } from '@routesync/core'

describe('Jalur A — ContractGeneratorPass Integration Tests', () => {
  it('should generate Zod contract schemas via CompilerBridge.generateContractTypes', async () => {
    const mockManifest: RouteManifest = {
      version: '1.0.0',
      baseURL: 'http://localhost/api',
      generatedAt: new Date().toISOString(),
      resources: [
        {
          name: 'ProdukResource',
          fields: {
            id: { kind: 'primitive', type: 'number' },
            produk_name: { kind: 'primitive', type: 'string' },
            harga_rp: { kind: 'primitive', type: 'number' }
          }
        }
      ],
      routes: [
        {
          name: 'produk.store',
          path: '/api/produk',
          method: 'POST',
          auth: false,
          middleware: [],
          schema: {
            formTypeName: 'ProdukForm',
            action: 'create',
            resourceName: 'ProdukResource',
            rules: {
              produk_name: ['required', 'string', 'max:255'],
              harga_rp: ['required', 'numeric', 'min:0'],
              produk_item_id: ['required', 'string']
            }
          }
        }
      ]
    }

    const output = await CompilerBridge.generateContractTypes(mockManifest)

    expect(output).toBeDefined()
    expect(output.code).toContain("import { z } from 'zod'")
    expect(output.code).toContain('export const produkContractSchema')
    expect(output.code).toContain('produk_name: z.string()')
    expect(output.code).toContain('harga_rp: z.number()')
    expect(output.code).toContain('produk_item_id: z.string()')
    expect(output.code).not.toContain('produkName') // Preserves snake_case in Jalur A contracts
    expect(output.metadata.contractCount).toBeGreaterThanOrEqual(1)
  })

  it('should lower manifest into RequestTypesArtifact via manifestToContractInput preserving snake_case', () => {
    const mockManifest: RouteManifest = {
      version: '1.0.0',
      baseURL: 'http://localhost/api',
      generatedAt: new Date().toISOString(),
      routes: [
        {
          name: 'cart.items.store',
          path: '/api/cart/items',
          method: 'POST',
          auth: false,
          middleware: [],
          schema: {
            formTypeName: 'CartItemsForm',
            action: 'create',
            rules: {
              produk_item_id: ['required', 'string'],
              qty_ordered: ['required', 'integer']
            }
          }
        }
      ]
    }

    const artifact = manifestToContractInput(mockManifest)

    expect(artifact.typeId).toBe('RequestTypes')
    expect(artifact.requestTypes).toHaveLength(1)
    expect(artifact.requestTypes[0].resourceName).toBe('cartItems')

    const createAction = artifact.requestTypes[0].actions.find(a => a.name === 'create')
    expect(createAction).toBeDefined()

    const fields = createAction!.fields
    const itemField = fields.find(f => f.originalName === 'produk_item_id')
    expect(itemField).toBeDefined()
    expect(itemField?.transformedName).toBe('produk_item_id') // Jalur A preserves snake_case
  })

  it('should execute ContractGeneratorPass directly with RequestTypesArtifact', () => {
    const pass = new ContractGeneratorPass()

    const requestArtifact: RequestTypesArtifact = {
      typeId: 'RequestTypes',
      metadata: {
        hash: 'test-hash',
        producer: 'test',
        dependencies: [],
        timestamp: Date.now(),
        revision: '1.0.0'
      },
      requestTypes: [
        {
          resourceName: 'Order',
          formTypeName: 'OrderForm',
          actions: [
            {
              name: 'create',
              fields: [
                {
                  originalName: 'shipping_address',
                  transformedName: 'shippingAddress',
                  type: new PrimitiveType(PrimitiveKind.STRING),
                  required: true,
                  nullable: false
                },
                {
                  originalName: 'total_amount',
                  transformedName: 'totalAmount',
                  type: new PrimitiveType(PrimitiveKind.NUMBER),
                  required: true,
                  nullable: false
                }
              ]
            }
          ]
        }
      ]
    }

    const [result] = pass.run([requestArtifact])

    expect(result.typeId).toBe('GeneratedContract')
    expect(result.code).toContain('export const OrderContractSchema')
    expect(result.code).toContain('shipping_address: z.string()')
    expect(result.code).toContain('total_amount: z.number()')
    expect(result.generationMetadata.contractCount).toBe(1)
    expect(result.generationMetadata.totalActions).toBe(1)
    expect(result.generationMetadata.zodSchemasCount).toBe(1)
    expect(result.generationMetadata.validatorsCount).toBe(1)
  })

  it('should handle multi-action resources (create, update) in single contract schema', async () => {
    const mockManifest: RouteManifest = {
      version: '1.0.0',
      baseURL: 'http://localhost/api',
      generatedAt: new Date().toISOString(),
      routes: [
        {
          name: 'users.store',
          path: '/api/users',
          method: 'POST',
          auth: false,
          middleware: [],
          schema: {
            formTypeName: 'UserForm',
            action: 'create',
            resourceName: 'User',
            rules: {
              email: ['required', 'email'],
              full_name: ['required', 'string']
            }
          }
        },
        {
          name: 'users.update',
          path: '/api/users/{id}',
          method: 'PUT',
          auth: false,
          middleware: [],
          schema: {
            formTypeName: 'UserForm',
            action: 'update',
            resourceName: 'User',
            rules: {
              full_name: ['sometimes', 'string']
            }
          }
        }
      ]
    }

    const output = await CompilerBridge.generateContractTypes(mockManifest)

    expect(output.code).toContain('export const usersContractSchema')
    expect(output.code).toContain('Create:')
    expect(output.code).toContain('Update:')
    expect(output.code).toContain('email: z.string()')
    expect(output.code).toContain('full_name: z.string()')
  })

  it('should handle empty manifest without crashing and return warnings', async () => {
    const emptyManifest: RouteManifest = {
      version: '1.0.0',
      baseURL: 'http://localhost/api',
      generatedAt: new Date().toISOString(),
      routes: []
    }

    const output = await CompilerBridge.generateContractTypes(emptyManifest)

    expect(output).toBeDefined()
    expect(output.metadata.contractCount).toBe(0)
    expect(output.metadata.warnings).toContain('No validation rules found in manifest')
  })
})
