import { describe, test, expect } from 'vitest'
import { manifestToContractInput } from '../../cli/src/generators/utils/manifest-to-types'
import { FormGeneratorPass } from '../../core/src/compiler/passes/FormGeneratorPass'
import { MapperGeneratorPass } from '../../core/src/compiler/passes/MapperGeneratorPass'
import { RouteManifest } from '../../core/src/types/route'

describe('Regression Test: Numeric Field Types in api-form.ts & Clean Mapper (formNumericFieldTyping)', () => {
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
                        harga: 'required|numeric',
                        stok: 'required|integer'
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

    test('should generate numeric types for integer and numeric validation rules in api-form.ts', () => {
        const contractInput = manifestToContractInput(mockManifest)
        const pass = new FormGeneratorPass()
        const [artifact] = pass.run([contractInput])

        // Verify numeric properties in api-form.ts
        expect(artifact.code).toContain('categoryId: number')
        expect(artifact.code).toContain('harga: number')
        expect(artifact.code).toContain('stok: number')
    })

    test('should generate clean mapper in api-mapper.ts WITHOUT Number(...) wrappers or ternary coercion', () => {
        const contractInput = manifestToContractInput(mockManifest)
        const mapperPass = new MapperGeneratorPass()
        const [mapperArtifact] = mapperPass.run([contractInput])

        // Verify clean direct assignments in api-mapper.ts
        expect(mapperArtifact.code).toContain('[ApiApiField.CATEGORYID]: form.categoryId,')
        expect(mapperArtifact.code).toContain('[ApiApiField.HARGA]: form.harga,')
        expect(mapperArtifact.code).toContain('[ApiApiField.STOK]: form.stok,')

        // Must NOT contain redundant Number(...) wrappers or ternary logic
        expect(mapperArtifact.code).not.toContain('Number(form.')
        expect(mapperArtifact.code).not.toContain('!= null ? Number(')
    })
})
