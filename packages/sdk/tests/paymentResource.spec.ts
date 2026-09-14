import { describe, it, expect } from 'vitest'
import { CompilerBridge } from '../../cli/src/generators/CompilerBridge'
import { RouteManifest, StaticLaravelScanner } from '@routesync/core'

describe('CompilerBridge - PaymentResource Appended & Flattened Fields', () => {
  it('should process object flattening and generate correct PaymentResourceTransformed interface', async () => {
    const resources = [
        {
          name: 'OrderDetailResource',
          fields: {
            id: {
              kind: 'property_access',
              resolved: {
                status: 'resolved',
                type: 'number',
                confidence: 100,
                trace: []
              }
            }
          }
        },
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
            },
            order_id: {
              kind: 'property_access',
              resolved: {
                status: 'resolved',
                type: 'number',
                confidence: 100,
                trace: []
              }
            },
            invoice_number: {
              kind: 'variable',
              resolved: {
                status: 'resolved',
                type: 'string',
                nullable: true,
                confidence: 100,
                trace: []
              }
            },
            metode: {
              kind: 'property_access',
              resolved: {
                status: 'resolved',
                type: 'string',
                nullable: true,
                confidence: 100,
                trace: []
              }
            },
            detail: {
              kind: 'variable',
              resolved: {
                status: 'resolved',
                type: 'string',
                nullable: true,
                confidence: 100,
                trace: []
              }
            },
            status: {
              kind: 'property_access',
              resolved: {
                status: 'resolved',
                type: 'string',
                confidence: 100,
                trace: []
              }
            },
            paid_at: {
              kind: 'property_access',
              resolved: {
                status: 'resolved',
                type: 'string',
                nullable: true,
                confidence: 100,
                trace: []
              }
            },
            provider: {
              kind: 'property_access',
              resolved: {
                status: 'resolved',
                type: 'string',
                nullable: true,
                confidence: 100,
                trace: []
              }
            },
            provider_txn_id: {
              kind: 'property_access',
              resolved: {
                status: 'resolved',
                type: 'string',
                confidence: 100,
                trace: []
              }
            },
            gateway_status: {
              kind: 'property_access',
              resolved: {
                status: 'resolved',
                type: 'string',
                confidence: 100,
                trace: []
              }
            },
            amount_minor: {
              kind: 'property_access',
              resolved: {
                status: 'resolved',
                type: 'number',
                confidence: 100,
                trace: []
              }
            },
            refund_amount_minor: {
              kind: 'property_access'
              // unresolved field (no resolved object)
            },
            items: {
              kind: 'static_method_call',
              resolved: {
                status: 'resolved',
                type: 'resource',
                resource: 'OrderDetailResource',
                collection: true,
                confidence: 100,
                trace: []
              }
            },
            promotion: {
              kind: 'object',
              fields: {
                code: {
                  kind: 'nullsafe_property_access',
                  resolved: {
                    status: 'resolved',
                    type: 'string',
                    confidence: 100,
                    trace: []
                  }
                },
                discount_minor: {
                  kind: 'type_cast',
                  resolved: {
                    status: 'resolved',
                    type: 'number',
                    confidence: 100,
                    trace: []
                  }
                }
              }
            },
            gateway: {
              kind: 'object',
              fields: {
                name: { kind: 'ternary' },
                order_id: { kind: 'ternary' },
                token: { kind: 'ternary' },
                redirect_url: { kind: 'ternary' }
              }
            },
            total_harga: {
              kind: 'method_call',
              resolved: {
                status: 'resolved',
                type: 'number',
                confidence: 100,
                trace: []
              }
            }
          }
        }
      ]

    const manifest: RouteManifest = {
      version: '1.0.0',
      baseURL: 'http://localhost/api',
      generatedAt: new Date().toISOString(),
      routes: [],
      models: [],
      resources,
      routeGroups: [],
      requestTypes: [],
      semanticTypes: StaticLaravelScanner.deriveSemanticTypes(resources, [])
    }

    const result = await CompilerBridge.generateTypeScript(manifest)
    const content = result.code

    // Assert it contains the transformed interface for PaymentResource
    expect(content).toContain('export interface PaymentResourceTransformed {')
    expect(content).toContain('id: number')
    expect(content).toContain('orderId: number')
    expect(content).toContain('invoiceNumber: string | null')
    expect(content).toContain('status: string')
    expect(content).toContain('totalHarga: number')
  })
})
