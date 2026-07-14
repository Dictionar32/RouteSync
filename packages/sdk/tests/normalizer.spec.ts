import { describe, it, expect } from 'vitest'
import { normalizeManifest } from '../../cli/src/generators/normalizer'
import { RouteManifest, SemanticResolutionKernel } from '@routesync/core'
import { CompilerPipeline, CompilerContext, CompilerPass } from '../../cli/src/generators/pipeline'

class DummyPass implements CompilerPass<string, number> {
  readonly id = "dummy-pass"
  readonly name = "DummyPass"
  readonly inputKind = "string"
  readonly outputKind = "number"
  run(input: string, context: CompilerContext): number {
    return input.length
  }
}

class IncompatiblePass implements CompilerPass<boolean, string> {
  readonly id = "incompatible-pass"
  readonly name = "IncompatiblePass"
  readonly inputKind = "boolean"
  readonly outputKind = "string"
  run(input: boolean, context: CompilerContext): string {
    return String(input)
  }
}

describe('Compiler Pass Pipeline Framework (v6.18)', () => {
  it('should compile successfully with compatible passes', () => {
    const pipeline = new CompilerPipeline()
    pipeline.addPass(new DummyPass())

    const context = new CompilerContext()
    const result = pipeline.compile("hello", context)

    expect(result).toBe(5)
    expect(context.diagnostics.length).toBe(0)
  })

  it('should prevent chaining incompatible passes', () => {
    const pipeline = new CompilerPipeline()
    pipeline.addPass(new DummyPass())

    expect(() => {
      pipeline.addPass(new IncompatiblePass())
    }).toThrow(/Pipeline type mismatch/)
  })
})

describe('Stateless Normalizer Pipeline (v6.16 - v6.18)', () => {
  it('should deterministically normalize manifest routes, models, and resources into stable IR', () => {
    const manifest: RouteManifest = {
      version: '1.0.0',
      baseURL: 'http://localhost/api',
      generatedAt: new Date().toISOString(),
      routes: [
        {
          name: 'PaymentIndex',
          method: 'GET',
          uri: 'payments',
          actionName: 'index',
          controllerName: 'PaymentController',
          response: {
            kind: 'object',
            fields: {
              id: {
                kind: 'property_access',
                resolved: {
                  status: 'resolved',
                  type: 'number',
                  confidence: 100,
                  trace: []
                }
              } as any,
              refund_amount_minor: {
                kind: 'property_access'
                // unresolved, should trigger name-based fallback to number
              } as any
            }
          }
        }
      ],
      models: [
        {
          name: 'Payment',
          table: 'payments',
          columns: [
            { name: 'id', type: 'bigint(20) unsigned', nullable: false },
            { name: 'metode', type: 'varchar(255)', nullable: true }
          ],
          casts: {
            id: 'int'
          }
        }
      ],
      resources: [
        {
          name: 'PaymentResource',
          fields: {
            id: {
              kind: 'property_access',
              resolved: {
                status: 'resolved',
                type: 'number',
                confidence: 100,
                trace: []
              }
            } as any,
            gateway_token: {
              kind: 'property_access'
              // unresolved, should trigger name-based fallback to string
            } as any
          }
        }
      ]
    }

    const kernel = new SemanticResolutionKernel()

    // 1. Run normalization twice to assert statelessness/determinism
    const ir1 = normalizeManifest(manifest, kernel)
    const ir2 = normalizeManifest(manifest, kernel)

    expect(ir1).toEqual(ir2)

    // 2. Validate IR versioning and basic structures
    expect(ir1.irVersion).toBe(1)
    expect(ir1.version).toBe('1.0.0')
    expect(ir1.baseURL).toBe('http://localhost/api')

    // 3. Validate route normalization & fallback heuristic typings
    expect(ir1.routes.length).toBe(1)
    const route = ir1.routes[0]
    expect(route.symbolId).toBe('route:PaymentIndex')
    expect(route.method).toBe('GET')
    expect(route.actionName).toBe('index')
    
    expect(route.response.kind).toBe('object')
    const respFields = (route.response as any).fields
    expect(respFields.id.kind).toBe('primitive')
    expect(respFields.id.type).toBe('number')
    
    // Fallback heuristic: refund_amount_minor should resolve as number
    expect(respFields.refund_amount_minor.kind).toBe('primitive')
    expect(respFields.refund_amount_minor.type).toBe('number')

    // 4. Validate model normalization
    expect(ir1.models.length).toBe(1)
    const model = ir1.models[0]
    expect(model.symbolId).toBe('model:Payment')
    expect(model.name).toBe('Payment')
    expect(model.tableName).toBe('payments')
    expect(model.fields.id).toEqual({ kind: 'primitive', type: 'number', nullable: false })
    expect(model.fields.metode).toEqual({ kind: 'primitive', type: 'string', nullable: true })

    // 5. Validate resource normalization & fallback heuristic typings
    expect(ir1.resources.length).toBe(1)
    const res = ir1.resources[0]
    expect(res.symbolId).toBe('resource:PaymentResource')
    expect(res.name).toBe('PaymentResource')
    expect(res.fields.id.kind).toBe('primitive')
    expect(res.fields.id.type).toBe('number')

    // Fallback heuristic: gateway_token should resolve as string
    expect(res.fields.gateway_token.kind).toBe('primitive')
    expect(res.fields.gateway_token.type).toBe('string')
  })
})
