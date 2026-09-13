/**
 * constants.ts
 *
 * SQL and Eloquent Cast type definitions and maps.
 *
 * @module cli/generators/canonical/type-mapping
 */

export const SQL_TO_TYPE_MAP = {
    // String types
    'string': { zod: 'z.string()', ts: 'string', tsType: 'string' as const },
    'text': { zod: 'z.string()', ts: 'string', tsType: 'string' as const },
    'varchar': { zod: 'z.string()', ts: 'string', tsType: 'string' as const },
    'char': { zod: 'z.string()', ts: 'string', tsType: 'string' as const },
    'longtext': { zod: 'z.string()', ts: 'string', tsType: 'string' as const },
    'mediumtext': { zod: 'z.string()', ts: 'string', tsType: 'string' as const },

    // Numeric types
    'bigint': { zod: 'z.number()', ts: 'number', tsType: 'number' as const },
    'int': { zod: 'z.number()', ts: 'number', tsType: 'number' as const },
    'integer': { zod: 'z.number()', ts: 'number', tsType: 'number' as const },
    'smallint': { zod: 'z.number()', ts: 'number', tsType: 'number' as const },
    'tinyint': { zod: 'z.number()', ts: 'number', tsType: 'number' as const },
    'decimal': { zod: 'z.number()', ts: 'number', tsType: 'number' as const },
    'float': { zod: 'z.number()', ts: 'number', tsType: 'number' as const },
    'double': { zod: 'z.number()', ts: 'number', tsType: 'number' as const },

    // Boolean types
    'boolean': { zod: 'z.boolean()', ts: 'boolean', tsType: 'boolean' as const },
    'bool': { zod: 'z.boolean()', ts: 'boolean', tsType: 'boolean' as const },
    'tinyint(1)': { zod: 'z.boolean()', ts: 'boolean', tsType: 'boolean' as const },

    // JSON types
    'json': { zod: 'z.record(z.string(), z.unknown())', ts: 'Record<string, unknown>', tsType: 'object' as const },
    'jsonb': { zod: 'z.record(z.string(), z.unknown())', ts: 'Record<string, unknown>', tsType: 'object' as const },

    // Date/Time types
    'datetime': { zod: 'z.string()', ts: 'string', tsType: 'string' as const },
    'timestamp': { zod: 'z.string()', ts: 'string', tsType: 'string' as const },
    'date': { zod: 'z.string()', ts: 'string', tsType: 'string' as const },
    'time': { zod: 'z.string()', ts: 'string', tsType: 'string' as const },
    'year': { zod: 'z.string()', ts: 'string', tsType: 'string' as const },

    // Fallback untuk unknown type
    'unknown': { zod: 'z.unknown()', ts: 'unknown', tsType: 'unknown' as const },
} as const;

export const CAST_TO_TYPE_MAP = {
    'string': { zod: 'z.string()', ts: 'string', tsType: 'string' as const },
    'int': { zod: 'z.number()', ts: 'number', tsType: 'number' as const },
    'integer': { zod: 'z.number()', ts: 'number', tsType: 'number' as const },
    'float': { zod: 'z.number()', ts: 'number', tsType: 'number' as const },
    'double': { zod: 'z.number()', ts: 'number', tsType: 'number' as const },
    'bool': { zod: 'z.boolean()', ts: 'boolean', tsType: 'boolean' as const },
    'boolean': { zod: 'z.boolean()', ts: 'boolean', tsType: 'boolean' as const },
    'array': { zod: 'z.array(z.unknown())', ts: 'unknown[]', tsType: 'array' as const },
    'json': { zod: 'z.record(z.string(), z.unknown())', ts: 'Record<string, unknown>', tsType: 'object' as const },
    'object': { zod: 'z.record(z.string(), z.unknown())', ts: 'Record<string, unknown>', tsType: 'object' as const },
    'collection': { zod: 'z.array(z.unknown())', ts: 'unknown[]', tsType: 'array' as const },
    'date': { zod: 'z.string()', ts: 'string', tsType: 'string' as const },
    'datetime': { zod: 'z.string()', ts: 'string', tsType: 'string' as const },
    'timestamp': { zod: 'z.string()', ts: 'string', tsType: 'string' as const },
    'immutable_date': { zod: 'z.string()', ts: 'string', tsType: 'string' as const },
    'immutable_datetime': { zod: 'z.string()', ts: 'string', tsType: 'string' as const },
} as const;

export interface SqlTypeMapping {
    readonly zodType: string;
    readonly tsType: string;
    readonly baseType: string;
    readonly isNullable: boolean;
}
