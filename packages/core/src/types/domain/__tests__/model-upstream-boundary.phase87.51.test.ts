import { describe, expect, it } from 'vitest';
import { ModelKeyTypeMapper } from '../eloquentTypes';
import { resolveModelColumns } from '../../../compiler/scanner/subscanners/model/columnInferrer';

describe('model upstream boundary Phase 87.51', () => {
    it('rejects an unsupported explicit Eloquent key type instead of defaulting', () => {
        expect(() => ModelKeyTypeMapper.normalize('made_up')).toThrow(
            'unsupported Eloquent $keyType "made_up"'
        );
    });

    it('requires database schema evidence before producing model columns', () => {
        expect(() => resolveModelColumns('users', new Map())).toThrow(
            'migration schema for table "users" was not found'
        );
    });
});
