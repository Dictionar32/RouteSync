/**
 * semantic-resolver.ts
 *
 * CORE COMPILER PASS: Resolves ALL semantic decisions ONCE
 * 
 * Produk: CompilerIR (Intermediate Representation) yang immutable
 * 
 * Consolidates dari audit findings (Engine.FIx.md):
 * - Resource aliasing: 6 implementations → 1 (§3, §7)
 * - Type inference: 2 parallel systems → 1 (§6)
 * - Action naming: 6 duplicates → 1 (§3)
 * - Field mapping: 22 scattered calls → 1 (§3, §19)
 * - Manifest traversal: 2 duplicate loops → 1 (§3, §4)
 */

import { RouteManifest, camelCase } from '@routesync/core'
import { toTypeName } from './names'
import {
    CANONICAL_ACTION_MAP,
    ActionType,
    SQL_TO_TYPE_MAP,
    CAST_TO_TYPE_MAP,
    wrapNullableTs,
    wrapNullableZod,
} from './canonical-names'

/**
 * ============================================
 * TYPE DEFINITIONS
 * ============================================
 */

/**
 * CompilerIR: Intermediate Representation
 * 
 * Single immutable output dari semantic resolver.
 * Di-pass ke SEMUA generator sebagai parameter.
 * 
 * Ini adalah satu-satunya source of truth untuk semantic decisions.
 */
export interface CompilerIR {
    // Resolved response types indexed by response ID
    responseTypes: Map<string, ResolvedResponse>

    // Action name mapping (centralized)
    actionMappings: Record<string, ActionType>

    // Field type mappings (all fields, all types computed once)
    fieldMappings: Map<string, ResolvedField>

    // Resource aliases (route name → resource class name)
    resourceAliases: Map<string, string>

    // Response count per group (for dedup logic)
    responseCountByGroup: Map<string, number>

    // All resolved routes (useful for downstream passes)
    resolvedRoutes: ResolvedRoute[]

    // Metadata untuk debugging/logging
    metadata: {
        computedAt: Date
        manifestHash: string
        totalRoutes: number
        totalModels: number
        totalResources: number
        errors: string[]
        warnings: string[]
    }
}

export interface ResolvedResponse {
    // Unique ID untuk response ini
    id: string

    // Classification
    kind: 'primitive' | 'resource' | 'model' | 'custom'

    // The TypeScript class name
    name: string

    // Generated file names based on class name
    contractName: string // e.g., 'OrderResourceSchema'
    mapperName: string // e.g., 'toOrderResourceRead'
    formMapperName: string // e.g., 'toApiOrderResourceCreate'

    // Field definitions (already computed, ready to emit)
    fields: Map<string, ResolvedField>

    // Composition metadata
    isCollection: boolean
    isPaginated: boolean
    isWrapped: boolean
    isNullable: boolean
}

export interface ResolvedField {
    // The property name in camelCase (digunakan di frontend)
    name: string

    // The original snake_case name (from backend)
    sourceSnakeCase: string

    // The property type (untuk parsing literal type dari ts value)
    type: 'string' | 'number' | 'boolean' | 'null' | 'unknown' | 'object' | 'array'

    // Is this field optional/nullable
    nullable: boolean

    // The Zod representation untuk runtime validation
    zodType: string // e.g., 'z.string()', 'z.number().nullable()'

    // The TypeScript representation untuk type checking
    tsType: string // e.g., 'string', 'number | null'

    // Source: SQL type atau cast Laravel
    sourceType: 'sql' | 'cast' | 'json' | 'unknown'
    sourceValue: string // Original SQL type atau cast name
}

export interface ResolvedRoute {
    // Original route name/path
    name: string

    // Resolved action (Create, Update, Read, Delete, Get)
    action: ActionType

    // Resolved response reference
    responseId: string

    // Response composition
    isCollection: boolean
    isPaginated: boolean
    isWrapped: boolean
}

/**
 * ============================================
 * MAIN RESOLVER CLASS
 * ============================================
 */

