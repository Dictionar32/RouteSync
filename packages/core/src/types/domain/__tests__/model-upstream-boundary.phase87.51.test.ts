import { describe, expect, it } from 'vitest';
import { ModelKeyTypeMapper } from '../eloquentTypes';
import type { TableName } from '../../upstream/names';
import type { SchemaAst } from '../../upstream/schema';

const usersTable: TableName = {
    kind: 'table_name',
    value: { kind: 'string_value', value: 'users' }
};

describe('model upstream boundary Phase 87.51', () => {
    it('rejects an unsupported explicit Eloquent key type instead of defaulting', () => {
        expect(() => ModelKeyTypeMapper.normalize('made_up')).toThrow(
            'unsupported Eloquent $keyType "made_up"'
        );
    });

    it('keeps canonical schema evidence separate from model key normalization', () => {
        const schema: SchemaAst = {
            kind: 'schema_ast',
            definition: {
                kind: 'schema_definition',
                tables: { kind: 'schema_tables', items: { kind: 'empty' } },
                source: { kind: 'source_span', file: { kind: 'source_file', value: { kind: 'string_value', value: 'test.php' } }, start: { kind: 'number_value', value: 0 }, end: { kind: 'number_value', value: 0 } },
            },
            source: { kind: 'source_span', file: { kind: 'source_file', value: { kind: 'string_value', value: 'test.php' } }, start: { kind: 'number_value', value: 0 }, end: { kind: 'number_value', value: 0 } },
        };
        expect(schema.definition.tables.items.kind).toBe('empty');
        expect(ModelKeyTypeMapper.normalize('integer')).toBe('int');
    });;
});
