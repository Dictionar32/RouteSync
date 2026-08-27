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

describe('Regression Test: Child Resource Collection Mapper Typing (items)', () => {
    test('should generate child mapper call items.map(toOrderDetailResourceRead) to match OrderDetailResourceTransformed[] type', () => {
        // Child resource: OrderDetailResource
        const orderDetailRef = new ReferenceType('App\\Http\\Resources', 'OrderDetailResourceTransformed')
        const itemsCollection = new ReadonlyCollectionType(CollectionKind.ARRAY, orderDetailRef)

        const mapperInput: RequestTypesArtifact = {
            typeId: 'RequestTypes',
            requestTypes: [
                {
                    resourceName: 'order',
                    formTypeName: 'OrderForm',
                    actions: [],
                    responseData: {
                        resourceName: 'OrderResource',
                        fields: {
                            id: new PrimitiveType('number'),
                            status: new PrimitiveType('string'),
                            items: itemsCollection
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

        const mapperPass = new MapperGeneratorPass()
        const [mapperArtifact] = mapperPass.run([mapperInput])

        // Verify toOrderResourceRead uses .map(toOrderDetailResourceRead)
        expect(mapperArtifact.code).toContain('export const toOrderResourceRead = (api: OrderResourceApiResponse): OrderResourceTransformed => ({')
        expect(mapperArtifact.code).toContain('items: api.items?.map(toOrderDetailResourceRead),')
        expect(mapperArtifact.code).not.toContain('items: api.items,')
    })
})
