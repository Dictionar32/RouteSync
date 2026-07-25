"use strict";
/**
 * layers/helpers.ts
 *
 * Shared helper functions untuk all emitter layers
 *
 * RULE: Hanya pure functions, no side effects, no mutable state
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSemanticNode = getSemanticNode;
exports.normalizeMetadata = normalizeMetadata;
exports.getResourceName = getResourceName;
exports.toTitleCase = toTitleCase;
exports.toCamelCase = toCamelCase;
exports.getActionName = getActionName;
exports.routeResponseKey = routeResponseKey;
exports.routeToTypeName = routeToTypeName;
exports.mapSqlTypeToMapping = mapSqlTypeToMapping;
exports.mapSqlTypeToZod = mapSqlTypeToZod;
exports.mapSqlTypeToTs = mapSqlTypeToTs;
exports.wrapNullableTs = wrapNullableTs;
exports.wrapNullableZod = wrapNullableZod;
exports.isResourceAlias = isResourceAlias;
/**
 * Extract semantic node dari route response metadata
 *
 * Route response bisa punya 3 struktur:
 * 1. raw.resolved (yang diset oleh SemanticKernel)
 * 2. raw.semantic (legacy format)
 * 3. raw properties directly (type, kind, collection, etc)
 *
 * Priority: resolved > semantic > direct
 */
function getSemanticNode(v) {
    if (!v || typeof v !== 'object')
        return undefined;
    const obj = v;
    // Priority 1: resolved
    if (obj.resolved && typeof obj.resolved === 'object') {
        return obj.resolved;
    }
    // Priority 2: semantic
    if (obj.semantic && typeof obj.semantic === 'object') {
        return obj.semantic;
    }
    // Priority 3: direct properties
    if (obj.status || obj.type || obj.kind || obj.collection !== undefined) {
        return obj;
    }
    return undefined;
}
/**
 * Normalize response metadata dengan fallback dari resolved/semantic
 *
 * PENTING: Jangan mutate input object!
 * Return new object dengan merged properties.
 */
function normalizeMetadata(raw) {
    const resolved = raw.resolved || {};
    const semantic = raw.semantic || {};
    return {
        ...raw,
        // Override dengan resolved/semantic jika ada
        collection: raw.collection ?? resolved.collection ?? semantic.collection,
        paginated: raw.paginated ?? resolved.paginated ?? semantic.paginated,
        wrapped: raw.wrapped ?? resolved.wrapped ?? semantic.wrapped,
        nullable: raw.nullable ?? resolved.nullable ?? semantic.nullable,
        type: raw.type ?? resolved.type ?? semantic.type,
        kind: raw.kind ?? resolved.kind ?? semantic.kind,
        resource: raw.resource ?? resolved.resource ?? semantic.resource,
        model: raw.model ?? resolved.model ?? semantic.model,
    };
}
/**
 * Derive resource/group name dari route
 */
function getResourceName(route) {
    if (route.groupName)
        return route.groupName;
    // Derive dari path: /api/v1/products/{id} → products
    if (route.path) {
        const parts = route.path.split('/').filter(Boolean);
        // Remove version/api prefix
        const filtered = parts.filter(p => !p.startsWith('v') && p !== 'api');
        // Get last part before {id} or ?
        for (let i = filtered.length - 1; i >= 0; i--) {
            if (!filtered[i].includes('{') && !filtered[i].includes('?')) {
                return filtered[i];
            }
        }
    }
    // Fallback
    return 'api';
}
/**
 * Convert resource name → TitleCase
 *
 * 'products' → 'Products'
 * 'product_categories' → 'ProductCategories'
 * 'api' → 'Api'
 */
function toTitleCase(str) {
    return str
        .split(/[-_]/)
        .filter(Boolean)
        .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join('');
}
/**
 * Convert snake_case → camelCase
 *
 * 'user_id' → 'userId'
 * 'created_at' → 'createdAt'
 * 'id' → 'id'
 */
