import { describe, test, expect } from 'vitest'
import { manifestToContractInput } from '../../cli/src/generators/utils/manifest-to-types'
import { FormGeneratorPass } from '../../core/src/compiler/passes/FormGeneratorPass'
import { MapperGeneratorPass } from '../../core/src/compiler/passes/MapperGeneratorPass'
import { RouteManifest } from '../../core/src/types/route'

describe('Regression Test: Form Object & Array-of-Object Element Typing (formObjectArrayElementTyping)', () => {
    test('should generate typed inline object shape for items array instead of generic object in api-form.ts', () => {
        const manifest: RouteManifest = {
            routes: [
                {
                    domain: 'Checkout',
                    path: '/checkout',
                    method: 'POST',
                    action: 'CheckoutController@store',
                    rules: {},
                    schema: {
                        rules: {
                            'items': 'required|array',
                            'items.*.produk_item_id': 'required|integer|exists:produk_items,id',
                            'items.*.qty': 'required|integer|min:1'
                        }
                    },
                    response: {
                        kind: 'object',
                        fields: {
                            id: { kind: 'primitive', type: 'integer' }
                        }
                    }
                }
            ],
            resources: [],
            models: []
        }

        const contractInput = manifestToContractInput(manifest)
        const formPass = new FormGeneratorPass()
        const [formArtifact] = formPass.run([contractInput])

        // Verify items array element is typed { produkItemId: number; qty: number } and NOT generic object
        expect(formArtifact.code).not.toContain('items?: Array<object>')
        expect(formArtifact.code).toContain('produkItemId: number')
        expect(formArtifact.code).toContain('qty: number')

        const mapperPass = new MapperGeneratorPass()
        const [mapperArtifact] = mapperPass.run([contractInput])

        // Verify clean mapper accesses item.produkItemId
        expect(mapperArtifact.code).toContain('item.produkItemId')
        expect(mapperArtifact.code).toContain('item.qty')
    })
})
