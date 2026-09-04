import { describe, test, expect } from 'vitest'
import { PrimitiveKind } from '../../../types/SemanticType'
import {
    ResolvedPrimitiveType,
    ResolvedReferenceType,
    ResolvedNullableType,
    ResolvedCollectionType,
    ResolvedObjectType,
    ResolvedUnionType,
    ResolvedIntersectionType,
    type ResolvedSemanticType
} from '../ResolvedSemanticType'

describe('ResolvedSemanticType Domain Vocabulary Type Contract Tests', () => {
    test('1. ResolvedPrimitiveType constructs immutable value object with Named Options Contract', () => {
        const primitive = new ResolvedPrimitiveType({ primitiveKind: PrimitiveKind.STRING })

        expect(primitive.kind).toBe('primitive')
        expect(primitive.primitiveKind).toBe(PrimitiveKind.STRING)
        expect(Object.isFrozen(primitive)).toBe(true)
    })

    test('2. ResolvedReferenceType constructs named type reference value object', () => {
        const ref = new ResolvedReferenceType({ name: 'UserResource', namespace: 'App\\Http\\Resources' })

        expect(ref.kind).toBe('reference')
        expect(ref.name).toBe('UserResource')
        expect(ref.namespace).toBe('App\\Http\\Resources')
        expect(Object.isFrozen(ref)).toBe(true)
    })

    test('3. ResolvedNullableType encapsulates inner ResolvedSemanticType', () => {
        const inner = new ResolvedPrimitiveType({ primitiveKind: PrimitiveKind.NUMBER })
        const nullable = new ResolvedNullableType({ innerType: inner })

        expect(nullable.kind).toBe('nullable')
        expect(nullable.innerType).toBe(inner)
        expect(Object.isFrozen(nullable)).toBe(true)
    })

    test('4. ResolvedCollectionType encapsulates element type', () => {
        const element = new ResolvedReferenceType({ name: 'OrderItem', namespace: 'App\\Models' })
        const collection = new ResolvedCollectionType({ elementType: element })

        expect(collection.kind).toBe('collection')
        expect(collection.elementType).toBe(element)
        expect(Object.isFrozen(collection)).toBe(true)
    })

    test('5. ResolvedObjectType encapsulates clean field tuples', () => {
        const idType = new ResolvedPrimitiveType({ primitiveKind: PrimitiveKind.NUMBER })
        const nameType = new ResolvedPrimitiveType({ primitiveKind: PrimitiveKind.STRING })

        const objectType = new ResolvedObjectType({
            fields: [
                ['id', idType],
                ['name', nameType]
            ]
        })

        expect(objectType.kind).toBe('object')
        expect(objectType.fields).toHaveLength(2)
        expect(objectType.fields[0]).toEqual(['id', idType])
        expect(objectType.fields[1]).toEqual(['name', nameType])
        expect(Object.isFrozen(objectType)).toBe(true)
    })
})