function toCamelCase(str) {
    return str
        .split('_')
        .map((part, idx) => idx === 0 ? part.toLowerCase() : part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join('');
}
/**
 * Get action name dari HTTP method & ACTION_MAP
 *
 * 'POST' → 'Create'
 * 'PUT' → 'Update'
 * 'PATCH' → 'Update'
 * 'DELETE' → 'Delete'
 * 'GET' → 'Get'
 */
function getActionName(route, actionMap) {
    const method = route.method?.toLowerCase() || 'get';
    return actionMap[method] || 'Get';
}
/**
 * Route key untuk uniqueness tracking
 *
 * Digunakan sebagai key di routeResponseMap
 */
function routeResponseKey(route) {
    if (route.name)
        return route.name;
    return `${route.method?.toUpperCase()}:${route.path}`;
}
/**
 * Type name dari route name
 *
 * 'products.list' → 'ProductsList'
 * 'user.show' → 'UserShow'
 */
function routeToTypeName(route) {
    if (!route.name)
        return 'Response';
    const parts = route.name.split('.');
    return parts.map(p => toTitleCase(p)).join('');
}
/**
 * SQL type → TypeScript & Zod type mapping
 *
 * CRITICAL: Ini HARUS sama di ContractLayer (Zod) dan ReadLayer (TS)!
 * Source of truth: CANONICAL_ACTION_MAP dari canonical-names.ts
 *
 * PENTING: Function ini PURE, tidak boleh berbeda output untuk input yang sama
 */
function mapSqlTypeToMapping(sqlType, cast) {
    const baseType = (sqlType || 'unknown').toLowerCase();
    // Priority 1: Cast override (Laravel Eloquent cast)
    if (cast) {
        const castLower = cast.toLowerCase();
        const mapping = getCastMapping(castLower);
        if (mapping)
            return mapping;
    }
    // Priority 2: SQL type
    const mapping = getSqlTypeMapping(baseType);
    if (mapping)
        return mapping;
    // Fallback
    return {
        zodType: 'z.unknown()',
        tsType: 'unknown',
        baseType: 'unknown',
        isNullable: false,
    };
}
/**
 * Get Zod type expression
 *
 * Output hanya string literal, tanpa modifiers (.nullable(), .optional(), etc)
 * Modifiers di-add di layer tergantung context
 */
function mapSqlTypeToZod(sqlType, cast) {
    const mapping = mapSqlTypeToMapping(sqlType, cast);
    return mapping.zodType;
}
/**
 * Get TypeScript type expression
 *
 * Output hanya string literal, tanpa modifiers (| null, undefined, etc)
 * Modifiers di-add di layer tergantung context
 */
function mapSqlTypeToTs(sqlType, cast) {
    const mapping = mapSqlTypeToMapping(sqlType, cast);
    return mapping.tsType;
}
/**
 * Internal: SQL type → mapping
 */
function getSqlTypeMapping(sqlType) {
    // String types
    if (sqlType.includes('varchar') || sqlType.includes('text') || sqlType === 'string' || sqlType === 'char') {
        return { zodType: 'z.string()', tsType: 'string', baseType: 'string', isNullable: false };
    }
    // Numeric types
    if (sqlType.includes('int') ||
        sqlType === 'bigint' ||
        sqlType === 'decimal' ||
        sqlType === 'float' ||
        sqlType === 'double') {
        return { zodType: 'z.number()', tsType: 'number', baseType: 'number', isNullable: false };
    }
    // Boolean types
    if (sqlType === 'boolean' || sqlType === 'bool' || sqlType === 'tinyint(1)') {
        return { zodType: 'z.boolean()', tsType: 'boolean', baseType: 'boolean', isNullable: false };
    }
    // JSON types
    if (sqlType === 'json' || sqlType === 'jsonb') {
        return {
            zodType: 'z.record(z.string(), z.unknown())',
            tsType: 'Record<string, unknown>',
            baseType: 'object',
            isNullable: false,
        };
    }
    // Date/Time types
    if (sqlType.includes('datetime') || sqlType === 'timestamp' || sqlType === 'date' || sqlType === 'time') {
        return { zodType: 'z.string()', tsType: 'string', baseType: 'string', isNullable: false };
    }
    return null;
}
/**
 * Internal: Cast type → mapping
 */
function getCastMapping(castType) {
    // String cast
    if (castType === 'string') {
        return { zodType: 'z.string()', tsType: 'string', baseType: 'string', isNullable: false };
    }
    // Numeric casts
    if (castType === 'int' || castType === 'integer' || castType === 'float' || castType === 'double') {
        return { zodType: 'z.number()', tsType: 'number', baseType: 'number', isNullable: false };
    }
    // Boolean cast
    if (castType === 'bool' || castType === 'boolean') {
        return { zodType: 'z.boolean()', tsType: 'boolean', baseType: 'boolean', isNullable: false };
    }
    // Array cast
    if (castType === 'array' || castType === 'collection') {
        return { zodType: 'z.array(z.unknown())', tsType: 'unknown[]', baseType: 'array', isNullable: false };
    }
    // JSON/Object cast
    if (castType === 'json' || castType === 'object') {
        return {
            zodType: 'z.record(z.string(), z.unknown())',
            tsType: 'Record<string, unknown>',
            baseType: 'object',
            isNullable: false,
        };
    }
    // Date casts
    if (castType.includes('date') || castType.includes('datetime')) {
        return { zodType: 'z.string()', tsType: 'string', baseType: 'string', isNullable: false };
    }
    return null;
}
/**
 * Wrap type dengan nullable modifier
 *
 * TS: 'string' + true → '(string) | null'
 * Zod: 'z.string()' + true → 'z.string().nullable()'
 */
function wrapNullableTs(typeStr, nullable) {
    if (!nullable || !typeStr)
        return typeStr;
    // Add parens untuk complex types
    if (typeStr.includes('|') || typeStr.includes('&')) {
        return `(${typeStr}) | null`;
    }
    return `${typeStr} | null`;
}
function wrapNullableZod(schemaStr, nullable) {
    if (!nullable || !schemaStr)
        return schemaStr;
    if (!schemaStr.startsWith('z.'))
        return schemaStr;
    return `${schemaStr}.nullable()`;
}
/**
 * Check if response adalah pure resource alias (existing resource, no custom fields)
 */
function isResourceAlias(response, knownResources) {
    if (!response)
        return false;
    const meta = normalizeMetadata(response);
    // Check if response.resource exists && no custom fields
    const resourceName = meta.resource;
    if (!resourceName)
        return false;
    // Check if it's actually a known resource
    const schemaName = `${toTitleCase(resourceName)}Schema`;
    if (!knownResources.has(schemaName))
        return false;
    // If response has no fields OR only references the resource, it's an alias
    const fields = meta.fields;
    const hasCustomFields = fields && Object.keys(fields).length > 0;
    return !hasCustomFields;
}
