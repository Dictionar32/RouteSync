"use strict";
/**
 * CANONICAL_NAMES.ts
 *
 * Single source of truth untuk semua naming conventions, action mappings, dan type conversions.
 *
 * RULE: Semua generator HARUS import dari file ini, jangan define sendiri.
 * Violations akan ketangkap oleh grep checks di CI/pre-commit hooks.
 *
 * Centralized dari:
 * - ZodTierGenerator (4x ACTION_MAP): CONTRACT_ACTION_MAP, SCHEMA_ACTION_MAP, MAPPER_ACTION_MAP, ACTION_IN_CRUD
 * - HookGenerator (1x): ACTION_TO_CRUD_HOOK
 * - SDKGenerator (1x): SDK_ACTION_MAP
 *
 * AFTER: Hanya 1 sumber kebenaran di sini
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.HTTP_METHOD_SAFETY = exports.HOOK_ACTION_MAP = exports.NAMING_CONVENTIONS = exports.CAST_TO_TYPE_MAP = exports.SQL_TO_TYPE_MAP = exports.ACTION_TO_HTTP_METHODS = exports.CANONICAL_ACTION_MAP = void 0;
exports.isValidHttpMethod = isValidHttpMethod;
exports.getActionFromMethod = getActionFromMethod;
exports.isMutationAction = isMutationAction;
exports.wrapNullableTs = wrapNullableTs;
exports.wrapNullableZod = wrapNullableZod;
/**
 * Canonical HTTP method → semantic action mapping
 *
 * Digunakan di:
 * - ZodTierGenerator: generateContract(), generateSchema(), generateMapper()
 * - HookGenerator: untuk derive hook action names
 * - SDKGenerator: untuk derive endpoint action names
 * - QueryKeyGenerator: untuk derive query key structure
 */
exports.CANONICAL_ACTION_MAP = {
    'post': 'Create',
    'put': 'Update',
    'patch': 'Update',
    'delete': 'Delete',
    'get': 'Get',
};
/**
 * Reverse lookup: action name → HTTP methods yang mungkin
 *
 * Note: Update bisa dari PUT atau PATCH; Create hanya dari POST
 */
exports.ACTION_TO_HTTP_METHODS = {
    'Create': ['POST'],
    'Update': ['PUT', 'PATCH'],
    'Delete': ['DELETE'],
    'Get': ['GET'],
};
/**
 * SQL database type → TypeScript type + Zod schema mapping
 *
 * Source: Laravel schema() method types + common database types
 *
 * Used by:
 * - SemanticResolver.resolveField() untuk compute ResolvedField.zodType & .tsType
 * - Emitter memakai pre-computed values, bukan mapping ini langsung
 */
exports.SQL_TO_TYPE_MAP = {
    // String types
    'string': { zod: 'z.string()', ts: 'string', tsType: 'string' },
    'text': { zod: 'z.string()', ts: 'string', tsType: 'string' },
    'varchar': { zod: 'z.string()', ts: 'string', tsType: 'string' },
    'char': { zod: 'z.string()', ts: 'string', tsType: 'string' },
    'longtext': { zod: 'z.string()', ts: 'string', tsType: 'string' },
    'mediumtext': { zod: 'z.string()', ts: 'string', tsType: 'string' },
    // Numeric types
    'bigint': { zod: 'z.number()', ts: 'number', tsType: 'number' },
    'int': { zod: 'z.number()', ts: 'number', tsType: 'number' },
    'integer': { zod: 'z.number()', ts: 'number', tsType: 'number' },
    'smallint': { zod: 'z.number()', ts: 'number', tsType: 'number' },
    'tinyint': { zod: 'z.number()', ts: 'number', tsType: 'number' },
    'decimal': { zod: 'z.number()', ts: 'number', tsType: 'number' },
    'float': { zod: 'z.number()', ts: 'number', tsType: 'number' },
    'double': { zod: 'z.number()', ts: 'number', tsType: 'number' },
    // Boolean types
    'boolean': { zod: 'z.boolean()', ts: 'boolean', tsType: 'boolean' },
    'bool': { zod: 'z.boolean()', ts: 'boolean', tsType: 'boolean' },
    'tinyint(1)': { zod: 'z.boolean()', ts: 'boolean', tsType: 'boolean' },
    // JSON types
    'json': { zod: 'z.record(z.string(), z.unknown())', ts: 'Record<string, unknown>', tsType: 'object' },
    'jsonb': { zod: 'z.record(z.string(), z.unknown())', ts: 'Record<string, unknown>', tsType: 'object' },
    // Date/Time types
    'datetime': { zod: 'z.string()', ts: 'string', tsType: 'string' },
    'timestamp': { zod: 'z.string()', ts: 'string', tsType: 'string' },
    'date': { zod: 'z.string()', ts: 'string', tsType: 'string' },
    'time': { zod: 'z.string()', ts: 'string', tsType: 'string' },
    'year': { zod: 'z.string()', ts: 'string', tsType: 'string' },
    // Fallback untuk unknown type
    'unknown': { zod: 'z.unknown()', ts: 'unknown', tsType: 'unknown' },
};
/**
 * Laravel Eloquent cast type → TypeScript type + Zod schema mapping
 *
 * Source: Laravel Eloquent $casts property
 *
 * Precedence: CAST_TO_TYPE_MAP diterapkan SEBELUM SQL_TO_TYPE_MAP
 * Jadi kalau field punya cast, gunakan mapping ini; kalau tidak, fallback ke SQL type
 */
