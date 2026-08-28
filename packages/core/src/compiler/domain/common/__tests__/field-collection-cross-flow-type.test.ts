import { describe, test, expect, expectTypeOf } from 'vitest'
import type { FieldCollection } from '../FieldCollection'

// Sample cross-flow domain models
interface FormField {
    readonly name: string
    readonly tsType: string
    readonly required: boolean
}

interface MapperField {
    readonly sourceKey: string
    readonly targetKey: string
    readonly transformFn?: string
}

describe('Cross-Flow Shared FieldCollection Type Contract', () => {
    test('FieldCollection<TField> should handle primitive string fields across flows', () => {
        const stringCollection: FieldCollection<string> = {
            fields: ['email', 'password', 'redirect_to']
        }

        expect(stringCollection.fields).toHaveLength(3)
        expectTypeOf(stringCollection).toMatchTypeOf<FieldCollection<string>>()
    })

    test('FieldCollection<TField> should handle complex FormField objects in Form flow', () => {
        const formCollection: FieldCollection<FormField> = {
            fields: [
                { name: 'email', tsType: 'string', required: true },
                { name: 'age', tsType: 'number', required: false }
            ]
        }

        expect(formCollection.fields).toHaveLength(2)
        expect(formCollection.fields[0].tsType).toBe('string')
        expectTypeOf(formCollection).toMatchTypeOf<FieldCollection<FormField>>()
    })

    test('FieldCollection<TField> should handle MapperField objects in Mapper flow', () => {
        const mapperCollection: FieldCollection<MapperField> = {
            fields: [
                { sourceKey: 'user_id', targetKey: 'userId', transformFn: 'toCamelCase' }
            ]
        }

        expect(mapperCollection.fields[0].targetKey).toBe('userId')
        expectTypeOf(mapperCollection).toMatchTypeOf<FieldCollection<MapperField>>()
    })

    test('Subtyping check: FieldCollection<SpecificField> should be assignable to FieldCollection<BaseField>', () => {
        interface BaseField {
            readonly name: string
        }
        interface DetailedField extends BaseField {
            readonly details: string
        }

        const detailedCollection: FieldCollection<DetailedField> = {
            fields: [{ name: 'email', details: 'user email address' }]
        }

        // Subtyping verification: FieldCollection<DetailedField> assigns to FieldCollection<BaseField>
        const baseCollection: FieldCollection<BaseField> = detailedCollection
        expect(baseCollection.fields[0].name).toBe('email')
        expectTypeOf(detailedCollection).toMatchTypeOf<FieldCollection<BaseField>>()
    })
})
