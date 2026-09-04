import { describe, test, expect } from 'vitest'
import {
    ObjectType,
    PrimitiveType,
    PrimitiveKind,
    type SemanticType
} from '../../types/SemanticType'
import { ImmutableMap, ImmutableSet } from '../../utils/ImmutableCollections'
import { TypeScriptGeneratorPass } from '../TypeScriptGeneratorPass'
import { resolveObjectType, NullableWrapperObject, PlainObject } from '../../domain/common/ResolvedObjectType'

describe('Baseline Behavior Tests: ObjectType Lowering across Passes before Refactoring', () => {
    test('1. TypeScriptGeneratorPass lowers PlainObject properties while excluding __ meta keys', () => {
        const pass = new TypeScriptGeneratorPass()

        const userProps = new ImmutableMap(new Map<string, SemanticType>([
            ['id', new PrimitiveType(PrimitiveKind.NUMBER)],
            ['name', new PrimitiveType(PrimitiveKind.STRING)]
        ]))

        const plainObject = new ObjectType(userProps, new ImmutableSet(new Set(['id', 'name'])))

        const typeString = (pass as any).convertTypeToString(plainObject)

        expect(typeString).toContain('id: number;')
        expect(typeString).toContain('name: string;')
    })

    test('2. TypeScriptGeneratorPass lowers NullableWrapperObject to "InnerType | null"', () => {
        const pass = new TypeScriptGeneratorPass()

        const innerType = new PrimitiveType(PrimitiveKind.STRING)
        const props = new ImmutableMap(new Map<string, SemanticType>([
            ['__value', innerType]
        ]))
        const annotations = new ImmutableMap(new Map<string, string>([
            ['kind', 'nullable_wrapper']
        ]))

        const nullableObject = new ObjectType(props, new ImmutableSet(new Set(['__value'])), undefined, [], annotations)

        const typeString = (pass as any).convertTypeToString(nullableObject)

        expect(typeString).toBe('string | null')
    })

    test('3. Domain Factory resolveObjectType correctly resolves baseline ObjectType ASTs', () => {
        const innerType = new PrimitiveType(PrimitiveKind.NUMBER)
        const nullableObject = new ObjectType(
            new ImmutableMap(new Map([['__value', innerType]])),
            new ImmutableSet(new Set(['__value'])),
            undefined,
            [],
            new ImmutableMap(new Map([['kind', 'nullable_wrapper']]))
        )

        const resolvedNullable = resolveObjectType(nullableObject)
        expect(resolvedNullable).toBeInstanceOf(NullableWrapperObject)
        if (resolvedNullable instanceof NullableWrapperObject) {
            expect(resolvedNullable.innerType).toBe(innerType)
        }

        const plainObject = new ObjectType(
            new ImmutableMap(new Map([
                ['__meta', innerType],
                ['id', innerType]
            ])),
            new ImmutableSet(new Set(['id']))
        )

        const resolvedPlain = resolveObjectType(plainObject)
        expect(resolvedPlain).toBeInstanceOf(PlainObject)
        expect(resolvedPlain.getCleanProperties()).toHaveLength(1)
        expect(resolvedPlain.getCleanProperties()[0][0]).toBe('id')
    })
})
