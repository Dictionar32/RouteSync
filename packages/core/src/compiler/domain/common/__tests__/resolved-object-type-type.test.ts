import { describe, test, expectTypeOf } from 'vitest'
import type { ObjectType, SemanticType } from '../../../types/SemanticType'
import {
    ResolvedObjectType,
    NullableWrapperObject,
    PlainObject,
    resolveObjectType,
    type ResolvedObjectTypeUnion,
    type NullableWrapperObjectParams,
    type PlainObjectParams
} from '../ResolvedObjectType'

describe('ResolvedObjectType Sealed Class Hierarchy Type Contract Assertions', () => {
    test('1. NullableWrapperObject extends abstract base ResolvedObjectType', () => {
        expectTypeOf<NullableWrapperObject>().toMatchTypeOf<ResolvedObjectType>()
        expectTypeOf<NullableWrapperObject['kind']>().toEqualTypeOf<'nullable_wrapper'>()
        expectTypeOf<NullableWrapperObject['innerType']>().toMatchTypeOf<SemanticType>()
    })

    test('2. PlainObject extends abstract base ResolvedObjectType', () => {
        expectTypeOf<PlainObject>().toMatchTypeOf<ResolvedObjectType>()
        expectTypeOf<PlainObject['kind']>().toEqualTypeOf<'plain'>()
    })

    test('3. ResolvedObjectType guarantees rawObject reference and getCleanProperties method', () => {
        expectTypeOf<ResolvedObjectType>().toHaveProperty('rawObject')
        expectTypeOf<ResolvedObjectType['rawObject']>().toEqualTypeOf<ObjectType>()
        expectTypeOf<ResolvedObjectType>().toHaveProperty('getCleanProperties')
        expectTypeOf<ReturnType<ResolvedObjectType['getCleanProperties']>>().toEqualTypeOf<readonly (readonly [string, SemanticType])[]>()
    })

    test('4. Named Options Object Contracts for Subclass Constructors', () => {
        expectTypeOf<ConstructorParameters<typeof NullableWrapperObject>[0]>().toEqualTypeOf<NullableWrapperObjectParams>()
        expectTypeOf<ConstructorParameters<typeof PlainObject>[0]>().toEqualTypeOf<PlainObjectParams>()
    })

    test('5. resolveObjectType signature accepts rawObject: ObjectType -> Discriminated Union (ResolvedObjectTypeUnion)', () => {
        expectTypeOf<typeof resolveObjectType>().toEqualTypeOf<(rawObject: ObjectType) => ResolvedObjectTypeUnion>()
    })
})
