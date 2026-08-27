import { describe, test, expect } from 'vitest'
import { manifestToContractInput } from '../../cli/src/generators/utils/manifest-to-types'
import { MapperGeneratorPass } from '../../core/src/compiler/passes/MapperGeneratorPass'
import { RouteManifest } from '../../core/src/types/route'

describe('Regression Test: Only Generate Read Mappers for Eloquent JsonResources (Category A)', () => {
    test('should generate read mappers for Eloquent JsonResources (OrderResource) and omit identity mappers for non-resource responses (Profile, PaymentWebhook)', () => {
        const manifest: RouteManifest = {
            routes: [
                {
                    domain: 'Order',
                    path: '/orders',
                    method: 'GET',
                    action: 'OrderController@index',
                    rules: {},
                    response: {
                        kind: 'resource',
                        resource: 'OrderResource'
                    }
                },
                {
                    domain: 'Profile',
                    path: '/profile',
                    method: 'GET',
                    action: 'ProfileController@show',
                    rules: {},
                    response: {
                        kind: 'object',
                        fields: {
                            id: { kind: 'primitive', type: 'int' },
                            name: { kind: 'primitive', type: 'string' }
                        }
                    }
                },
                {
                    domain: 'Webhook',
                    path: '/payment/webhook',
                    method: 'POST',
                    action: 'WebhookController@handle',
                    rules: {},
                    response: {
                        kind: 'object',
                        fields: {
                            message: { kind: 'primitive', type: 'string' }
                        }
                    }
                }
            ],
            resources: [
                {
                    name: 'OrderResource',
                    fields: {
                        id: { kind: 'primitive', type: 'int' },
                        status: { kind: 'primitive', type: 'string' }
                    }
                }
            ],
            models: []
        }

        const contractInput = manifestToContractInput(manifest)
        const mapperPass = new MapperGeneratorPass()
        const [mapperArtifact] = mapperPass.run([contractInput])

        // 1. MUST generate read mapper for OrderResource
        expect(mapperArtifact.code).toContain('export const toOrderResourceRead = (api: OrderResourceApiResponse): OrderResourceTransformed =>')

        // 2. MUST generate read mappers mapping to *Transformed domain types (NOT identity *ApiResponse)
        expect(mapperArtifact.code).toContain('export const toProfileRead = (api: ProfileApiResponse): ProfileTransformed =>')
        expect(mapperArtifact.code).toContain('export const toPaymentWebhookRead = (api: PaymentWebhookApiResponse): PaymentWebhookTransformed =>')
    })
})
