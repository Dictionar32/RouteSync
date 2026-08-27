import { describe, test, expect } from 'vitest'
import { TypeScriptGeneratorPass } from '../../core/src/compiler/passes/TypeScriptGeneratorPass'
import {
    PrimitiveType,
    ObjectType,
    ReadonlyCollectionType,
    ReferenceType,
    CollectionKind
} from '../../core/src/compiler/types/SemanticType'
import { ImmutableSet, ImmutableMap } from '../../core/src/compiler/utils/ImmutableCollections'
import { SemanticType } from '../../core/src/compiler'

describe('api-read.ts Artifact Generation Specification', () => {
    test('should generate OrderResourceTransformed with correct property shapes in api-read.ts', () => {
        const orderDetailRef = new ReferenceType('App\\Http\\Resources', 'OrderDetailResource')
        const itemsCollection = new ReadonlyCollectionType(CollectionKind.ARRAY, orderDetailRef)

        const promotionObjectType = new ObjectType(
            new ImmutableMap<string, SemanticType>(
                new Map<string, SemanticType>([
                    ['code', new PrimitiveType('string')],
                    ['discountMinor', new PrimitiveType('number')]
                ])
            ),
            new ImmutableSet(new Set(['code', 'discountMinor']))
        )

        const orderResourceType = new ObjectType(
            new ImmutableMap<string, SemanticType>(
                new Map<string, SemanticType>([
                    ['id', new PrimitiveType('number')],
                    ['status', new PrimitiveType('string')],
                    ['promotion', promotionObjectType],
                    ['items', itemsCollection]
                ])
            ),
            new ImmutableSet(new Set(['id', 'status', 'promotion', 'items'])),
            undefined,
            [],
            new ImmutableMap(
                new Map([
                    ['name', 'OrderResource'],
                    ['kind', 'resource']
                ])
            )
        )

        const pass = new TypeScriptGeneratorPass()
        const [artifact] = pass.run(
            [
                {
                    typeId: 'SemanticTypes',
                    types: [orderResourceType],
                    metadata: {
                        hash: 'test-hash',
                        producer: 'test',
                        dependencies: [],
                        timestamp: Date.now(),
                        revision: '1.0.0'
                    }
                }
            ],
            {} as any
        )

        // Verify generated TypeScript interface in api-read.ts artifact
        expect(artifact.code).toContain('export interface OrderResourceTransformed {')
        expect(artifact.code).toContain('id: number;')
        expect(artifact.code).toContain('status: string;')
        expect(artifact.code).toContain('promotion: {')
    })
})
