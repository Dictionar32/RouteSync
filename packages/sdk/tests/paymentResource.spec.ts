import { describe, it, expect } from 'vitest'
import { ZodTierGenerator } from '../../cli/src/generators/ZodTierGenerator'
import { RouteManifest } from '@routesync/core'
import path from 'path'
import fs from 'fs-extra'

describe('ZodTierGenerator - PaymentResource Appended & Flattened Fields', () => {
  it('should process object flattening and generate correct PaymentResourceTransformed interface', async () => {
    const manifest: RouteManifest = {
      version: '1.0.0',
      baseURL: 'http://localhost/api',
      generatedAt: new Date().toISOString(),
      routes: [],
      models: [],
      resources: [
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
            } as any
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
            } as any,
            order_id: {
              kind: 'property_access',
              resolved: {
                status: 'resolved',
                type: 'number',
                confidence: 100,
                trace: []
              }
            } as any,
            invoice_number: {
              kind: 'variable',
              resolved: {
                status: 'resolved',
                type: 'string',
                nullable: true,
                confidence: 100,
                trace: []
              }
            } as any,
            metode: {
              kind: 'property_access',
              resolved: {
                status: 'resolved',
                type: 'string',
                nullable: true,
                confidence: 100,
                trace: []
              }
            } as any,
            detail: {
              kind: 'variable',
              resolved: {
                status: 'resolved',
                type: 'string',
                nullable: true,
                confidence: 100,
                trace: []
              }
            } as any,
            status: {
              kind: 'property_access',
              resolved: {
                status: 'resolved',
                type: 'string',
                confidence: 100,
                trace: []
              }
            } as any,
            paid_at: {
              kind: 'property_access',
              resolved: {
                status: 'resolved',
                type: 'string',
                nullable: true,
                confidence: 100,
                trace: []
              }
            } as any,
            provider: {
              kind: 'property_access',
              resolved: {
                status: 'resolved',
                type: 'string',
                nullable: true,
                confidence: 100,
                trace: []
              }
            } as any,
            provider_txn_id: {
              kind: 'property_access',
              resolved: {
                status: 'resolved',
                type: 'string',
                confidence: 100,
                trace: []
              }
            } as any,
            gateway_status: {
              kind: 'property_access',
              resolved: {
                status: 'resolved',
                type: 'string',
                confidence: 100,
                trace: []
              }
            } as any,
            amount_minor: {
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
              // unresolved field (no resolved object)
            } as any,
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
            } as any,
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
            } as any,
            gateway: {
              kind: 'object',
              fields: {
                name: { kind: 'ternary' },
                order_id: { kind: 'ternary' },
                token: { kind: 'ternary' },
                redirect_url: { kind: 'ternary' }
              }
            } as any,
            total_harga: {
              kind: 'method_call',
              resolved: {
                status: 'resolved',
                type: 'number',
                confidence: 100,
                trace: []
              }
            } as any
          }
        }
      ]
    }

    const tempDir = path.join(__dirname, 'temp-payment-resource-test')
    await fs.ensureDir(tempDir)

    try {
      await ZodTierGenerator.generate(manifest, tempDir)

      const filePath = path.join(tempDir, 'types/api-read.ts')
      const content = await fs.readFile(filePath, 'utf-8')

      // Assert it contains the transformed interface for PaymentResource
      expect(content).toContain('export interface PaymentResourceTransformed {')
      expect(content).toContain('  id: number')
      expect(content).toContain('  orderId: number')
      expect(content).toContain('  invoiceNumber: (string) | null')
      expect(content).toContain('  metode: (string) | null')
      expect(content).toContain('  detail: (string) | null')
      expect(content).toContain('  status: string')
      expect(content).toContain('  paidAt: (string) | null')
      expect(content).toContain('  provider: (string) | null')
      expect(content).toContain('  providerTxnId: string')
      expect(content).toContain('  gatewayStatus: string')
      expect(content).toContain('  amountMinor: number')
      expect(content).toContain('  refundAmountMinor: number')
      expect(content).toContain('  items?: OrderDetailResourceTransformed[]')
      expect(content).toContain('  promotionCode: string')
      expect(content).toContain('  promotionDiscountMinor: number')
      expect(content).toContain('  gatewayName: string')
      expect(content).toContain('  gatewayOrderId: number')
      expect(content).toContain('  gatewayToken: string')
      expect(content).toContain('  gatewayRedirectUrl: string')
      expect(content).toContain('  totalHarga: number')

      console.log('--- TEST PASSED: ZodTierGenerator correctly processes PaymentResource and handles flattening and types ---')
    } finally {
      await fs.remove(tempDir)
    }
  })
})
