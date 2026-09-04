import { describe, test, expect } from 'vitest'
import {
    PrimitiveType,
    PrimitiveKind,
    ObjectType,
    ReferenceType,
    SemanticTypeBase,
    type SemanticType
} from '../../../types/SemanticType'
import { ImmutableMap, ImmutableSet } from '../../../utils/ImmutableCollections'
import {
    convertObjectType,
    convertSingleResponseField,
    convertResponseFields,
    resolveNullableWrapper,
    partitionResults
} from '../../../passes/contract-generator-domain'
import { ConversionResult } from '../ConversionResult'

describe('ResponseFieldLowering Migration Baseline TDD Test Suite', () => {
    test('1. convertObjectType lowers plain ObjectType with clean properties and 0% meta keys', () => {
        const userProps = new ImmutableMap(new Map<string, SemanticType>([
            ['id', new PrimitiveType(PrimitiveKind.NUMBER)],
            ['name', new PrimitiveType(PrimitiveKind.STRING)],
            ['__meta', new PrimitiveType(PrimitiveKind.STRING)]
        ]))

        const plainObject = new ObjectType(userProps, new ImmutableSet(new Set(['id', 'name'])))

        const result = convertObjectType('user', plainObject)

        expect(result.fields).toHaveLength(1)
        expect(result.fields[0].name).toBe('user')
        expect(result.fields[0].kind).toBe('object')
        expect(result.fields[0].fields).toHaveLength(2)
        expect(result.fields[0].fields![0].name).toBe('id')
        expect(result.fields[0].fields![1].name).toBe('name')
        expect(result.warnings).toHaveLength(0)
    })

    test('2. convertObjectType lowers nullable_wrapper ObjectType directly unwrapping innerType', () => {
        const innerType = new PrimitiveType(PrimitiveKind.STRING)
        const props = new ImmutableMap(new Map<string, SemanticType>([
            ['__value', innerType]
        ]))
        const annotations = new ImmutableMap(new Map<string, string>([
            ['kind', 'nullable_wrapper']
        ]))

        const nullableObject = new ObjectType(props, new ImmutableSet(new Set(['__value'])), undefined, [], annotations)

        const result = convertObjectType('title', nullableObject)

        expect(result.fields).toHaveLength(1)
        expect(result.fields[0].name).toBe('title')
        expect(result.fields[0].type).toBe('string')
        expect(result.fields[0].nullable).toBe(true)
        expect(result.warnings).toHaveLength(0)
    })

    test('3. resolveNullableWrapper resolves valid wrapper and returns isNullableWrapper: true', () => {
        const innerType = new PrimitiveType(PrimitiveKind.NUMBER)
        const props = new ImmutableMap(new Map<string, SemanticType>([
            ['__value', innerType]
        ]))
        const annotations = new ImmutableMap(new Map<string, string>([
            ['kind', 'nullable_wrapper']
        ]))

        const nullableObject = new ObjectType(props, new ImmutableSet(new Set(['__value'])), undefined, [], annotations)

        const wrapperResult = resolveNullableWrapper('age', nullableObject)

        expect(wrapperResult.isNullableWrapper).toBe(true)
        if (wrapperResult.isNullableWrapper) {
            expect(wrapperResult.field.name).toBe('age')
            expect(wrapperResult.field.type).toBe('number')
            expect(wrapperResult.field.nullable).toBe(true)
        }
    })

    test('4. convertSingleResponseField handles unsupported SemanticType kind returning empty fields and warning', () => {
        const unsupportedType = new class extends SemanticTypeBase {
            public override readonly kind = 'unsupported_kind' as unknown as SemanticType['kind']
        }() as SemanticType

        const result = convertSingleResponseField('invalidField', unsupportedType)

        expect(result.fields).toEqual([])
        expect(result.warnings).toHaveLength(1)
        expect(result.warnings[0]).toContain("Skipped field 'invalidField'")
    })

    test('5. convertResponseFields converts property Record and accumulates warnings cleanly', () => {
        const validProp = new PrimitiveType(PrimitiveKind.STRING)
        const invalidProp = new class extends SemanticTypeBase {
            public override readonly kind = 'unsupported_kind' as unknown as SemanticType['kind']
        }() as SemanticType

        const properties: Record<string, SemanticType> = {
            valid: validProp,
            invalid: invalidProp
        }

        const result = convertResponseFields(properties)

        expect(result.fields).toHaveLength(1)
        expect(result.fields[0].name).toBe('valid')
        expect(result.warnings).toHaveLength(1)
        expect(result.warnings[0]).toContain("invalid")
    })

    test('6. partitionResults partitions ConversionResult list preserving referential integrity', () => {
        const field1 = { name: 'id', kind: 'primitive' as const, type: 'number', nullable: false, optional: false }
        const res1 = new ConversionResult({ fields: [field1] })
        const res2 = new ConversionResult({ warnings: ['warning_msg'] })

        const partitioned = partitionResults([res1, res2])

        expect(partitioned.fields).toEqual([field1])
        expect(partitioned.warnings).toEqual(['warning_msg'])
    })
})
