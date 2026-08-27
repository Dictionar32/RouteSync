import { describe, test, expect } from 'vitest'
import { manifestToContractInput } from '../../cli/src/generators/utils/manifest-to-types'
import { MapperGeneratorPass } from '../../core/src/compiler/passes/MapperGeneratorPass'
import { ContractGeneratorPass } from '../../core/src/compiler/passes/ContractGeneratorPass'
import { FormGeneratorPass } from '../../core/src/compiler/passes/FormGeneratorPass'
import { RouteManifest } from '../../core/src/types/route'

describe('Regression Test: PascalCase Contract & Form Action Names (formMapperPascalCaseActions)', () => {
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
                        id: { kind: 'primitive', type: 'integer' },
                        nama: { kind: 'primitive', type: 'string' }
                    }
                }
            }
        ],
        resources: [],
        models: []
    }

    test('should generate PascalCase contract type export AdminProdukContract in api-contract.ts', () => {
        const pass = new ContractGeneratorPass()
        const contractInput = manifestToContractInput(mockManifest)
        const [artifact] = pass.run([contractInput])

        // Verify type export is PascalCase AdminProdukContract (NOT adminProdukContract)
        expect(artifact.code).toContain('export type AdminProdukContract = {')
        expect(artifact.code).toContain('Create: z.infer<typeof adminProdukContractSchema.Create>')
    })

    test('should generate PascalCase form action property Create in api-form.ts', () => {
        const pass = new FormGeneratorPass()
        const contractInput = manifestToContractInput(mockManifest)
        const [artifact] = pass.run([contractInput])

        // Verify form action property is PascalCase Create (NOT create)
        expect(artifact.code).toContain('export type AdminProdukForm = {')
        expect(artifact.code).toContain('Create: {')
    })

    test('should import PascalCase AdminProdukContract and index AdminProdukForm["Create"] in api-mapper.ts', () => {
        const contractInput = manifestToContractInput(mockManifest)
        const mapperPass = new MapperGeneratorPass()
        const [mapperArtifact] = mapperPass.run([contractInput])

        // Verify import from api-contract is PascalCase AdminProdukContract
        expect(mapperArtifact.code).toContain('AdminProdukContract')

        // Verify Form Mapper signature uses PascalCase Create for indexing
        expect(mapperArtifact.code).toContain('export const toApiAdminProdukCreate = (form: AdminProdukForm[\'Create\']): AdminProdukContract[\'Create\'] => ({')
    })
})
