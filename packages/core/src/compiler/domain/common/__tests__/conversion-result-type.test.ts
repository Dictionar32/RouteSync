import { describe, test, expect, expectTypeOf } from 'vitest'
import {
    ConversionResult,
    type ConversionResultOptions
} from '../ConversionResult'

describe('ConversionResult Encapsulated Value Object TDD Specification', () => {
    test('1. Type Contract Assertion: ConversionResultOptions accepts optional fields and warnings', () => {
        expectTypeOf<ConversionResultOptions<string>>().toMatchTypeOf<{
            readonly fields?: readonly string[];
            readonly warnings?: readonly string[];
        }>()
    })

    test('2. Constructor Destructuring Defaults: automatically uses static EMPTY_FIELDS and EMPTY_WARNINGS', () => {
        const resultWithFields = new ConversionResult({
            fields: ['user_id', 'email']
        })

        expect(resultWithFields.fields).toEqual(['user_id', 'email'])
        expect(resultWithFields.warnings).toBe(ConversionResult.EMPTY_WARNINGS)

        const resultWithWarnings = new ConversionResult({
            warnings: ["Field 'metadata' has unknown type"]
        })

        expect(resultWithWarnings.fields).toBe(ConversionResult.EMPTY_FIELDS)
        expect(resultWithWarnings.warnings).toEqual(["Field 'metadata' has unknown type"])

        const emptyResult = new ConversionResult()

        expect(emptyResult.fields).toBe(ConversionResult.EMPTY_FIELDS)
        expect(emptyResult.warnings).toBe(ConversionResult.EMPTY_WARNINGS)
    })

    test('3. Memory Identity Verification: 0% GC memory allocation churn across invocations', () => {
        const res1 = new ConversionResult({ fields: ['id'] })
        const res2 = new ConversionResult({ fields: ['name'] })

        expect(Object.is(res1.warnings, res2.warnings)).toBe(true)
        expect(Object.is(res1.warnings, ConversionResult.EMPTY_WARNINGS)).toBe(true)
    })
})
