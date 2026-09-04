import { describe, it, expect } from 'vitest';
import { FormActionGenerator } from '../FormActionGenerator';
import { PrimitiveType, PrimitiveKind, ReadonlyCollectionType, CollectionKind, ObjectType } from '../../../types/SemanticType';
import type { RequestField } from '../../../artifacts/RequestTypesArtifact';

describe('FormActionGenerator SSOT & TypeScriptTypeLowerer Integration Tests', () => {
    it('1. should generate clean action block for scalar primitives', () => {
        const generator = new FormActionGenerator();
        const fields: RequestField[] = [
            {
                name: 'nama',
                transformedName: 'nama',
                type: new PrimitiveType(PrimitiveKind.STRING),
                required: true,
                nullable: false
            },
            {
                name: 'stok',
                transformedName: 'stok',
                type: new PrimitiveType(PrimitiveKind.NUMBER),
                required: false,
                nullable: true
            }
        ];

        const action = generator.generateAction('create', fields);

        expect(action.lines).toContain('    nama: string');
        expect(action.lines).toContain('    stok?: number | null');
    });

    it('2. should handle array-of-objects collection types cleanly using SSOT', () => {
        const generator = new FormActionGenerator();
        const props = new Map([
            ['produk_item_id', new PrimitiveType(PrimitiveKind.NUMBER)],
            ['qty', new PrimitiveType(PrimitiveKind.NUMBER)]
        ]);
        const itemObj = new ObjectType(props);

        const collection = new ReadonlyCollectionType(CollectionKind.ARRAY, itemObj);

        const fields: RequestField[] = [
            {
                name: 'items',
                transformedName: 'items',
                type: collection,
                required: true,
                nullable: false
            }
        ];

        const action = generator.generateAction('create', fields);
        const code = action.lines.join('\n');

        expect(code).toContain('items:');
        expect(code).toContain('produkItemId');
        expect(code).toContain('qty');
    });
});
