import { describe, expect, it } from 'vitest';
import {
  EloquentCastKind,
  matchEloquentCastKind,
  ModelKeyType,
  matchModelKeyType,
} from '../eloquentTypes';

describe('Model upstream ADT invariants', () => {
  it('keeps model key type closed at the parser boundary', () => {
    expect(matchModelKeyType(ModelKeyType.Uuid, {
      int: () => 'int',
      bigint: () => 'bigint',
      string: () => 'string',
      uuid: () => 'uuid',
      ulid: () => 'ulid',
    })).toBe('uuid');
  });

  it('keeps cast classification exhaustive without a fallback variant', () => {
    expect(matchEloquentCastKind(EloquentCastKind.Boolean, {
      integer: () => 'integer', float: () => 'float', decimal: () => 'decimal',
      boolean: () => 'boolean', string: () => 'string', datetime: () => 'datetime',
      date: () => 'date', timestamp: () => 'timestamp', array: () => 'array',
      json: () => 'json', object: () => 'object', collection: () => 'collection',
      encrypted: () => 'encrypted', custom: () => 'custom',
    })).toBe('boolean');
  });
});