export class SemanticResolver {
    /**
     * Core entry point: transforms manifest into resolved IR
     * 
     * Called ONCE per `routesync sync`, result passed to ALL generators.
     * 
     * GUARANTEE: Setelah function ini return, IR adalah immutable dan
     * menjadi single source of truth untuk semua generator.
     */
    static resolve(manifest: RouteManifest): CompilerIR {
        const startTime = performance.now()

        const ir: CompilerIR = {
            responseTypes: new Map(),
            actionMappings: { ...CANONICAL_ACTION_MAP },
            fieldMappings: new Map(),
            resourceAliases: new Map(),
            responseCountByGroup: new Map(),
            resolvedRoutes: [],
            metadata: {
                computedAt: new Date(),
                manifestHash: this.hashManifest(manifest),
                totalRoutes: manifest.routes?.length ?? 0,
                totalModels: manifest.models?.length ?? 0,
                totalResources: manifest.resources?.length ?? 0,
                errors: [],
                warnings: [],
            },
        }

        try {
            // Phase 1: Resolve all response types (consolidates 6 implementations)
            this.resolveResponseTypes(manifest, ir)

            // Phase 2: Resolve all field mappings (consolidates 22 scattered calls)
            this.resolveFieldMappings(manifest, ir)

            // Phase 3: Resolve routes (untuk downstream consumption)
            this.resolveRoutes(manifest, ir)

            // Phase 4: Count responses per group (consolidates 2 duplicate loops)
            this.countResponsesByGroup(manifest, ir)

            // Validation
            this.validateIR(ir)

            const elapsed = performance.now() - startTime
            console.log(`[SemanticResolver] Resolved manifest in ${elapsed.toFixed(2)}ms`)
        } catch (error) {
            ir.metadata.errors.push(`Failed to resolve manifest: ${error}`)
            throw error
        }

        return ir
    }

    /**
     * Phase 1: Resolve all response types
     * 
     * Consolidates logic dari:
     * - ZodTierGenerator.generateContract() line 376 (isResourceAlias logic)
     * - HookGenerator.resolveBaseResponseName() line 15
     * - SDKGenerator.getResponseInfo() line 38
     * 
     * AFTER: HANYA di sini. Deterministic, testable, cacheable.
     */
    private static resolveResponseTypes(
        manifest: RouteManifest,
        ir: CompilerIR
    ): void {
        const seen = new Set<string>()

        for (const route of manifest.routes ?? []) {
            const responseId = `${route.name}Response`

            if (seen.has(responseId)) {
                continue // Skip duplicates
            }
            seen.add(responseId)

            try {
                const resolved = this.resolveResponse(route, manifest, ir)
                ir.responseTypes.set(responseId, resolved)

                // Also store alias untuk quick lookup by route name
                ir.resourceAliases.set(route.name, resolved.name)
            } catch (error) {
                ir.metadata.errors.push(
                    `Failed to resolve response for route ${route.name}: ${error}`
                )
            }
        }
    }

    /**
     * Resolve a single response type
     * 
     * CRITICAL DECISION LOGIC: Resource aliasing
     * Ini adalah logic yang diulang 6 kali di audit findings.
     * Setelah refactor: HANYA di sini.
     */
    private static resolveResponse(
        route: any,
        manifest: RouteManifest,
        ir: CompilerIR
    ): ResolvedResponse {
        const meta = route.response ?? {}

        // Determine the response class name (critical: aliasing decision)
        const name = this.resolveResponseName(route, meta)
        const actionName = ir.actionMappings[route.method?.toLowerCase() ?? 'get'] ?? 'Get'

        return {
            id: `${route.name}Response`,
            kind: this.deriveResponseKind(meta),
            name,
            contractName: `${name}Schema`,
            mapperName: `to${name}Read`,
            formMapperName: `toApi${name}${actionName}`,
            fields: this.buildFieldMap(meta, manifest),
            isCollection: meta.collection ?? false,
            isPaginated: meta.paginated ?? false,
            isWrapped: meta.wrapped ?? false,
            isNullable: meta.nullable ?? false,
        }
    }

    /**
     * THE CRITICAL DECISION: Is this response an alias to existing resource,
     * or a fallback generated name?
     *
     * This logic appears 6 TIMES in the codebase (audit finding §3, §7).
     * AFTER: HANYA di sini.
     * 
     * Deterministic algorithm:
     * 1. Check if response explicitly references existing resource (no fields)
     * 2. Check if response references existing model (no fields)
     * 3. Otherwise: generate fallback name dari route name + action
     */
    private static resolveResponseName(route: any, meta: any): string {
        if (!meta || !Object.keys(meta).length) {
            // No response metadata: fallback to route-derived name
            return `${toTypeName(route.name ?? 'Response')}Response`
        }

        // Check 1: Pure resource alias (e.g., 'OrderResource' with no fields)
        // NOTE: meta.resource sudah berupa nama class Resource Laravel lengkap
        // (mis. 'OrderResource'), JANGAN tambah suffix 'Resource' lagi di sini
        // (bug lama: menghasilkan 'OrderResourceResource').
        if (meta.resource && !meta.fields) {
            return toTypeName(meta.resource)
        }

        // Check 2: Pure model alias (e.g., 'Category' model with no fields)
        if (meta.model && !meta.fields) {
            const modelName = toTypeName(meta.model)
            return modelName
        }

        // Check 3: Custom response dengan inline fields: generate fallback name
        // Pattern: {RouteNameTitleCase}{ActionName}Response
        const actionName = CANONICAL_ACTION_MAP[route.method?.toLowerCase() ?? 'get'] ?? 'Get'
        return `${toTypeName(route.name ?? 'Response')}${actionName}Response`
    }

