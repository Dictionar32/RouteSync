import { describe, test, expect, expectTypeOf } from 'vitest'
import type {
    ExtractedApiField,
    DerivedApiField,
    FieldCollection,
    ExtractedFieldNames,
    UniqueFieldCollection,
    GeneratedApiFieldCode
} from '../api-field-domain'

describe('ApiField Domain Type Contract Assertions', () => {
    test('DerivedApiField should extend ExtractedApiField (is-a relationship)', () => {
        const derived: DerivedApiField = {
            originalName: 'redirect_to',
            derivedKey: 'REDIRECTTO'
        }

        // Verify subtyping: DerivedApiField can be assigned to ExtractedApiField
        const extracted: ExtractedApiField = derived
        expect(extracted.originalName).toBe('redirect_to')

        // TypeScript static type checking
        expectTypeOf(derived).toMatchTypeOf<ExtractedApiField>()
    })

    test('FieldCollection<TField> should serve as a reusable generic collection contract', () => {
        const stringCollection: FieldCollection<string> = {
            fields: ['email', 'redirect_to', 'status']
        }
        const derivedCollection: FieldCollection<DerivedApiField> = {
            fields: [{ originalName: 'email', derivedKey: 'EMAIL' }]
        }

        expect(stringCollection.fields).toHaveLength(3)
        expect(derivedCollection.fields).toHaveLength(1)

        // Type aliases ExtractedFieldNames and UniqueFieldCollection match FieldCollection<string>
        expectTypeOf(stringCollection).toMatchTypeOf<ExtractedFieldNames>()
        expectTypeOf(stringCollection).toMatchTypeOf<UniqueFieldCollection>()
    })

    test('GeneratedApiFieldCode should be a strongly typed string container', () => {
        const codeString: GeneratedApiFieldCode = '// Auto-generated\nexport const ApiApiField = {} as const\n'
        expect(typeof codeString).toBe('string')
        expect(codeString).toContain('ApiApiField')
    })
})
