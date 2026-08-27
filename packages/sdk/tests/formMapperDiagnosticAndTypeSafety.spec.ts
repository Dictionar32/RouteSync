import { describe, test, expect, vi } from 'vitest'
import { manifestToContractInput } from '../../cli/src/generators/utils/manifest-to-types'
import { MapperGeneratorPass } from '../../core/src/compiler/passes/MapperGeneratorPass'
import { RouteManifest } from '../../core/src/types/route'

describe('Regression Test: Form Mapper Diagnostic Warning & Strict Element Typing (formMapperDiagnosticAndTypeSafety)', () => {
    test('should emit compiler diagnostic warning when array wildcard element rule lacks explicit type (e.g. detail.*: sometimes)', () => {
        const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

        const manifest: RouteManifest = {
            routes: [
                {
                    domain: 'Payment',
                    path: '/payment',
                    method: 'POST',
                    action: 'PaymentController@store',
                    rules: {},
                    schema: {
                        rules: {
                            metode: 'required|string',
                            detail: 'sometimes|array',
                            'detail.*': 'sometimes'
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

        manifestToContractInput(manifest)

        // Verify compiler diagnostic warning in Indonesian containing full route context (/payment and PaymentController@store)
        const warningMessage = consoleWarnSpy.mock.calls.find(call => call[0].includes('detail.*'))?.[0] ?? ''
        
        expect(warningMessage).toContain('/payment')
        expect(warningMessage).toContain('PaymentController@store')
        expect(warningMessage).toContain('detail.*')
        expect(warningMessage).toContain('Tipe elemen')

        consoleWarnSpy.mockRestore()
    })

    test('should generate clean mapper without as any when backend rule is updated to detail.*: sometimes|string', () => {
        const manifest: RouteManifest = {
            routes: [
                {
                    domain: 'Payment',
                    path: '/payment',
                    method: 'POST',
                    action: 'PaymentController@store',
                    rules: {},
                    schema: {
                        rules: {
                            metode: 'required|string',
                            detail: 'sometimes|array',
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

        const contractInput = manifestToContractInput(manifest)
        const mapperPass = new MapperGeneratorPass()
        const [mapperArtifact] = mapperPass.run([contractInput])

        // Verify clean mapper line without as any
        expect(mapperArtifact.code).toContain('[ApiApiField.DETAIL]: form.detail,')
        expect(mapperArtifact.code).not.toContain('as any')
    })

    test('should emit compiler diagnostic warning when scalar field lacks explicit primitive type (e.g. category_id: required|exists:categories,id)', () => {
        const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

        const manifest: RouteManifest = {
            routes: [
                {
                    domain: 'Admin',
                    path: '/admin/produk',
                    method: 'POST',
                    action: 'AdminProdukController@store',
                    rules: {},
                    schema: {
                        rules: {
                            nama: 'required|string',
                            category_id: 'required|exists:categories,id'
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

        manifestToContractInput(manifest)

        const warningMessage = consoleWarnSpy.mock.calls.find(call => call[0].includes('category_id'))?.[0] ?? ''

        expect(warningMessage).toContain('/admin/produk')
        expect(warningMessage).toContain('AdminProdukController@store')
        expect(warningMessage).toContain('category_id')
        expect(warningMessage).toContain('Tipe field')

        consoleWarnSpy.mockRestore()
    })
})
