# Phase 1: IR Infrastructure — Starter Code

**Purpose:** Provide production-ready boilerplate for Phase 1 implementation  
**Status:** Ready to implement  
**Estimated Time:** 2-3 days

---

## File 1: `packages/cli/src/generators/canonical-names.ts`

```typescript
/**
 * CANONICAL_NAMES.ts
 * 
 * Single source of truth for all naming conventions, action mappings, and type conversions.
 * 
 * All generators MUST import from this file, not define their own versions.
 * Violations are caught by grep checks in CI/pre-commit hooks.
 */

export const CANONICAL_ACTION_MAP = {
  'post': 'Create',
  'put': 'Update',
  'patch': 'Update',
  'delete': 'Delete',
  'get': 'Get',
} as const

/**
 * Reverse lookup: action name → HTTP method(s)
 * Note: Update maps to both PUT and PATCH; CREATE maps to POST only
 */
export const ACTION_TO_HTTP_METHOD: Record<string, string[]> = {
  'Create': ['POST'],
  'Update': ['PUT', 'PATCH'],
  'Delete': ['DELETE'],
  'Get': ['GET'],
}

/**
 * SQL type → TypeScript & Zod type mapping
 * Source: Laravel schema types + common database types
 */
export const SQL_TO_TYPE_MAP = {
  // String types
  'string': { zod: 'z.string()', ts: 'string' },
  'text': { zod: 'z.string()', ts: 'string' },
  'varchar': { zod: 'z.string()', ts: 'string' },
  'char': { zod: 'z.string()', ts: 'string' },
  'longtext': { zod: 'z.string()', ts: 'string' },

  // Numeric types
  'bigint': { zod: 'z.number()', ts: 'number' },
  'int': { zod: 'z.number()', ts: 'number' },
  'integer': { zod: 'z.number()', ts: 'number' },
  'smallint': { zod: 'z.number()', ts: 'number' },
  'tinyint': { zod: 'z.number()', ts: 'number' },
  'decimal': { zod: 'z.number()', ts: 'number' },
  'float': { zod: 'z.number()', ts: 'number' },
  'double': { zod: 'z.number()', ts: 'number' },

  // Boolean
  'boolean': { zod: 'z.boolean()', ts: 'boolean' },
  'bool': { zod: 'z.boolean()', ts: 'boolean' },

  // JSON
  'json': { zod: 'z.record(z.string(), z.unknown())', ts: 'Record<string, unknown>' },
  'jsonb': { zod: 'z.record(z.string(), z.unknown())', ts: 'Record<string, unknown>' },

  // Date/Time
  'datetime': { zod: 'z.string()', ts: 'string' },
  'timestamp': { zod: 'z.string()', ts: 'string' },
  'date': { zod: 'z.string()', ts: 'string' },
  'time': { zod: 'z.string()', ts: 'string' },

  // Fallback
  'unknown': { zod: 'z.unknown()', ts: 'unknown' },
} as const

/**
 * Laravel cast type → TypeScript & Zod type mapping
 * Source: Laravel Eloquent casts
 */
export const CAST_TO_TYPE_MAP = {
  'string': { zod: 'z.string()', ts: 'string' },
  'int': { zod: 'z.number()', ts: 'number' },
  'integer': { zod: 'z.number()', ts: 'number' },
  'float': { zod: 'z.number()', ts: 'number' },
  'double': { zod: 'z.number()', ts: 'number' },
  'boolean': { zod: 'z.boolean()', ts: 'boolean' },
  'bool': { zod: 'z.boolean()', ts: 'boolean' },
  'array': { zod: 'z.array(z.unknown())', ts: 'unknown[]' },
  'json': { zod: 'z.record(z.string(), z.unknown())', ts: 'Record<string, unknown>' },
  'object': { zod: 'z.record(z.string(), z.unknown())', ts: 'Record<string, unknown>' },
  'collection': { zod: 'z.array(z.unknown())', ts: 'unknown[]' },
  'date': { zod: 'z.string()', ts: 'string' },
  'datetime': { zod: 'z.string()', ts: 'string' },
  'timestamp': { zod: 'z.string()', ts: 'string' },
} as const

/**
 * Special naming conventions used across generators
 */
export const NAMING_CONVENTIONS = {
  // Zod schema suffix
  schemaNameSuffix: 'Schema',
  
  // Type validation function prefix
  validateFunctionPrefix: 'validate',
  
  // Mapper function prefix (response read)
  readMapperPrefix: 'to',
  readMapperSuffix: 'Read',
  
  // Mapper function prefix (form create/update)
  formMapperPrefix: 'toApi',
  
  // Type transformation suffix
  transformedTypeSuffix: 'Transformed',
  
  // Form type name pattern
  formTypePattern: 'Form',
} as const
```

