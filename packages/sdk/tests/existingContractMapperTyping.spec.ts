import { describe, test, expect } from 'vitest'
import { manifestToContractInput } from '../../cli/src/generators/utils/manifest-to-types'
import { ContractGeneratorPass } from '../../core/src/compiler/passes/ContractGeneratorPass'
import { MapperGeneratorPass } from '../../core/src/compiler/passes/MapperGeneratorPass'
import { RouteManifest } from '../../core/src/types/route'

describe('Step 1 Regression Test: Existing Contract Type Resolution in MapperGeneratorPass', () => {
    test('should use ProdukItemResourceApiResponse parameter type for toProdukItemResourceRead instead of fallback any when contract type exists', () => {
        const manifest: RouteManifest = {
            routes: [
                {
                    domain: 'Wishlist',
                    path: '/wishlist',
                    method: 'GET',
                    action: 'WishlistController@index',
                    rules: {},
                    response: {
                        kind: 'resource',
                        resource: 'WishlistResource'
                    }
                },
                {
                    domain: 'Admin',
                    path: '/admin/produk',
                    method: 'POST',
                    action: 'AdminProdukController@store',
                    rules: {},
                    response: {
                        kind: 'resource',
                        resource: 'ProdukItemResource'
                    }
                }
            ],
            resources: [
                {
                    name: 'WishlistResource',
                    fields: {
                        id: { kind: 'primitive', type: 'int' },
                        items: {
                            kind: 'static_method_call',
                            className: 'ProdukItemResource',
                            name: 'collection',
                            resolved: {
                                type: 'resource',
                                resource: 'ProdukItemResource',
                                collection: true
                            }
                        }
                    }
                },
                {
                    name: 'ProdukItemResource',
                    fields: {
                        id: { kind: 'primitive', type: 'int' },
                        nama: { kind: 'primitive', type: 'string' },
                        harga: { kind: 'primitive', type: 'int' }
                    }
                }
            ],
            models: []
        }

        const contractInput = manifestToContractInput(manifest)

        const contractPass = new ContractGeneratorPass()
        const [contractArtifact] = contractPass.run([contractInput])

        const mapperPass = new MapperGeneratorPass()
        const [mapperArtifact] = mapperPass.run([contractInput])

        // Verify api-contract.ts exports ProdukItemResourceApiResponse
        expect(contractArtifact.code).toContain('export type ProdukItemResourceApiResponse = z.infer<typeof produkItemResourceShowSchema>;')

        // STEP 1 EXPECTATION:
        // toProdukItemResourceRead MUST use (api: ProdukItemResourceApiResponse), NOT (api: any)
        expect(mapperArtifact.code).toContain('export const toProdukItemResourceRead = (api: ProdukItemResourceApiResponse): ProdukItemResourceTransformed => ({')
        expect(mapperArtifact.code).not.toContain('toProdukItemResourceRead = (api: any)')
    })
})
