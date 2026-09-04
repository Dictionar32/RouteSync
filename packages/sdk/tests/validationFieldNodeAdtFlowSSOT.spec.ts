import { describe, test, expect } from 'vitest'
import {
    matchValidationField,
    foldValidationField,
    VALIDATION_FIELD_REGISTRY,
    ValidationFieldKind,
    ValidationFieldNode,
    ScalarValidationFieldNode,
    ArrayValidationFieldNode,
    ObjectValidationFieldNode,
    ValidationRuleNode,
    ValidationRuleKind
} from '../../core/src'

describe('ValidationFieldNode ADT Flow SSOT (Zero-if Tree Folding Suite)', () => {
    const createScalarNode = (
        fieldName: string,
        propertyName: string,
        rules: readonly ValidationRuleNode[] = [{ kind: ValidationRuleKind.Required }]
    ): ScalarValidationFieldNode => ({
        kind: 'scalar',
        fieldName,
        propertyName,
        rules
    })

    test('1. matchValidationField executes single-level catamorphism without if', () => {
        const scalar = createScalarNode('name', 'name')
        const scalarResult = matchValidationField(scalar, {
            scalar: (s) => `SCALAR:${s.propertyName}`,
            array: (a) => `ARRAY:${a.propertyName}`,
            object: (o) => `OBJECT:${o.propertyName}`
        })
        expect(scalarResult).toBe('SCALAR:name')

        const array: ArrayValidationFieldNode = {
            kind: 'array',
            fieldName: 'tags',
            propertyName: 'tags',
            rules: [],
            element: createScalarNode('tag', 'tag')
        }
        const arrayResult = matchValidationField(array, {
            scalar: (s) => `SCALAR:${s.propertyName}`,
            array: (a) => `ARRAY:${a.propertyName}`,
            object: (o) => `OBJECT:${o.propertyName}`
        })
        expect(arrayResult).toBe('ARRAY:tags')
    })

    test('2. foldValidationField recursively transforms nested array-of-objects without if', () => {
        // Tree: items -> array of object { produk_item_id, qty }
        const itemObject: ObjectValidationFieldNode = {
            kind: 'object',
            fieldName: 'items.*',
            propertyName: 'item',
            fields: [
                createScalarNode('produk_item_id', 'produkItemId', [
                    { kind: ValidationRuleKind.Required },
                    { kind: ValidationRuleKind.Number }
                ]),
                createScalarNode('qty', 'qty', [
                    { kind: ValidationRuleKind.Required },
                    { kind: ValidationRuleKind.Number }
                ])
            ]
        }

        const itemsArray: ArrayValidationFieldNode = {
            kind: 'array',
            fieldName: 'items',
            propertyName: 'items',
            rules: [{ kind: ValidationRuleKind.Required }, { kind: ValidationRuleKind.Array, elementType: null }],
            element: itemObject
        }

        // Fold the AST into simulated Zod schema strings:
        const zodSchemaCode = foldValidationField(itemsArray, {
            scalar: (s) => `z.number()`,
            object: (o, fieldResults) => `z.object({ ${o.fields.map((f, i) => `${f.fieldName}: ${fieldResults[i]}`).join(', ')} })`,
            array: (a, elementResult) => `${a.propertyName}: z.array(${elementResult})`
        })

        expect(zodSchemaCode).toBe(
            'items: z.array(z.object({ produk_item_id: z.number(), qty: z.number() }))'
        )
    })

    test('3. foldValidationField recursively generates TypeScript interfaces from nested field trees', () => {
        const rootForm: ObjectValidationFieldNode = {
            kind: 'object',
            fieldName: 'orderForm',
            propertyName: 'orderForm',
            fields: [
                createScalarNode('shipping_nama', 'shippingNama'),
                {
                    kind: 'array',
                    fieldName: 'items',
                    propertyName: 'items',
                    rules: [],
                    element: {
                        kind: 'object',
                        fieldName: 'items.*',
                        propertyName: 'item',
                        fields: [
                            createScalarNode('produk_item_id', 'produkItemId'),
                            createScalarNode('qty', 'qty')
                        ]
                    }
                }
            ]
        }

        // Fold into clean TypeScript Type declarations:
        const tsInterface = foldValidationField(rootForm, {
            scalar: (s) => `${s.propertyName}: string`,
            object: (o, childResults) => `{ ${childResults.join('; ')} }`,
            array: (a, elemResult) => `${a.propertyName}: Array<${elemResult}>`
        })

        expect(tsInterface).toBe(
            '{ shippingNama: string; items: Array<{ produkItemId: string; qty: string }> }'
        )
    })

    test('4. VALIDATION_FIELD_REGISTRY enforces metadata specifications for all ValidationFieldKinds', () => {
        expect(Object.isFrozen(VALIDATION_FIELD_REGISTRY)).toBe(true)

        expect(VALIDATION_FIELD_REGISTRY[ValidationFieldKind.Scalar]).toEqual({
            kind: 'scalar',
            isContainer: false,
            allowsChildren: false
        })

        expect(VALIDATION_FIELD_REGISTRY[ValidationFieldKind.Array]).toEqual({
            kind: 'array',
            isContainer: true,
            allowsChildren: true
        })

        expect(VALIDATION_FIELD_REGISTRY[ValidationFieldKind.Object]).toEqual({
            kind: 'object',
            isContainer: true,
            allowsChildren: true
        })
    })
})
