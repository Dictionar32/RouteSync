import { describe, test, expect } from 'vitest'
import { MapperGeneratorPass } from '../../core/src/compiler/passes/MapperGeneratorPass'
import { RequestTypesArtifact } from '../../core/src/compiler/artifacts/RequestTypesArtifact'
import {
    PrimitiveType,
    ObjectType,
    ReadonlyCollectionType,
    ReferenceType,
    CollectionKind
} from '../../core/src/compiler/types/SemanticType'
import { ImmutableSet, ImmutableMap } from '../../core/src/compiler/utils/ImmutableCollections'

describe('Child Resource Array Mapper Generation (items: api.items)', () => {
    test('should map child resource collection using toChildResourceRead function', () => {
        const orderDetailResourceRef = new ReferenceType('App\\Http\\Resources', 'OrderDetailResource')
        const itemsCollectionType = new ReadonlyCollectionType(CollectionKind.ARRAY, orderDetailResourceRef)

        const input: RequestTypesArtifact = {
            typeId: 'RequestTypes',
            requestTypes: [
                {
                    resourceName: 'orderResource',
                    formTypeName: 'OrderForm',
                    actions: [],
                    responseData: {
                        resourceName: 'OrderResource',
                        fields: {
                            id: new PrimitiveType('number'),
                            status: new PrimitiveType('string'),
                            items: itemsCollectionType
                        }
                    }
                }
            ],
            metadata: {
                hash: 'test-hash',
                producer: 'test',
                dependencies: [],
                timestamp: Date.now(),
                revision: '1.0.0'
            }
        }

        const pass = new MapperGeneratorPass()
        const [result] = pass.run([input])

        // Verify child resource collection mapping function call
        expect(result.code).toContain('items: api.items?.map(toOrderDetailResourceRead),')
    })
})
