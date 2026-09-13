import { describe, it, expect } from 'vitest'
import {
    ResolvedSemanticTypeFactory,
    matchResolvedSemanticTypeIR,
    OptimizedContractIRBuilder,
    type PrimitiveSemanticTypeIR,
    type ResourceSemanticTypeIR,
    type ModelSemanticTypeIR,
    type ObjectSemanticTypeIR,
    type ArraySemanticTypeIR,
    type UnionSemanticTypeIR,
    type LiteralSemanticTypeIR,
    type ResolvedSemanticTypeIR
} from '@routesync/core'
import {
    matchResolvedSemanticType,
    type ResolvedSemanticType,
    type RouteManifest,
    type ParsedResource
} from '@routesync/core/src/types/ir'

describe('Pure Contract IR Types ADT (Rule 8, 10, 11, & 12 SSOT)', () => {
    describe('ResolvedSemanticTypeFactory — Complete Contract Invariants', () => {
        it('creates a guaranteed frozen PrimitiveSemanticTypeIR', () => {
            const node = ResolvedSemanticTypeFactory.primitive('string', 'email')
            expect(node.kind).toBe('primitive')
            expect(node.type).toBe('string')
            expect(node.format).toBe('email')
            expect(Object.isFrozen(node)).toBe(true)
        })

        it('creates a guaranteed frozen ResourceSemanticTypeIR', () => {
            const node = ResolvedSemanticTypeFactory.resource('UserResource', true)
            expect(node.kind).toBe('resource')
            expect(node.resource).toBe('UserResource')
            expect(node.collection).toBe(true)
            expect(Object.isFrozen(node)).toBe(true)
        })

        it('creates a guaranteed frozen ModelSemanticTypeIR', () => {
            const node = ResolvedSemanticTypeFactory.model('App\\Models\\User')
            expect(node.kind).toBe('model')
            expect(node.model).toBe('App\\Models\\User')
            expect(Object.isFrozen(node)).toBe(true)
        })

        it('creates a guaranteed frozen ObjectSemanticTypeIR with non-nullable properties', () => {
            const properties = {
                id: ResolvedSemanticTypeFactory.primitive('integer'),
                name: ResolvedSemanticTypeFactory.primitive('string')
            }
            const node = ResolvedSemanticTypeFactory.object(properties)
            expect(node.kind).toBe('object')
            expect(node.properties.id.kind).toBe('primitive')
            expect(node.properties.name.kind).toBe('primitive')
            expect(Object.isFrozen(node)).toBe(true)
        })

        it('creates a guaranteed frozen ArraySemanticTypeIR', () => {
            const item = ResolvedSemanticTypeFactory.primitive('string')
            const node = ResolvedSemanticTypeFactory.array(item)
            expect(node.kind).toBe('array')
            expect(node.items.kind).toBe('primitive')
            expect(Object.isFrozen(node)).toBe(true)
        })

        it('creates a guaranteed frozen UnionSemanticTypeIR', () => {
            const types = [
                ResolvedSemanticTypeFactory.primitive('string'),
                ResolvedSemanticTypeFactory.primitive('number')
            ]
            const node = ResolvedSemanticTypeFactory.union(types)
            expect(node.kind).toBe('union')
            expect(node.types).toHaveLength(2)
            expect(Object.isFrozen(node)).toBe(true)
        })

        it('creates a guaranteed frozen LiteralSemanticTypeIR', () => {
            const node = ResolvedSemanticTypeFactory.literal('active')
            expect(node.kind).toBe('literal')
            expect(node.value).toBe('active')
            expect(Object.isFrozen(node)).toBe(true)
        })
    })

    describe('Catamorphic Matcher (matchResolvedSemanticType) Exhaustiveness', () => {
        const variants: ResolvedSemanticType[] = [
            ResolvedSemanticTypeFactory.primitive('boolean'),
            ResolvedSemanticTypeFactory.resource('ProductResource'),
            ResolvedSemanticTypeFactory.model('App\\Models\\Product'),
            ResolvedSemanticTypeFactory.object({
                title: ResolvedSemanticTypeFactory.primitive('string')
            }),
            ResolvedSemanticTypeFactory.array(ResolvedSemanticTypeFactory.primitive('integer')),
            ResolvedSemanticTypeFactory.union([
                ResolvedSemanticTypeFactory.primitive('string'),
                ResolvedSemanticTypeFactory.primitive('null')
            ]),
            ResolvedSemanticTypeFactory.literal(42)
        ]

        it('dispatches to each visitor arm without conditionals or unhandled cases', () => {
            const labels = variants.map(v =>
                matchResolvedSemanticType(v, {
                    primitive: (p: PrimitiveSemanticTypeIR) => `primitive:${p.type}`,
                    resource: (r: ResourceSemanticTypeIR) => `resource:${r.resource}`,
                    model: (m: ModelSemanticTypeIR) => `model:${m.model}`,
                    object: (o: ObjectSemanticTypeIR) => `object:${Object.keys(o.properties).join(',')}`,
                    array: (a: ArraySemanticTypeIR) => `array:${a.items.kind}`,
                    union: (u: UnionSemanticTypeIR) => `union:${u.types.length}`,
                    literal: (l: LiteralSemanticTypeIR) => `literal:${String(l.value)}`
                })
            )

            expect(labels).toEqual([
                'primitive:boolean',
                'resource:ProductResource',
                'model:App\\Models\\Product',
                'object:title',
                'array:primitive',
                'union:2',
                'literal:42'
            ])
        })
    })

    describe('OptimizedContractIRBuilder Integration with ResolvedSemanticType ADT', () => {
        it('resolves semantic types into TypeIR using catamorphism without exceptions', () => {
            const builder = new OptimizedContractIRBuilder()

            const mockManifest: RouteManifest = {
                routes: [],
                resources: [
                    {
                        name: 'OrderResource',
                        path: 'app/Http/Resources/OrderResource.php',
                        fields: [
                            {
                                name: 'status',
                                type: 'string',
                                nullable: false,
                                semanticType: ResolvedSemanticTypeFactory.literal('shipped')
                            },
                            {
                                name: 'user',
                                type: 'object',
                                nullable: false,
                                semanticType: ResolvedSemanticTypeFactory.resource('UserResource', false)
                            },
                            {
                                name: 'tags',
                                type: 'array',
                                nullable: false,
                                semanticType: ResolvedSemanticTypeFactory.array(
                                    ResolvedSemanticTypeFactory.primitive('string')
                                )
                            },
                            {
                                name: 'metadata',
                                type: 'object',
                                nullable: false,
                                semanticType: ResolvedSemanticTypeFactory.object({
                                    priority: ResolvedSemanticTypeFactory.primitive('integer')
                                })
                            }
                        ]
                    } as unknown as ParsedResource
                ],
                requests: [],
                metadata: {
                    version: '1.0.0',
                    scanned_at: '2026-09-12T00:00:00.000Z',
                    source_files: []
                }
            }

            const contractIR = builder.build(mockManifest)
            expect(contractIR.resources).toBeDefined()
            // 2 resources: OrderResource + synthetic OrderMetadataTransformed
            expect(contractIR.resources).toHaveLength(2)

            const resource = contractIR.resources.find(r => r.name === 'OrderResource')!
            expect(resource).toBeDefined()
            expect(resource.fields).toHaveLength(4)

            const syntheticResource = contractIR.resources.find(r => r.name === 'OrderMetadata')!
            expect(syntheticResource).toBeDefined()
            expect(syntheticResource.fields).toHaveLength(1)
            expect(syntheticResource.fields[0].name).toBe('priority')
            expect(syntheticResource.fields[0].type.read.kind).toBe('primitive')

            const statusField = resource.fields.find(f => f.name === 'status')
            expect(statusField?.type.read.kind).toBe('literal')

            const userField = resource.fields.find(f => f.name === 'user')
            expect(userField?.type.read.kind).toBe('reference')

            const tagsField = resource.fields.find(f => f.name === 'tags')
            expect(tagsField?.type.read.kind).toBe('array')

            const metadataField = resource.fields.find(f => f.name === 'metadata')
            expect(metadataField?.type.read.kind).toBe('reference')
        })
    })
})
