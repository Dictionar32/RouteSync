import { describe, expect, it } from 'vitest';
import { ModelKeyTypeMapper } from '../eloquentTypes';
import { resolveModelColumns } from '../../../compiler/scanner/subscanners/model/columnInferrer';
import type { TableName } from '../../upstream/names';

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

    it('requires database schema evidence before producing model columns', () => {
        expect(() => resolveModelColumns(usersTable, [])).toThrow(
            'migration schema for table "users" was not found'
        );
    });
});
