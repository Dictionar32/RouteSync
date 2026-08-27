import { describe, test, expect } from 'vitest'
import { manifestToContractInput } from '../../cli/src/generators/utils/manifest-to-types'
import { MapperGeneratorPass } from '../../core/src/compiler/passes/MapperGeneratorPass'
import { RouteManifest } from '../../core/src/types/route'

describe('End-to-End Mapper Generation Regression Test (OrderDetailResource::collection)', () => {
    test('should resolve static_method_call OrderDetailResource::collection and generate items.map(toOrderDetailResourceRead)', () => {
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
                }
            ],
            resources: [
                {
                    name: 'OrderResource',
                    fields: {
                        id: { kind: 'primitive', type: 'int' },
                        status: { kind: 'primitive', type: 'string' },
                        items: {
                            kind: 'static_method_call',
                            className: 'OrderDetailResource',
                            name: 'collection',
                            resolved: {
                                type: 'resource',
                                resource: 'OrderDetailResource',
                                collection: true
                            }
                        }
                    }
                },
                {
                    name: 'OrderDetailResource',
                    fields: {
                        id: { kind: 'primitive', type: 'int' },
                        produk_item_id: { kind: 'primitive', type: 'string' },
                        qty: { kind: 'primitive', type: 'int' }
                    }
                }
            ],
            models: []
        }

        // Step 1: manifestToContractInput
        const contractInput = manifestToContractInput(manifest)

        // Step 2: MapperGeneratorPass
        const mapperPass = new MapperGeneratorPass()
        const [mapperArtifact] = mapperPass.run([contractInput])

        // Verify mapped output for OrderResource
        expect(mapperArtifact.code).toContain('export const toOrderResourceRead = (api: OrderResourceApiResponse): OrderResourceTransformed => ({')
        expect(mapperArtifact.code).toContain('items: api.items?.map(toOrderDetailResourceRead),')
        expect(mapperArtifact.code).not.toContain('items: api.items,')
    })
})