---

## File 2: `packages/cli/src/generators/semantic-resolver.ts` (Starter)



```typescript
/**
 * semantic-resolver.ts
 *
 * Single compiler pass that resolves ALL semantic decisions once,
 * producing an immutable IR (Intermediate Representation) that is
 * passed to all downstream generators.
 *
 * This consolidates:
 * - Resource aliasing (6 implementations → 1)
 * - Type inference (2 parallel systems → 1)
 * - Action naming (6 duplicates → 1)
 * - Field mapping (22 scattered calls → 1)
 */

import { RouteManifest, toTypeName } from '@routesync/core'
import { CANONICAL_ACTION_MAP, SQL_TO_TYPE_MAP, CAST_TO_TYPE_MAP } from './canonical-names'

/**
 * CompilerIR: The intermediate representation of all resolved decisions
 * This is passed to all generators, eliminating need for re-inference
 */
export interface CompilerIR {
  // Resolved response types indexed by response ID
  responseTypes: Map<string, ResolvedResponse>
  
  // Action name mapping (centralized)
  actionMappings: Record<string, string>
  
  // Field type mappings (all fields, all types computed once)
  fieldMappings: Map<string, ResolvedField>
  
  // Resource aliases (route name → resource class name)
  resourceAliases: Map<string, string>
  
  // Response count per group (for dedup logic)
  responseCountByGroup: Map<string, number>
  
  // Metadata for debugging/logging
  metadata: {
    computedAt: Date
    manifestHash: string
    totalRoutes: number
    totalModels: number
    totalResources: number
  }
}

export interface ResolvedResponse {
  // Unique ID for this response type
  id: string
  
  // Classification
  kind: 'primitive' | 'resource' | 'model' | 'custom'
  
  // The TypeScript class name
  name: string
  
  // Generated file names based on class name
  contractName: string // e.g., 'OrderResourceSchema'
  mapperName: string // e.g., 'toOrderResourceRead'
  formMapperName: string // e.g., 'toApiOrderResourceCreate'
  
  // Field definitions
  fields: Map<string, ResolvedField>
  
  // Composition metadata
  isCollection: boolean
  isPaginated: boolean
  isWrapped: boolean
  isNullable: boolean
}

export interface ResolvedField {
  // The property name in camelCase
  name: string
  
  // The original snake_case name
  sourceSnakeCase: string
  
  // The property type
  type: 'string' | 'number' | 'boolean' | 'null' | 'unknown' | 'object' | 'array'
  
  // Is this field optional/nullable
  nullable: boolean
  
  // The Zod representation for validation
  zodType: string // e.g., 'z.string()', 'z.number().nullable()'
  
  // The TypeScript representation for typing
  tsType: string // e.g., 'string', 'number | null'
}

/**
 * Main resolver class: computes IR once per manifest
 */
export class SemanticResolver {
  /**
   * Core entry point: transforms manifest into resolved IR
   * This is called ONCE per `routesync sync`, result passed to all generators
   */
  static resolve(manifest: RouteManifest): CompilerIR {
    const ir: CompilerIR = {
      responseTypes: new Map(),
      actionMappings: { ...CANONICAL_ACTION_MAP },
      fieldMappings: new Map(),
      resourceAliases: new Map(),
      responseCountByGroup: new Map(),
      metadata: {
        computedAt: new Date(),
        manifestHash: this.hashManifest(manifest),
        totalRoutes: manifest.routes.length,
        totalModels: manifest.models?.length ?? 0,
        totalResources: manifest.resources?.length ?? 0,
      },
    }

    // Phase 1: Resolve all response types (no duplicates)
    this.resolveResponseTypes(manifest, ir)

    // Phase 2: Resolve all field mappings
    this.resolveFieldMappings(manifest, ir)

    // Phase 3: Count responses per group (for dedup)
    this.countResponsesByGroup(manifest, ir)

    return ir
  }

  /**
   * Phase 1: Resolve all response types
   * This consolidates logic from:
   * - ZodTierGenerator.generateContract() line 376
   * - HookGenerator.resolveBaseResponseName() line 15
   * - SDKGenerator.getResponseInfo() line 38
   */
  private static resolveResponseTypes(
    manifest: RouteManifest,
    ir: CompilerIR
  ): void {
    const seen = new Set<string>()

    for (const route of manifest.routes) {
      const responseId = `${route.name}Response`

      if (seen.has(responseId)) {
        continue // Skip duplicates
      }
      seen.add(responseId)

      const resolved = this.resolveResponse(route, manifest, ir)
      ir.responseTypes.set(responseId, resolved)
      
      // Also store alias for quick lookup
      ir.resourceAliases.set(route.name, resolved.name)
    }
  }

  /**
   * Resolve a single response type
   * All resource-aliasing logic from ZodTierGenerator extracted here
   */
  private static resolveResponse(
    route: any,
    manifest: RouteManifest,
    ir: CompilerIR
  ): ResolvedResponse {
    const meta = route.response

    // Determine the response class name
    const name = this.resolveResponseName(route, meta)
    const actionName = ir.actionMappings[route.method.toLowerCase()] || 'Get'

    return {
      id: `${route.name}Response`,
      kind: this.deriveResponseKind(meta),
      name,
      contractName: `${name}Schema`,
      mapperName: `to${name}Read`,
      formMapperName: `toApi${name}${actionName}`,
      fields: this.buildFieldMap(meta, manifest),
      isCollection: meta?.collection ?? false,
      isPaginated: meta?.paginated ?? false,
      isWrapped: meta?.wrapped ?? false,
      isNullable: meta?.nullable ?? false,
    }
  }

  /**
   * The critical decision: is this response an alias to existing resource,
   * or a fallback generated name?
   *
   * This logic appears 6 times in the codebase. After refactor: ONLY HERE.
   */
  private static resolveResponseName(route: any, meta: any): string {
    if (!meta) {
      // No response metadata: fallback to route-derived name
      return `${toTypeName(route.name)}Response`
    }

    // Check if response explicitly references an existing resource
    if (meta.resource && !meta.fields) {
      // Pure alias: e.g., 'OrderResource'
      return toTypeName(meta.resource)
    }

    // Check if response references an existing model
    if (meta.model && !meta.fields) {
      // Model alias: e.g., 'CategoryModel'
      return toTypeName(meta.model)
    }

    // Custom response with inline fields: generate fallback name
    const actionName = CANONICAL_ACTION_MAP[route.method.toLowerCase()] || 'Get'
    return `${toTypeName(route.name)}${actionName}`
  }

  /**
   * Derive what kind of response this is
   */
  private static deriveResponseKind(meta: any): 'primitive' | 'resource' | 'model' | 'custom' {
    if (!meta) return 'primitive'
    if (meta.resource) return 'resource'
    if (meta.model) return 'model'
    return 'custom'
  }

  /**
   * Phase 2: Build field mappings for all responses
   * Consolidates type inference that happens in 2 places:
   * - mapSqlTypeToZod() + mapCastToZod()
   * - mapSqlTypeToTs() + mapCastToTs() (DUPLICATE)
   * After refactor: SINGLE computation, both outputs pre-generated
   */
  private static resolveFieldMappings(
    manifest: RouteManifest,
    ir: CompilerIR
  ): void {
    // For each model, resolve its field types
    for (const model of manifest.models ?? []) {
      for (const [fieldName, field] of Object.entries(model.fields ?? {})) {
        const mappingKey = `${model.name}.${fieldName}`

        if (!ir.fieldMappings.has(mappingKey)) {
          const resolved = this.resolveField(fieldName, field, manifest)
          ir.fieldMappings.set(mappingKey, resolved)
        }
      }
    }
  }

  /**
   * Resolve a single field's type mappings
   */
  private static resolveField(
    fieldName: string,
    fieldMeta: any,
    manifest: RouteManifest
  ): ResolvedField {
    const sourceSnakeCase = fieldName
    const camelCaseName = this.toCamelCase(fieldName)
    const nullable = fieldMeta.nullable ?? false

    // Determine the base type
    let baseType = fieldMeta.type
    let isArray = false
    let isObject = false

    // Check for cast override
    if (fieldMeta.cast) {
      const castMap = CAST_TO_TYPE_MAP[fieldMeta.cast] ?? null
      if (castMap) {
        return {
          name: camelCaseName,
          sourceSnakeCase,
          type: this.parseType(castMap.ts),
          nullable,
          zodType: this.wrapNullable(castMap.zod, nullable),
          tsType: this.wrapNullable(castMap.ts, nullable),
        }
      }
    }

    // Map SQL type
    const typeMapping = SQL_TO_TYPE_MAP[baseType] ?? SQL_TO_TYPE_MAP['unknown']

    return {
      name: camelCaseName,
      sourceSnakeCase,
      type: this.parseType(typeMapping.ts),
      nullable,
      zodType: this.wrapNullable(typeMapping.zod, nullable),
      tsType: this.wrapNullable(typeMapping.ts, nullable),
    }
  }

  /**
   * Phase 3: Count responses per group for deduplication
   * Eliminates duplicate logic from generateContract() and generateMapper()
   */
  private static countResponsesByGroup(
    manifest: RouteManifest,
    ir: CompilerIR
  ): void {
    for (const route of manifest.routes) {
      const groupName = this.deriveGroupName(route)
      const count = ir.responseCountByGroup.get(groupName) ?? 0
      ir.responseCountByGroup.set(groupName, count + 1)
    }
  }

  // ============= Helper Methods =============

  private static toCamelCase(str: string): string {
    return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
  }

  private static deriveGroupName(route: any): string {
    // Implementation from route-classifier.ts
    return route.groupName || route.resource?.toLowerCase() || 'default'
  }

  private static wrapNullable(typeStr: string, nullable: boolean): string {
    if (!nullable) return typeStr
    // For Zod: z.type().nullable()
    if (typeStr.startsWith('z.')) {
      return `${typeStr}.nullable()`
    }
    // For TypeScript: type | null
    return `${typeStr} | null`
  }

  private static parseType(
    typeStr: string
  ): 'string' | 'number' | 'boolean' | 'null' | 'unknown' | 'object' | 'array' {
    if (typeStr.includes('string')) return 'string'
    if (typeStr.includes('number')) return 'number'
    if (typeStr.includes('boolean')) return 'boolean'
    if (typeStr.includes('[]') || typeStr.includes('array')) return 'array'
    if (typeStr.includes('Record') || typeStr.includes('object')) return 'object'
    if (typeStr === 'null') return 'null'
    return 'unknown'
  }

  private static buildFieldMap(meta: any, manifest: RouteManifest): Map<string, ResolvedField> {
    const fields = new Map<string, ResolvedField>()

    if (!meta?.fields) return fields

    for (const [fieldName, fieldMeta] of Object.entries(meta.fields)) {
      const resolved = this.resolveField(fieldName, fieldMeta, manifest)
      fields.set(fieldName, resolved)
    }

    return fields
  }

  private static hashManifest(manifest: RouteManifest): string {
    // Simple hash for cache validation
    return JSON.stringify({
      routes: manifest.routes?.length,
      models: manifest.models?.length,
      resources: manifest.resources?.length,
    })
  }
}
```

---

## File 3: Changes to `sync.ts`

**Current:**
```typescript
// Line 47-50
const normalizedManifest = normalizeManifest(manifest, kernel)
await ZodTierGenerator.generate(dir, manifest)
```

**Change To:**
```typescript
// Line 47-50
const normalizedManifest = normalizeManifest(manifest, kernel)
const compilerIR = SemanticResolver.resolve(normalizedManifest)

await ZodTierGenerator.generate(dir, compilerIR, manifest)
await HookGenerator.generate(dir, compilerIR, manifest)
await SDKGenerator.generate(dir, compilerIR, manifest)
// ... pass compilerIR to all generators
```

---

## Next Steps After Phase 1

Once Phase 1 is complete:
1. Create unit tests for `SemanticResolver` (see IMPLEMENTATION_ROADMAP_DETAILED.md §6.1)
2. Verify no duplicate ACTION_MAP definitions remain (use grep commands in AUDIT_FINDINGS_TO_IMPLEMENTATION_MAP.md)
3. Verify normalizeManifest result is actually used (trace parameter flow)
4. Proceed to Phase 2: Refactor ZodTierGenerator to accept IR

