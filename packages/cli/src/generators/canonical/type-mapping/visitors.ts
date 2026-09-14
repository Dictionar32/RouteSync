/**
 * visitors.ts
 *
 * Pure Catamorphic Visitors for SQL and Eloquent Cast type mapping.
 * 0 'if', 0 'switch', 0 naked 'Record', total exhaustive dispatch.
 *
 * @module cli/generators/canonical/type-mapping
 */

import {
    DatabaseColumnKind,
    type DatabaseColumnKindVisitor,
    EloquentCastKind,
    type EloquentCastKindVisitor,
} from '@routesync/core';
import type { SqlTypeMapping } from './constants';

export const UNKNOWN_SQL_TYPE_MAPPING: SqlTypeMapping = Object.freeze({
    zodType: 'z.unknown()',
    tsType: 'unknown',
    baseType: 'unknown',
    isNullable: false,
});

const STRING_MAPPING: SqlTypeMapping = Object.freeze({
    zodType: 'z.string()',
    tsType: 'string',
    baseType: 'string',
    isNullable: false,
});

const NUMBER_MAPPING: SqlTypeMapping = Object.freeze({
    zodType: 'z.number()',
    tsType: 'number',
    baseType: 'number',
    isNullable: false,
});

const BOOLEAN_MAPPING: SqlTypeMapping = Object.freeze({
    zodType: 'z.boolean()',
    tsType: 'boolean',
    baseType: 'boolean',
    isNullable: false,
});

const JSON_MAPPING: SqlTypeMapping = Object.freeze({
    zodType: 'z.record(z.string(), z.unknown())',
    tsType: 'Record<string, unknown>',
    baseType: 'object',
    isNullable: false,
});

const ARRAY_MAPPING: SqlTypeMapping = Object.freeze({
    zodType: 'z.array(z.unknown())',
    tsType: 'unknown[]',
    baseType: 'array',
    isNullable: false,
});

function parseEnumMapping(sqlType: string): SqlTypeMapping {
    const rawValues = Array.from(sqlType.matchAll(/'((?:[^'\\]|\\.)*)'/g)).map((m) => m[1]);
    const zodValues = rawValues.map((v) => `'${v}'`).join(', ');
    return rawValues.length > 0
        ? {
              zodType: `z.enum([${zodValues}])`,
              tsType: rawValues.map((v) => `'${v}'`).join(' | '),
              baseType: 'string',
              isNullable: false,
          }
        : STRING_MAPPING;
}

export function createSqlTypeVisitor(rawSqlType: string): DatabaseColumnKindVisitor<SqlTypeMapping> {
    const rawLower = (rawSqlType || '').trim().toLowerCase();
    const isTinyInt1 = rawLower === 'tinyint(1)' || rawLower.startsWith('tinyint(1)');

    return {
        [DatabaseColumnKind.BigInt]: () => NUMBER_MAPPING,
        [DatabaseColumnKind.Integer]: () => NUMBER_MAPPING,
        [DatabaseColumnKind.SmallInt]: () => NUMBER_MAPPING,
        [DatabaseColumnKind.TinyInt]: () => (isTinyInt1 ? BOOLEAN_MAPPING : NUMBER_MAPPING),
        [DatabaseColumnKind.Float]: () => NUMBER_MAPPING,
        [DatabaseColumnKind.Double]: () => NUMBER_MAPPING,
        [DatabaseColumnKind.Decimal]: () => NUMBER_MAPPING,
        [DatabaseColumnKind.Boolean]: () => BOOLEAN_MAPPING,
        [DatabaseColumnKind.String]: () => STRING_MAPPING,
        [DatabaseColumnKind.Text]: () => STRING_MAPPING,
        [DatabaseColumnKind.MediumText]: () => STRING_MAPPING,
        [DatabaseColumnKind.LongText]: () => STRING_MAPPING,
        [DatabaseColumnKind.Date]: () => STRING_MAPPING,
        [DatabaseColumnKind.DateTime]: () => STRING_MAPPING,
        [DatabaseColumnKind.Timestamp]: () => STRING_MAPPING,
        [DatabaseColumnKind.Time]: () => STRING_MAPPING,
        [DatabaseColumnKind.Json]: () => JSON_MAPPING,
        [DatabaseColumnKind.Enum]: () => parseEnumMapping(rawSqlType),
        [DatabaseColumnKind.Binary]: () => STRING_MAPPING,
        [DatabaseColumnKind.Uuid]: () => STRING_MAPPING,
        [DatabaseColumnKind.Ulid]: () => STRING_MAPPING,
        [DatabaseColumnKind.Unknown]: () => UNKNOWN_SQL_TYPE_MAPPING,
    };
}

export const CAST_TYPE_VISITOR: EloquentCastKindVisitor<SqlTypeMapping> = Object.freeze({
    [EloquentCastKind.Integer]: () => NUMBER_MAPPING,
    [EloquentCastKind.Float]: () => NUMBER_MAPPING,
    [EloquentCastKind.Decimal]: () => NUMBER_MAPPING,
    [EloquentCastKind.Boolean]: () => BOOLEAN_MAPPING,
    [EloquentCastKind.String]: () => STRING_MAPPING,
    [EloquentCastKind.DateTime]: () => STRING_MAPPING,
    [EloquentCastKind.Date]: () => STRING_MAPPING,
    [EloquentCastKind.Timestamp]: () => STRING_MAPPING,
    [EloquentCastKind.Array]: () => ARRAY_MAPPING,
    [EloquentCastKind.Json]: () => JSON_MAPPING,
    [EloquentCastKind.Object]: () => JSON_MAPPING,
    [EloquentCastKind.Collection]: () => ARRAY_MAPPING,
    [EloquentCastKind.Encrypted]: () => STRING_MAPPING,
    [EloquentCastKind.Custom]: () => UNKNOWN_SQL_TYPE_MAPPING,
});
