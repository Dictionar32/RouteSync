import { describe, it, expect } from 'vitest'
import { normalizeManifest } from '../../cli/src/generators/normalizer'
import { RouteManifest, SemanticResolutionKernel } from '@routesync/core'

describe('Order Resource Null-Safe Resolution (reproduction)', () => {
  it('should resolve nullsafe_property_access expression to nullable: true', () => {
    const kernel = new SemanticResolutionKernel()

    const manifest: RouteManifest = {
      version: '1.0.0',
      baseURL: 'http://localhost/api',
      routes: [],
      models: [
        {
          name: 'Order',
          table: 'orders',
          columns: [
            { name: 'id', type: 'bigint', nullable: false }
          ],
          casts: {},
          relations: {
            promotion: {
              type: 'hasOne',
              model: 'OrderPromotion'
            }
          },
          accessors: []
        },
        {
          name: 'OrderPromotion',
          table: 'order_promotions',
          columns: [
            { name: 'id', type: 'bigint', nullable: false },
            { name: 'promo_code', type: 'varchar(255)', nullable: false }
          ],
          casts: {},
          relations: [],
          accessors: []
        }
      ],
      resources: [
        {
          name: 'OrderResource',
          sourceFile: 'app/Http/Resources/OrderResource.php',
          sourceLine: 8,
          assignments: {
            promotion: '$this->promotion'
          },
          fields: {
            promotion: {
              kind: 'object',
              fields: {
                code: {
                  kind: 'nullsafe_property_access',
                  originalCode: '$promotion?->promo_code',
                  target: {
                    kind: 'variable',
                    originalCode: '$promotion',
                    name: 'promotion'
                  },
                  property: 'promo_code'
                }
              }
            }
          }
        }
      ]
    }

    const normalized = normalizeManifest(manifest, kernel)
    const orderResource = normalized.resources.find(r => r.name === 'OrderResource')
    expect(orderResource).toBeDefined()

    const promotionField = orderResource!.fields.promotion
    expect(promotionField.kind).toBe('object')

    const codeField = (promotionField as any).fields.code
    expect(codeField).toBeDefined()
    expect(codeField.type).toBe('string')
    
    // VERIFICATION: nullsafe_property_access MUST resolve as nullable: true
    // even if the underlying database column promo_code is nullable: false
    expect(codeField.nullable).toBe(true)
  })

  it('should generate z.string().nullable() for a nullable resolved node in ZodSchemaLowerer', async () => {
    const { toZodSchemaExpression } = await import('../../core/src/compiler/domain/common/ZodSchemaLowerer')
    const { ResolvedPrimitiveType, ResolvedNullableType } = await import('../../core/src/compiler/domain/common/ResolvedSemanticType')
    const zodTypeStr = toZodSchemaExpression(new ResolvedNullableType({ innerType: new ResolvedPrimitiveType({ primitiveKind: 'string' }) }))
    expect(zodTypeStr).toBe('z.nullable(z.string())')
  })

  it('should resolve ternary expression to nullable: true when one branch is null', () => {
    const kernel = new SemanticResolutionKernel()
    const ternaryNode = {
      kind: 'ternary',
      condition: { kind: 'variable', name: 'path' },
      truthy: { kind: 'primitive', type: 'string' },
      falsy: { kind: 'primitive', type: 'null' }
    }
    const resolved = kernel.resolve(ternaryNode, {
      layer: 'resource',
      fileName: 'Test',
      modelMap: {},
      relationMap: {},
      assignments: {}
    })
    expect(resolved.status).toBe('resolved')
    expect(resolved.type).toBe('string')
    expect(resolved.nullable).toBe(true)
  })
})