    /**
     * Classify response type berdasarkan metadata
     */
    private static deriveResponseKind(meta: any): 'primitive' | 'resource' | 'model' | 'custom' {
        if (!meta) return 'primitive'
        if (meta.resource) return 'resource'
        if (meta.model) return 'model'
        return 'custom'
    }

    /**
     * Phase 2: Resolve field mappings untuk semua responses
     * 
     * Consolidates type inference logic yang terjadi di 2 tempat berbeda:
     * - mapSqlTypeToZod() + mapCastToZod() (untuk Zod)
     * - mapSqlTypeToTs() + mapCastToTs() (untuk TypeScript, DUPLICATE)
     * 
     * AFTER: SATU computation, kedua output pre-generated dalam ResolvedField
     */
    private static resolveFieldMappings(
        manifest: RouteManifest,
        ir: CompilerIR
    ): void {
        // Resolve model fields
        for (const model of manifest.models ?? []) {
            if (!model.fields) continue

            for (const [fieldName, fieldMeta] of Object.entries(model.fields)) {
                const mappingKey = `${model.name}.${fieldName}`

                if (!ir.fieldMappings.has(mappingKey)) {
                    try {
                        const resolved = this.resolveField(fieldName, fieldMeta as any, manifest)
                        ir.fieldMappings.set(mappingKey, resolved)
                    } catch (error) {
                        ir.metadata.warnings.push(
                            `Failed to resolve field ${mappingKey}: ${error}`
                        )
                    }
                }
            }
        }

        // Resolve resource fields
        for (const resource of manifest.resources ?? []) {
            if (!resource.fields) continue

            for (const [fieldName, fieldMeta] of Object.entries(resource.fields)) {
                const mappingKey = `${resource.name}.${fieldName}`

                if (!ir.fieldMappings.has(mappingKey)) {
                    try {
                        const resolved = this.resolveField(fieldName, fieldMeta as any, manifest)
                        ir.fieldMappings.set(mappingKey, resolved)
                    } catch (error) {
                        ir.metadata.warnings.push(
                            `Failed to resolve field ${mappingKey}: ${error}`
                        )
                    }
                }
            }
        }
    }

    /**
     * Resolve single field's type mappings
     * 
     * CRITICAL: Ini adalah satu-satunya tempat where SQL type / cast dikonversi
     * ke TypeScript type DAN Zod schema.
     * 
     * Output: ResolvedField dengan BOTH .zodType dan .tsType sudah computed.
     * Generators HANYA read dan emit, tidak compute ulang.
     */
    private static resolveField(
        fieldName: string,
        fieldMeta: any,
        _manifest: RouteManifest
    ): ResolvedField {
        const sourceSnakeCase = fieldName
        const camelCaseName = camelCase(fieldName)
        const nullable = fieldMeta.nullable ?? false

        let baseType = fieldMeta.type ?? 'unknown'
        let sourceType: 'sql' | 'cast' | 'json' | 'unknown' = 'sql'
        let sourceValue = baseType

        // Priority 1: Check untuk cast override (Laravel Eloquent cast)
        if (fieldMeta.cast) {
            const castType = fieldMeta.cast.toLowerCase()
            const castMap = (CAST_TO_TYPE_MAP as any)[castType]

            if (castMap) {
                sourceType = 'cast'
                sourceValue = fieldMeta.cast
                return {
                    name: camelCaseName,
                    sourceSnakeCase,
                    type: this.parseTypeFromString(castMap.ts),
                    nullable,
                    zodType: wrapNullableZod(castMap.zod, nullable),
                    tsType: wrapNullableTs(castMap.ts, nullable),
                    sourceType,
                    sourceValue,
                }
            }
        }

        // Priority 2: Map SQL type ke type system
        const sqlTypeLower = baseType.toLowerCase()
        const typeMapping = (SQL_TO_TYPE_MAP as any)[sqlTypeLower] ??
            (SQL_TO_TYPE_MAP as any)['unknown']

        if (typeMapping) {
            sourceType = 'sql'
            sourceValue = baseType

            return {
                name: camelCaseName,
                sourceSnakeCase,
                type: this.parseTypeFromString(typeMapping.ts),
                nullable,
                zodType: wrapNullableZod(typeMapping.zod, nullable),
                tsType: wrapNullableTs(typeMapping.ts, nullable),
                sourceType,
                sourceValue,
            }
        }

        // Fallback: unknown type
        return {
            name: camelCaseName,
            sourceSnakeCase,
            type: 'unknown',
            nullable,
            zodType: wrapNullableZod('z.unknown()', nullable),
            tsType: wrapNullableTs('unknown', nullable),
            sourceType: 'unknown',
            sourceValue,
        }
    }

