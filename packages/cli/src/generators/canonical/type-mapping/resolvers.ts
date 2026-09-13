/**
 * resolvers.ts
 *
 * SQL and Cast type mapping resolution logic.
 *
 * @module cli/generators/canonical/type-mapping
 */

import type { SqlTypeMapping } from './constants';

export function getSqlTypeMapping(sqlType: string): SqlTypeMapping | null {
    const enumMatch = sqlType.match(/^enum\(([^)]*)\)$/i);
    if (enumMatch) {
        const rawValues = enumMatch[1];
        const values = Array.from(rawValues.matchAll(/'((?:[^'\\]|\\.)*)'/g)).map((m) => m[1]);
        if (values.length > 0) {
            const zodValues = values.map((v) => `'${v}'`).join(', ');
            return {
                zodType: `z.enum([${zodValues}])`,
                tsType: values.map((v) => `'${v}'`).join(' | '),
                baseType: 'string',
                isNullable: false,
            };
        }
    }

    if (sqlType.includes('varchar') || sqlType.includes('text') || sqlType === 'string' || sqlType === 'char') {
        return { zodType: 'z.string()', tsType: 'string', baseType: 'string', isNullable: false };
    }

    if (
        sqlType.includes('int') ||
        sqlType === 'bigint' ||
        sqlType === 'decimal' ||
        sqlType === 'float' ||
        sqlType === 'double'
    ) {
        return { zodType: 'z.number()', tsType: 'number', baseType: 'number', isNullable: false };
    }

    if (sqlType === 'boolean' || sqlType === 'bool' || sqlType === 'tinyint(1)') {
        return { zodType: 'z.boolean()', tsType: 'boolean', baseType: 'boolean', isNullable: false };
    }

    if (sqlType === 'json' || sqlType === 'jsonb') {
        return {
            zodType: 'z.record(z.string(), z.unknown())',
            tsType: 'Record<string, unknown>',
            baseType: 'object',
            isNullable: false,
        };
    }

    if (sqlType.includes('datetime') || sqlType === 'timestamp' || sqlType === 'date' || sqlType === 'time' || sqlType === 'year') {
        return { zodType: 'z.string()', tsType: 'string', baseType: 'string', isNullable: false };
    }

    return null;
}

export function getCastMapping(castType: string): SqlTypeMapping | null {
    if (castType === 'string') {
        return { zodType: 'z.string()', tsType: 'string', baseType: 'string', isNullable: false };
    }

    if (castType === 'int' || castType === 'integer' || castType === 'float' || castType === 'double') {
        return { zodType: 'z.number()', tsType: 'number', baseType: 'number', isNullable: false };
    }

    if (castType === 'bool' || castType === 'boolean') {
        return { zodType: 'z.boolean()', tsType: 'boolean', baseType: 'boolean', isNullable: false };
    }

    if (castType === 'array' || castType === 'collection') {
        return { zodType: 'z.array(z.unknown())', tsType: 'unknown[]', baseType: 'array', isNullable: false };
    }

    if (castType === 'json' || castType === 'object') {
        return {
            zodType: 'z.record(z.string(), z.unknown())',
            tsType: 'Record<string, unknown>',
            baseType: 'object',
            isNullable: false,
        };
    }

    if (castType.includes('date') || castType.includes('datetime') || castType.includes('timestamp')) {
        return { zodType: 'z.string()', tsType: 'string', baseType: 'string', isNullable: false };
    }

    return null;
}

export function mapSqlTypeToMapping(sqlType: string, cast?: string): SqlTypeMapping {
    const baseType = (sqlType || 'unknown').toLowerCase();

    if (cast) {
        const castLower = cast.toLowerCase();
        const mapping = getCastMapping(castLower);
        if (mapping) return mapping;
    }

    const mapping = getSqlTypeMapping(baseType);
    if (mapping) return mapping;

    return {
        zodType: 'z.unknown()',
        tsType: 'unknown',
        baseType: 'unknown',
        isNullable: false,
    };
}
