import { describe, test, expect } from 'vitest'
import { manifestToContractInput } from '../../cli/src/generators/utils/manifest-to-types'
import { MapperGeneratorPass } from '../../core/src/compiler/passes/MapperGeneratorPass'
import { ApiFieldGeneratorPass } from '../../core/src/compiler/passes/ApiFieldGeneratorPass'
import { RequestTypesArtifact } from '../../core/src/compiler/artifacts/RequestTypesArtifact'
import { RouteManifest } from '../../core/src/types/route'

describe('Regression Test: Order Items Array Hierarchy (orderItemsArrayHierarchy)', () => {
    test('should transform nested array-of-objects in toApiOrderCreate and extract nested field names to ApiApiField', () => {
        const manifest: RouteManifest = {
            routes: [
                {
                    domain: 'Order',
                    path: '/orders',
                    method: 'POST',
                    action: 'OrderController@store',
                    rules: {},
                    schema: {
                        rules: {
                            'shipping_nama': 'required|string',
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

        // 1. Test ApiFieldGeneratorPass extracts nested keys (PRODUKITEMID, QTY)
        const apiFieldPass = new ApiFieldGeneratorPass()
        const [apiFieldArtifact] = apiFieldPass.run([contractInput])

        expect(apiFieldArtifact.code).toContain('SHIPPINGNAMA: "shipping_nama"')
        expect(apiFieldArtifact.code).toContain('ITEMS: "items"')
        expect(apiFieldArtifact.code).toContain('PRODUKITEMID: "produk_item_id"')
        expect(apiFieldArtifact.code).toContain('QTY: "qty"')

        // 2. Test MapperGeneratorPass generates inner item mapping
        const mapperPass = new MapperGeneratorPass()
        const [mapperArtifact] = mapperPass.run([contractInput])

        expect(mapperArtifact.code).toContain('toApiOrderCreate')
        expect(mapperArtifact.code).toContain('[ApiApiField.ITEMS]: form.items?.map(item => ({')
        expect(mapperArtifact.code).toContain('[ApiApiField.PRODUKITEMID]: item.produkItemId,')
        expect(mapperArtifact.code).toContain('[ApiApiField.QTY]: item.qty')
        expect(mapperArtifact.code).toContain('[ApiApiField.SHIPPINGNAMA]: form.shippingNama,')
    })

    test('should handle deserialized JSON manifest where field types are plain objects (kind === readonly_collection)', () => {
        const artifact: RequestTypesArtifact = {
            typeId: 'RequestTypes',
            metadata: {
                generator: 'test',
                timestamp: new Date().toISOString(),
                version: '1.0.0'
            },
            requestTypes: [
                {
                    resourceName: 'Order',
                    formTypeName: 'OrderForm',
                    actions: [
                        {
                            name: 'create',
                            fields: [
                                {
                                    originalName: 'items',
                                    transformedName: 'items',
                                    required: true,
                                    nullable: false,
                                    type: {
                                        kind: 'readonly_collection',
                                        elementType: {
                                            kind: 'object',
                                            properties: [
                                                { name: 'produk_item_id', type: { kind: 'primitive', name: 'number' } },
                                                { name: 'qty', type: { kind: 'primitive', name: 'number' } }
                                            ]
                                        }
                                    } as any
                                }
                            ]
                        }
                    ]
                }
            ]
        }

        // 1. ApiField extraction from plain JSON artifact
        const apiFieldPass = new ApiFieldGeneratorPass()
        const [apiFieldArtifact] = apiFieldPass.run([artifact])
        expect(apiFieldArtifact.code).toContain('ITEMS: "items"')
        expect(apiFieldArtifact.code).toContain('PRODUKITEMID: "produk_item_id"')
        expect(apiFieldArtifact.code).toContain('QTY: "qty"')

        // 2. Mapper generation from plain JSON artifact
        const mapperPass = new MapperGeneratorPass()
        const [mapperArtifact] = mapperPass.run([artifact])

        expect(mapperArtifact.code).toContain('[ApiApiField.ITEMS]: form.items?.map(item => ({')
        expect(mapperArtifact.code).toContain('[ApiApiField.PRODUKITEMID]: item.produkItemId,')
        expect(mapperArtifact.code).toContain('[ApiApiField.QTY]: item.qty')
    })
})
