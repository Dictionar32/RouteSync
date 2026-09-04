import { describe, test, expect } from 'vitest'
import {
    PrimitiveType,
    PrimitiveKind,
    ReferenceType,
    ObjectType,
    ReadonlyCollectionType,
    CollectionKind
} from '../../../types/SemanticType'
import { ImmutableMap, ImmutableSet } from '../../../utils/ImmutableCollections'
import { SemanticTypeResolver } from '../SemanticTypeResolver'
import {
    ResolvedPrimitiveType,
    ResolvedReferenceType,
    ResolvedNullableType,
    ResolvedCollectionType,
    ResolvedObjectType
} from '../ResolvedSemanticType'

describe('SemanticTypeResolver Domain Flow Tests', () => {
    test('1. Resolves PrimitiveType to ResolvedPrimitiveType', () => {
        const resolver = new SemanticTypeResolver()
        const rawPrimitive = new PrimitiveType(PrimitiveKind.STRING)

        const resolved = resolver.resolve(rawPrimitive)

        expect(resolved).toBeInstanceOf(ResolvedPrimitiveType)
        if (resolved instanceof ResolvedPrimitiveType) {
            expect(resolved.primitiveKind).toBe(PrimitiveKind.STRING)
        }
    })

    test('2. Resolves ReferenceType to ResolvedReferenceType', () => {
        const resolver = new SemanticTypeResolver()
        const rawRef = new ReferenceType('App\\Http\\Resources', 'UserResource')

        const resolved = resolver.resolve(rawRef)

        expect(resolved).toBeInstanceOf(ResolvedReferenceType)
        if (resolved instanceof ResolvedReferenceType) {
            expect(resolved.name).toBe('UserResource')
            expect(resolved.namespace).toBe('App\\Http\\Resources')
        }
    })

    test('3. Resolves ReadonlyCollectionType to ResolvedCollectionType', () => {
        const resolver = new SemanticTypeResolver()
        const rawCollection = new ReadonlyCollectionType(
            CollectionKind.ARRAY,
            new PrimitiveType(PrimitiveKind.NUMBER)
        )

        const resolved = resolver.resolve(rawCollection)

        expect(resolved).toBeInstanceOf(ResolvedCollectionType)
        if (resolved instanceof ResolvedCollectionType) {
            expect(resolved.elementType).toBeInstanceOf(ResolvedPrimitiveType)
        }
    })

    test('4. Resolves ObjectType with nullable_wrapper annotation to ResolvedNullableType', () => {
        const resolver = new SemanticTypeResolver()
        const innerType = new PrimitiveType(PrimitiveKind.STRING)
        const props = new ImmutableMap(new Map([['__value', innerType]]))
        const annotations = new ImmutableMap(new Map([['kind', 'nullable_wrapper']]))

        const rawNullableObject = new ObjectType(props, new ImmutableSet(new Set(['__value'])), undefined, [], annotations)

        const resolved = resolver.resolve(rawNullableObject)

        expect(resolved).toBeInstanceOf(ResolvedNullableType)
        if (resolved instanceof ResolvedNullableType) {
            expect(resolved.innerType).toBeInstanceOf(ResolvedPrimitiveType)
        }
    })

    test('5. Resolves plain ObjectType excluding internal __ meta properties to ResolvedObjectType', () => {
        const resolver = new SemanticTypeResolver()
        const props = new ImmutableMap(new Map([
            ['id', new PrimitiveType(PrimitiveKind.NUMBER)],
            ['name', new PrimitiveType(PrimitiveKind.STRING)],
            ['__meta', new PrimitiveType(PrimitiveKind.STRING)]
        ]))

        const rawObject = new ObjectType(props, new ImmutableSet(new Set(['id', 'name'])))

        const resolved = resolver.resolve(rawObject)

        expect(resolved).toBeInstanceOf(ResolvedObjectType)
        if (resolved instanceof ResolvedObjectType) {
            expect(resolved.fields).toHaveLength(2)
            expect(resolved.fields[0][0]).toBe('id')
            expect(resolved.fields[1][0]).toBe('name')
        }
    })

    test('6. Supports extensible custom handler registration via Named Options Contract', () => {
        const customHandler = {
            supports: (type: any) => type.kind === 'object' && type.annotations?.get('kind') === 'custom_wrapper',
            resolve: (type: any, resolver: any) => new ResolvedNullableType({
                innerType: resolver.resolve(type.properties.get('__value'))
            })
        }

        const resolver = new SemanticTypeResolver({
            customHandlers: [customHandler]
        })

        const innerType = new PrimitiveType(PrimitiveKind.BOOLEAN)
        const props = new ImmutableMap(new Map([['__value', innerType]]))
        const annotations = new ImmutableMap(new Map([['kind', 'custom_wrapper']]))
        const customObject = new ObjectType(props, new ImmutableSet(new Set(['__value'])), undefined, [], annotations)

        const resolved = resolver.resolve(customObject)

        expect(resolved).toBeInstanceOf(ResolvedNullableType)
        if (resolved instanceof ResolvedNullableType) {
            expect(resolved.innerType).toBeInstanceOf(ResolvedPrimitiveType)
        }
    })
})