    /**
     * Phase 3: Resolve routes untuk downstream consumption
     */
    private static resolveRoutes(
        manifest: RouteManifest,
        ir: CompilerIR
    ): void {
        for (const route of manifest.routes ?? []) {
            const action = ir.actionMappings[route.method?.toLowerCase() ?? 'get'] ?? 'Get'
            const responseId = `${route.name}Response`

            ir.resolvedRoutes.push({
                name: route.name,
                action,
                responseId,
                isCollection: route.response?.collection ?? false,
                isPaginated: route.response?.paginated ?? false,
                isWrapped: route.response?.wrapped ?? false,
            })
        }
    }

    /**
     * Phase 4: Count responses per group untuk dedup logic
     * 
     * Eliminates duplicate logic dari:
     * - generateContract() line 294-298: contractResponseCount loop
     * - generateMapper() line 1206-1213: mapperAllRespCount loop (IDENTICAL)
     * 
     * AFTER: SATU computation, di-store di IR
     */
    private static countResponsesByGroup(
        manifest: RouteManifest,
        ir: CompilerIR
    ): void {
        for (const route of manifest.routes ?? []) {
            const groupName = this.deriveGroupName(route)
            const count = ir.responseCountByGroup.get(groupName) ?? 0
            ir.responseCountByGroup.set(groupName, count + 1)
        }
    }

    /**
     * ============================================
     * HELPER METHODS
     * ============================================
     */

    private static deriveGroupName(route: any): string {
        // Implementation dari route-classifier.ts
        if (route.groupName) return route.groupName
        if (route.resource) return route.resource.toLowerCase()
        return 'default'
    }

    private static parseTypeFromString(
        typeStr: string
    ): 'string' | 'number' | 'boolean' | 'null' | 'unknown' | 'object' | 'array' {
        const lower = typeStr.toLowerCase()
        if (lower.includes('string')) return 'string'
        if (lower.includes('number')) return 'number'
        if (lower.includes('boolean')) return 'boolean'
        if (lower.includes('[]') || lower.includes('array')) return 'array'
        if (lower.includes('record') || lower.includes('object')) return 'object'
        if (lower === 'null') return 'null'
        return 'unknown'
    }

    private static buildFieldMap(meta: any, _manifest: RouteManifest): Map<string, ResolvedField> {
        const fields = new Map<string, ResolvedField>()

        if (!meta?.fields) return fields

        for (const [fieldName, fieldMeta] of Object.entries(meta.fields)) {
            try {
                const resolved = this.resolveField(fieldName, fieldMeta as any, _manifest)
                fields.set(fieldName, resolved)
            } catch (error) {
                console.warn(`Failed to resolve field ${fieldName}:`, error)
            }
        }

        return fields
    }

    private static hashManifest(manifest: RouteManifest): string {
        // Simple hash untuk cache validation
        return JSON.stringify({
            routes: manifest.routes?.length,
            models: manifest.models?.length,
            resources: manifest.resources?.length,
        })
    }

    private static validateIR(ir: CompilerIR): void {
        if (ir.responseTypes.size === 0) {
            ir.metadata.warnings.push('No response types resolved from manifest')
        }

        if (ir.resolvedRoutes.length === 0) {
            ir.metadata.warnings.push('No routes resolved from manifest')
        }

        // Validate no orphaned responseTypes
        const usedResponseIds = new Set(ir.resolvedRoutes.map(r => r.responseId))
        for (const responseId of ir.responseTypes.keys()) {
            if (!usedResponseIds.has(responseId)) {
                ir.metadata.warnings.push(`Orphaned response type: ${responseId}`)
            }
        }
    }
}
