import { describe, test, expect } from 'vitest'
import { manifestToContractInput } from '../../cli/src/generators/utils/manifest-to-types'
import { MapperGeneratorPass } from '../../core/src/compiler/passes/MapperGeneratorPass'
import { RouteManifest } from '../../core/src/types/route'

describe('Regression Test: Form Mapper Field Type Coercion (formMapperFieldTypeCoercion)', () => {
    const mockManifest: RouteManifest = {
        routes: [
            {
                domain: 'Admin',
                path: '/admin/produk',
                method: 'POST',
                action: 'AdminProdukController@store',
                rules: {},
                schema: {
                    rules: {
                        nama: 'required|string|max:255',
                        category_id: 'required|integer',
                        harga: 'required|numeric'
                    }
                },
                response: {
                    kind: 'object',
                    fields: {
                        id: { kind: 'primitive', type: 'integer' }
                    }
                }
            },
            {
                domain: 'Payment',
                path: '/payment',
                method: 'POST',
                action: 'PaymentController@store',
                rules: {},
                schema: {
                    rules: {
                        metode: 'required|string',
                        'detail.*': 'sometimes|string'
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

    test('should emit safe Number coercion for integer category_id field in toApiAdminProdukCreate', () => {
        const contractInput = manifestToContractInput(mockManifest)
        const mapperPass = new MapperGeneratorPass()
        const [mapperArtifact] = mapperPass.run([contractInput])

        // Verify clean form.categoryId assignment for categoryId numeric field
        expect(mapperArtifact.code).toContain('[ApiApiField.CATEGORYID]: form.categoryId,')
    })

    test('should emit clean form.detail without as any for detail array field in toApiPaymentCreate', () => {
        const contractInput = manifestToContractInput(mockManifest)
        const mapperPass = new MapperGeneratorPass()
        const [mapperArtifact] = mapperPass.run([contractInput])

        // Verify clean form.detail without as any
        expect(mapperArtifact.code).toContain('[ApiApiField.DETAIL]: form.detail,')
        expect(mapperArtifact.code).not.toContain('as any')
    })
})
