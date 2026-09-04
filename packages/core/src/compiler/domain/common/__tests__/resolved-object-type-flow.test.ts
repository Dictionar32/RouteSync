import { describe, test, expect } from 'vitest'
import {
    PrimitiveType,
    PrimitiveKind,
    ObjectType,
    ReferenceType,
    type SemanticType
} from '../../../types/SemanticType'
import { ImmutableMap, ImmutableSet } from '../../../utils/ImmutableCollections'
import {
    NullableWrapperObject,
    PlainObject,
    resolveObjectType,
    type ResolvedObjectTypeUnion
} from '../ResolvedObjectType'

describe('ResolvedObjectType Origin Boundary Flow & Polymorphism Tests', () => {
    test('Origin Flow: resolveObjectType returns NullableWrapperObject when annotation is nullable_wrapper and __value exists', () => {
        const innerType: SemanticType = new PrimitiveType(PrimitiveKind.STRING)
        const properties = new ImmutableMap(new Map<string, SemanticType>([
            ['__value', innerType]
        ]))
        const annotations = new ImmutableMap(new Map<string, string>([
            ['kind', 'nullable_wrapper']
        ]))

        const nullableObjectType = new ObjectType(
            properties,
            new ImmutableSet(new Set(['__value'])),
            undefined,
            [],
            annotations
        )

        const resolved = resolveObjectType(nullableObjectType)

        expect(resolved).toBeInstanceOf(NullableWrapperObject)
        expect(resolved.kind).toBe('nullable_wrapper')
        if (resolved instanceof NullableWrapperObject) {
            expect(resolved.innerType).toBe(innerType)
        }
        expect(resolved.rawObject).toBe(nullableObjectType)
    })

    test('Origin Flow: resolveObjectType returns PlainObject for standard structural object without annotations', () => {
        const properties = new ImmutableMap(new Map<string, SemanticType>([
            ['id', new PrimitiveType(PrimitiveKind.NUMBER)],
            ['title', new PrimitiveType(PrimitiveKind.STRING)]
        ]))

        const plainObjectType = new ObjectType(
            properties,
            new ImmutableSet(new Set(['id', 'title']))
        )

        const resolved = resolveObjectType(plainObjectType)

        expect(resolved).toBeInstanceOf(PlainObject)
        expect(resolved.kind).toBe('plain')
        expect(resolved.rawObject).toBe(plainObjectType)
    })

    test('Origin Flow: resolveObjectType falls back to PlainObject when kind annotation is nullable_wrapper but __value is missing', () => {
        const properties = new ImmutableMap(new Map<string, SemanticType>())
        const annotations = new ImmutableMap(new Map<string, string>([
            ['kind', 'nullable_wrapper']
        ]))

        const invalidNullableObject = new ObjectType(
            properties,
            new ImmutableSet(new Set()),
            undefined,
            [],
            annotations
        )

        const resolved = resolveObjectType(invalidNullableObject)

        expect(resolved).toBeInstanceOf(PlainObject)
        expect(resolved.kind).toBe('plain')
    })

    test('Domain Helper: getCleanProperties filters out internal __ meta keys and preserves clean domain properties', () => {
        const prop1 = new PrimitiveType(PrimitiveKind.NUMBER)
        const prop2 = new PrimitiveType(PrimitiveKind.STRING)
        const internalMeta = new PrimitiveType(PrimitiveKind.STRING)

        const properties = new ImmutableMap(new Map<string, SemanticType>([
            ['__value', internalMeta],
            ['__meta', internalMeta],
            ['id', prop1],
            ['title', prop2]
        ]))

        const objectType = new ObjectType(
            properties,
            new ImmutableSet(new Set(['id', 'title']))
        )

        const resolved = resolveObjectType(objectType)
        const cleanProps = resolved.getCleanProperties()

        expect(cleanProps).toHaveLength(2)
        expect(cleanProps[0][0]).toBe('id')
        expect(cleanProps[0][1]).toBe(prop1)
        expect(cleanProps[1][0]).toBe('title')
        expect(cleanProps[1][1]).toBe(prop2)
    })

    test('Constructor Options Object Contract: NullableWrapperObject and PlainObject consume named options objects', () => {
        const innerType: SemanticType = new ReferenceType('App\\Models', 'User')
        const rawObject = new ObjectType(new ImmutableMap(new Map()), new ImmutableSet(new Set()))

        const nullableWrapper = new NullableWrapperObject({
            rawObject,
            innerType
        })

        const plainObject = new PlainObject({
            rawObject
        })

        expect(nullableWrapper.kind).toBe('nullable_wrapper')
        expect(nullableWrapper.innerType).toBe(innerType)
        expect(nullableWrapper.rawObject).toBe(rawObject)

        expect(plainObject.kind).toBe('plain')
        expect(plainObject.rawObject).toBe(rawObject)
    })

    test('Flow Lowering: lowerObjectType consumes ResolvedObjectTypeUnion and returns StageResult<ParsedResponseField>', () => {
        const innerType: SemanticType = new PrimitiveType(PrimitiveKind.NUMBER)
        const rawObject = new ObjectType(new ImmutableMap(new Map()), new ImmutableSet(new Set()))

        const nullableWrapper = new NullableWrapperObject({
            rawObject,
            innerType
        })

        interface LowerObjectTypeOptions {
            readonly fieldName: string;
            readonly resolved: ResolvedObjectTypeUnion;
        }

        interface MockParsedResponseField {
            readonly name: string;
            readonly type: string;
            readonly nullable: boolean;
        }

        interface StageResult<T> {
            readonly fields: readonly T[];
            readonly warnings: readonly string[];
        }

        const EMPTY_WARNINGS: readonly string[] = Object.freeze([])
        const EMPTY_FIELDS: readonly never[] = Object.freeze([])

        function convertInnerType(type: SemanticType): StageResult<string> {
            switch (type.kind) {
                case 'primitive':
                    return { fields: [type.kind], warnings: EMPTY_WARNINGS }
                case 'reference':
                    return { fields: [type.name], warnings: [`Reference type '${type.name}' requires schema mapping`] }
                default:
                    return { fields: EMPTY_FIELDS, warnings: [`Unsupported inner type kind`] }
            }
        }

        function lowerObjectType({ fieldName, resolved }: LowerObjectTypeOptions): StageResult<MockParsedResponseField> {
            switch (resolved.kind) {
                case 'nullable_wrapper': {
                    const innerResult = convertInnerType(resolved.innerType)
                    const innerKind = innerResult.fields[0]
                    switch (innerKind) {
                        case undefined:
                            return { fields: EMPTY_FIELDS, warnings: innerResult.warnings }
                        default:
                            return {
                                fields: [{
                                    name: fieldName,
                                    type: innerKind,
                                    nullable: true
                                }],
                                warnings: innerResult.warnings
                            }
                    }
                }
                case 'plain':
                    return {
                        fields: [{
                            name: fieldName,
                            type: 'object',
                            nullable: false
                        }],
                        warnings: EMPTY_WARNINGS
                    }
            }
        }

        // Test 1: Clean lowering propagates EMPTY_WARNINGS singleton
        const cleanResult = lowerObjectType({
            fieldName: 'age',
            resolved: nullableWrapper
        })

        expect(cleanResult.fields).toEqual([{
            name: 'age',
            type: 'primitive',
            nullable: true
        }])
        expect(cleanResult.warnings).toBe(EMPTY_WARNINGS)

        // Test 2: Warning propagation when innerType produces diagnostic warning (using real ReferenceType instance)
        const warningType: SemanticType = new ReferenceType('App\\Models', 'UnknownModel')
        const warningWrapper = new NullableWrapperObject({
            rawObject,
            innerType: warningType
        })

        const warningResult = lowerObjectType({
            fieldName: 'metadata',
            resolved: warningWrapper
        })

        expect(warningResult.warnings).toEqual(["Reference type 'UnknownModel' requires schema mapping"])
    })
})
