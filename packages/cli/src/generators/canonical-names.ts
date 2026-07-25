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

/**
 * Canonical HTTP method → semantic action mapping
 * 
 * Digunakan di:
 * - ZodTierGenerator: generateContract(), generateSchema(), generateMapper()
 * - HookGenerator: untuk derive hook action names
 * - SDKGenerator: untuk derive endpoint action names
 * - QueryKeyGenerator: untuk derive query key structure
 */
export const CANONICAL_ACTION_MAP = {
    'post': 'Create',
    'put': 'Update',
    'patch': 'Update',
    'delete': 'Delete',
    'get': 'Get',
} as const

export type ActionType = typeof CANONICAL_ACTION_MAP[keyof typeof CANONICAL_ACTION_MAP]

/**
 * Reverse lookup: action name → HTTP methods yang mungkin
 * 
 * Note: Update bisa dari PUT atau PATCH; Create hanya dari POST
 */
export const ACTION_TO_HTTP_METHODS: Record<ActionType, string[]> = {
    'Create': ['POST'],
    'Update': ['PUT', 'PATCH'],
    'Delete': ['DELETE'],
    'Get': ['GET'],
}

/**
 * SQL database type → TypeScript type + Zod schema mapping
 * 
 * Source: Laravel schema() method types + common database types
 * 
 * Used by:
 * - SemanticResolver.resolveField() untuk compute ResolvedField.zodType & .tsType
 * - Emitter memakai pre-computed values, bukan mapping ini langsung
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
} as const

/**
 * Laravel Eloquent cast type → TypeScript type + Zod schema mapping
 * 
 * Source: Laravel Eloquent $casts property
 * 
 * Precedence: CAST_TO_TYPE_MAP diterapkan SEBELUM SQL_TO_TYPE_MAP
 * Jadi kalau field punya cast, gunakan mapping ini; kalau tidak, fallback ke SQL type
 */
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
} as const

/**
 * Special naming conventions & patterns digunakan across generators
 */
export const NAMING_CONVENTIONS = {
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
} as const

/**
 * CRUD hook action names (derived dari HTTP methods)
 * 
 * Digunakan di HookGenerator untuk determine hook type (useQuery vs useMutation)
 */
export const HOOK_ACTION_MAP = {
    'Create': 'create',
    'Update': 'update',
    'Delete': 'delete',
    'Get': 'read',
} as const

/**
 * HTTP method safety classification
 * 
 * GET/HEAD = read-only (idempotent, cacheable)
 * PUT/PATCH/DELETE = mutation (tidak idempotent dalam semantic, tapi idempotent dalam HTTP)
 * POST = mutation (tidak idempotent)
 */
export const HTTP_METHOD_SAFETY = {
    'GET': { isRead: true, isMutation: false },
    'HEAD': { isRead: true, isMutation: false },
    'POST': { isRead: false, isMutation: true },
    'PUT': { isRead: false, isMutation: true },
    'PATCH': { isRead: false, isMutation: true },
    'DELETE': { isRead: false, isMutation: true },
} as const

/**
 * Validation untuk HTTP method
 */
export function isValidHttpMethod(method: string): method is keyof typeof CANONICAL_ACTION_MAP {
    return method.toLowerCase() in CANONICAL_ACTION_MAP
}

/**
 * Helper: get semantic action dari HTTP method
 */
export function getActionFromMethod(method: string): ActionType {
    const normalized = method.toLowerCase() as keyof typeof CANONICAL_ACTION_MAP
    return CANONICAL_ACTION_MAP[normalized] || 'Get'
}

/**
 * Helper: check apakah action adalah mutation
 */
export function isMutationAction(action: ActionType): boolean {
    return action !== 'Get' && action !== 'Read'
}

/**
 * Helper: wrapNullable untuk TypeScript type
 * 
 * Input: 'string' + true → Output: 'string | null'
 * Input: 'number' + false → Output: 'number'
 */
export function wrapNullableTs(typeStr: string, nullable: boolean): string {
    if (!nullable) return typeStr
    return `(${typeStr}) | null`
}

/**
 * Helper: wrapNullable untuk Zod schema
 * 
 * Input: 'z.string()' + true → Output: 'z.string().nullable()'
 * Input: 'z.number()' + false → Output: 'z.number()'
 */
export function wrapNullableZod(schemaStr: string, nullable: boolean): string {
    if (!nullable) return schemaStr
    if (!schemaStr.startsWith('z.')) return schemaStr
    return `${schemaStr}.nullable()`
}
