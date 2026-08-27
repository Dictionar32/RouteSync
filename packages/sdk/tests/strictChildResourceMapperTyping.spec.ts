import { describe, test, expect } from 'vitest'
import { manifestToContractInput } from '../../cli/src/generators/utils/manifest-to-types'
import { ContractGeneratorPass } from '../../core/src/compiler/passes/ContractGeneratorPass'
import { MapperGeneratorPass } from '../../core/src/compiler/passes/MapperGeneratorPass'
import { RouteManifest } from '../../core/src/types/route'

describe('Regression & Type-Safety Test: Strict Child Resource Mapper Typing (Option A)', () => {
    test('should generate OrderDetailResourceApiResponse in api-contract.ts and use it in api-mapper.ts without falling back to any', () => {
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

        // Step 2: ContractGeneratorPass (generates api-contract.ts)
        const contractPass = new ContractGeneratorPass()
        const [contractArtifact] = contractPass.run([contractInput])

        // Step 3: MapperGeneratorPass (generates api-mapper.ts)
        const mapperPass = new MapperGeneratorPass()
        const [mapperArtifact] = mapperPass.run([contractInput])

        // ASSERTIONS FOR OPTION A:
        // 1. api-contract.ts MUST export OrderDetailResourceApiResponse
        expect(contractArtifact.code).toContain('export type OrderDetailResourceApiResponse = z.infer<typeof orderDetailResourceShowSchema>;')

        // 2. api-mapper.ts MUST import OrderDetailResourceApiResponse from api-contract.ts
        expect(mapperArtifact.code).toContain('OrderDetailResourceApiResponse')

        // 3. api-mapper.ts MUST NOT fallback to `(api: any)` for toOrderDetailResourceRead
        expect(mapperArtifact.code).toContain('export const toOrderDetailResourceRead = (api: OrderDetailResourceApiResponse): OrderDetailResourceTransformed => ({')
        expect(mapperArtifact.code).not.toContain('export const toOrderDetailResourceRead = (api: any): OrderDetailResourceTransformed => ({')
        expect(mapperArtifact.code).not.toContain('(api: any)')
    })
})
