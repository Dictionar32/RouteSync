import { describe, test, expect } from 'vitest'
import { createFieldCollection, mapFieldCollection } from '../FieldCollection'
import type { FieldCollection } from '../FieldCollection'

interface RawField {
    readonly originalName: string
    readonly phpType: string
}

interface NormalizedFormField {
    readonly fieldName: string
    readonly tsType: string
}

describe('Cross-Flow Shared FieldCollection Flow Operations', () => {
    test('createFieldCollection should construct immutable FieldCollection<T>', () => {
        const rawFields: RawField[] = [
            { originalName: 'email', phpType: 'string' },
            { originalName: 'is_active', phpType: 'boolean' }
        ]

        const collection: FieldCollection<RawField> = createFieldCollection(rawFields)

        expect(collection.fields).toHaveLength(2)
        expect(collection.fields[0].originalName).toBe('email')
    })

    test('mapFieldCollection should transform collection from one domain representation to another across flows', () => {
        const rawCollection: FieldCollection<RawField> = createFieldCollection([
            { originalName: 'email', phpType: 'string' },
            { originalName: 'age', phpType: 'int' }
        ])

        // Transform RawField collection -> NormalizedFormField collection across pipeline stages
        const normalizedCollection: FieldCollection<NormalizedFormField> = mapFieldCollection(
            rawCollection,
            (raw) => ({
                fieldName: raw.originalName,
                tsType: raw.phpType === 'int' ? 'number' : raw.phpType
            })
        )

        expect(normalizedCollection.fields).toHaveLength(2)
        expect(normalizedCollection.fields[0]).toEqual({ fieldName: 'email', tsType: 'string' })
        expect(normalizedCollection.fields[1]).toEqual({ fieldName: 'age', tsType: 'number' })
    })
})