exports.CAST_TO_TYPE_MAP = {
    'string': { zod: 'z.string()', ts: 'string', tsType: 'string' },
    'int': { zod: 'z.number()', ts: 'number', tsType: 'number' },
    'integer': { zod: 'z.number()', ts: 'number', tsType: 'number' },
    'float': { zod: 'z.number()', ts: 'number', tsType: 'number' },
    'double': { zod: 'z.number()', ts: 'number', tsType: 'number' },
    'bool': { zod: 'z.boolean()', ts: 'boolean', tsType: 'boolean' },
    'boolean': { zod: 'z.boolean()', ts: 'boolean', tsType: 'boolean' },
    'array': { zod: 'z.array(z.unknown())', ts: 'unknown[]', tsType: 'array' },
    'json': { zod: 'z.record(z.string(), z.unknown())', ts: 'Record<string, unknown>', tsType: 'object' },
    'object': { zod: 'z.record(z.string(), z.unknown())', ts: 'Record<string, unknown>', tsType: 'object' },
    'collection': { zod: 'z.array(z.unknown())', ts: 'unknown[]', tsType: 'array' },
    'date': { zod: 'z.string()', ts: 'string', tsType: 'string' },
    'datetime': { zod: 'z.string()', ts: 'string', tsType: 'string' },
    'timestamp': { zod: 'z.string()', ts: 'string', tsType: 'string' },
    'immutable_date': { zod: 'z.string()', ts: 'string', tsType: 'string' },
    'immutable_datetime': { zod: 'z.string()', ts: 'string', tsType: 'string' },
};
/**
 * Special naming conventions & patterns digunakan across generators
 */
exports.NAMING_CONVENTIONS = {
    // Zod schema suffix
    schemaNameSuffix: 'Schema',
    // Type validation function prefix
    validateFunctionPrefix: 'validate',
    // Mapper function prefix (response read transformation)
    readMapperPrefix: 'to',
    readMapperSuffix: 'Read',
    // Mapper function prefix (form input transformation)
    formMapperPrefix: 'toApi',
    // Type transformation suffix (untuk api-read.ts interface)
    transformedTypeSuffix: 'Transformed',
    // Form type name pattern (untuk api-form.ts)
    formTypePattern: 'Form',
    // Query key pattern
    queryKeyFunctionName: 'QueryKey',
};
/**
 * CRUD hook action names (derived dari HTTP methods)
 *
 * Digunakan di HookGenerator untuk determine hook type (useQuery vs useMutation)
 */
exports.HOOK_ACTION_MAP = {
    'Create': 'create',
    'Update': 'update',
    'Delete': 'delete',
    'Get': 'read',
};
/**
 * HTTP method safety classification
 *
 * GET/HEAD = read-only (idempotent, cacheable)
 * PUT/PATCH/DELETE = mutation (tidak idempotent dalam semantic, tapi idempotent dalam HTTP)
 * POST = mutation (tidak idempotent)
 */
exports.HTTP_METHOD_SAFETY = {
    'GET': { isRead: true, isMutation: false },
    'HEAD': { isRead: true, isMutation: false },
    'POST': { isRead: false, isMutation: true },
    'PUT': { isRead: false, isMutation: true },
    'PATCH': { isRead: false, isMutation: true },
    'DELETE': { isRead: false, isMutation: true },
};
/**
 * Validation untuk HTTP method
 */
function isValidHttpMethod(method) {
    return method.toLowerCase() in exports.CANONICAL_ACTION_MAP;
}
/**
 * Helper: get semantic action dari HTTP method
 */
function getActionFromMethod(method) {
    const normalized = method.toLowerCase();
    return exports.CANONICAL_ACTION_MAP[normalized] || 'Get';
}
/**
 * Helper: check apakah action adalah mutation
 */
function isMutationAction(action) {
    return action !== 'Get' && action !== 'Read';
}
/**
 * Helper: wrapNullable untuk TypeScript type
 *
 * Input: 'string' + true → Output: 'string | null'
 * Input: 'number' + false → Output: 'number'
 */
function wrapNullableTs(typeStr, nullable) {
    if (!nullable)
        return typeStr;
    return `(${typeStr}) | null`;
}
/**
 * Helper: wrapNullable untuk Zod schema
 *
 * Input: 'z.string()' + true → Output: 'z.string().nullable()'
 * Input: 'z.number()' + false → Output: 'z.number()'
 */
function wrapNullableZod(schemaStr, nullable) {
    if (!nullable)
        return schemaStr;
    if (!schemaStr.startsWith('z.'))
        return schemaStr;
    return `${schemaStr}.nullable()`;
}
