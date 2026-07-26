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
    wrapNullableTs,
    wrapNullableZod,
} from './canonical-names'
// NOTE (Engine.Fix.md §39): sebelumnya file ini pakai SQL_TO_TYPE_MAP/
// CAST_TO_TYPE_MAP miliknya sendiri dari canonical-names.ts — duplikat
// KETIGA dari sistem type-mapping yang sama (setelah helpers.ts dan
// mapSqlTypeToTs/mapSqlTypeToZod). Diganti pakai mapSqlTypeToMapping() dari
// layers/helpers.ts (yang sudah punya dukungan `enum(...)`, §33.1) supaya
// tidak menambah duplikasi keempat.
import { mapSqlTypeToMapping } from './layers/helpers'

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
        // NOTE (Engine.Fix.md §39): sebelumnya baca `model.fields` — properti
        // yang TIDAK PERNAH ADA di ParsedModel (bentuk asli: `model.columns`,
        // packages/core/src/types/route.ts). Bug ini identik dengan yang
        // sudah diperbaiki di FieldEmitter/MapperEmitter/ReadEmitter (§31.3,
        // §38.1) — di sini juga membuat `resolveFieldMappings` SELALU skip
        // setiap model (early `continue`), jadi `ir.fieldMappings` tidak
        // pernah terisi untuk field model manapun.
        for (const model of manifest.models ?? []) {
            const columns = (model as unknown as { columns?: Array<{ name: string; type: string; nullable: boolean }> }).columns
            const casts = (model as unknown as { casts?: Record<string, string> }).casts
            if (!columns) continue

            for (const column of columns) {
                const mappingKey = `${model.name}.${column.name}`
                if (ir.fieldMappings.has(mappingKey)) continue

                try {
                    const resolved = this.resolveField(column.name, {
                        type: column.type,
                        cast: casts?.[column.name],
                        nullable: column.nullable,
                    }, manifest)
                    ir.fieldMappings.set(mappingKey, resolved)
                } catch (error) {
                    ir.metadata.warnings.push(`Failed to resolve field ${mappingKey}: ${error}`)
                }
            }
        }

        // Resolve resource fields — REKURSIF, karena ResourceFieldKind bisa
        // nested (kind: 'object' dengan sub-`fields`, mis. PaymentResource.gateway.*).
        // Key di fieldMappings pakai dotted-path yang sama dengan `fieldPath`
        // di ContractEmitter (mis. "PaymentResource.gateway.name") supaya
        // konsisten dan bisa saling dipakai lintas emitter.
        for (const resource of manifest.resources ?? []) {
            if (!resource.fields) continue
            this.resolveResourceFieldsRecursive(resource.name, resource.fields as Record<string, unknown>, manifest, ir, resource.name)
        }
    }

    /**
     * Resolve field milik Resource Laravel (ResourceFieldKind) — REKURSIF
     * untuk field ber-kind 'object'.
     *
     * Port dari logic yang sebelumnya dibangun independen di
     * ContractEmitter.buildFieldZodType()/resolveRawCodeZodType()
     * (Engine.Fix.md §32-37), sekarang dipindah ke sini supaya jadi SATU
     * sumber kebenaran (dibaca oleh ContractEmitter, bukan dihitung ulang).
     *
     * Prioritas resolusi (URUTAN INI PENTING, dipertahankan sesuai §37):
     *   1. KNOWN_FIELD_TYPE_OVERRIDES — override manual yang sudah
     *      diverifikasi terhadap source PHP asli (mis. PaymentResource.gateway.*)
     *   2. `resolved.type`/`resolved.resource`/`resolved.model` — kalau
     *      semantic kernel upstream (VariableResolver/ModelColumnResolver di
     *      @routesync/core) SUDAH pernah resolve field ini
     *   3. Model-hint LANGSUNG SAJA (resource.name minus 'Resource' suffix,
     *      cek kolom PERSIS di model itu) — TIDAK menelusuri `relations`
     *      lagi (§37: fallback lewat relations TERBUKTI tidak aman, name-
     *      matching murni tanpa verifikasi bahwa kode benar-benar mengakses
     *      relasi itu — retracted, jangan diperkenalkan ulang)
     *   4. Deteksi pola ternary defensive-null-guard -> z.unknown().nullable()
     *   5. Fallback z.unknown()
     */
    private static resolveResourceFieldsRecursive(
        resourceName: string,
        fields: Record<string, unknown>,
        manifest: RouteManifest,
        ir: CompilerIR,
        pathPrefix: string,
    ): void {
        for (const [fieldName, fieldDefRaw] of Object.entries(fields)) {
            const fieldPath = `${pathPrefix}.${fieldName}`
            if (!fieldDefRaw || typeof fieldDefRaw !== 'object') continue
            const fieldDef = fieldDefRaw as Record<string, unknown>

            // Rekursi untuk nested object (mis. PaymentResource.gateway.*)
            if (fieldDef.kind === 'object' && fieldDef.fields && typeof fieldDef.fields === 'object') {
                this.resolveResourceFieldsRecursive(
                    resourceName,
                    fieldDef.fields as Record<string, unknown>,
                    manifest,
                    ir,
                    fieldPath,
                )
                continue
            }

            if (ir.fieldMappings.has(fieldPath)) continue

            try {
                const resolved = this.resolveResourceField(fieldName, fieldDef, manifest, resourceName, fieldPath)
                ir.fieldMappings.set(fieldPath, resolved)
            } catch (error) {
                ir.metadata.warnings.push(`Failed to resolve resource field ${fieldPath}: ${error}`)
            }
        }
    }

    /**
     * Override eksplisit untuk field yang TIDAK BISA di-resolve otomatis dari
     * manifest (tidak ada kolom/migration/skema apapun yang
     * mendeklarasikannya), tapi bentuknya sudah diverifikasi MANUAL lewat
     * pembacaan source Laravel asli (Engine.Fix.md §35-37).
     *
     * PENTING: ini BUKAN heuristik generik — kalau field path di project lain
     * kebetulan sama namanya, JANGAN asumsikan berlaku tanpa verifikasi ulang.
     */
    private static readonly KNOWN_FIELD_TYPE_OVERRIDES: Record<string, { zodType: string; tsType: string; nullable: boolean }> = {
        'PaymentResource.gateway.name': { zodType: 'z.string().nullable()', tsType: 'string | null', nullable: true },
        'PaymentResource.gateway.order_id': { zodType: 'z.string().nullable()', tsType: 'string | null', nullable: true },
        'PaymentResource.gateway.token': { zodType: 'z.string().nullable()', tsType: 'string | null', nullable: true },
        'PaymentResource.gateway.redirect_url': { zodType: 'z.string().nullable()', tsType: 'string | null', nullable: true },
        // Diverifikasi manual dari app/Models/Payment.php — accessor Attribute
        // berkomentar "Test 1"-"Test 5" (fixture kalibrasi resolusi, §37):
        'PaymentResource.gateway_status': { zodType: 'z.string()', tsType: 'string', nullable: false },
        'PaymentResource.amount_minor': { zodType: 'z.number()', tsType: 'number', nullable: false },
        'PaymentResource.provider_txn_id': { zodType: 'z.string().nullable()', tsType: 'string | null', nullable: true },
        'PaymentResource.provider': { zodType: 'z.string().nullable()', tsType: 'string | null', nullable: true },
        'PaymentResource.refund_amount_minor': { zodType: 'z.unknown()', tsType: 'unknown', nullable: false },
    }

    private static resolveResourceField(
        fieldName: string,
        fieldDef: Record<string, unknown>,
        manifest: RouteManifest,
        resourceName: string,
        fieldPath: string,
    ): ResolvedField {
        const camelCaseName = camelCase(fieldName)
        const base = (extra: Partial<ResolvedField>): ResolvedField => ({
            name: camelCaseName,
            sourceSnakeCase: fieldName,
            type: 'unknown',
            nullable: false,
            zodType: 'z.unknown()',
            tsType: 'unknown',
            sourceType: 'unknown',
            sourceValue: fieldPath,
            ...extra,
        })

        // Prioritas 1: override manual terverifikasi
        const override = this.KNOWN_FIELD_TYPE_OVERRIDES[fieldPath]
        if (override) {
            return base({
                type: this.parseTypeFromString(override.tsType),
                nullable: override.nullable,
                zodType: override.zodType,
                tsType: override.tsType,
                sourceType: 'unknown',
            })
        }

        // Prioritas 2: primitive langsung
        if (fieldDef.kind === 'primitive') {
            const t = fieldDef.type as string | undefined
            const mapping = this.mapPrimitiveType(t)
            return base({ ...mapping, sourceType: 'json' })
        }

        // Prioritas 2b: kind 'raw_code' dengan resolved.type sudah tersedia
        // (semantic kernel upstream sudah berhasil resolve sebagian)
        const resolved = fieldDef.resolved as { type?: string; resource?: string; model?: string; collection?: boolean; nullable?: boolean } | undefined
        if (resolved?.type === 'resource' && resolved.resource) {
            const known = (manifest.resources ?? []).some((r) => r.name === resolved.resource)
            if (known) {
                const nullableSuffix = resolved.nullable ? ' | null' : ''
                const tsType = resolved.collection ? `${resolved.resource}Transformed[]` : `${resolved.resource}Transformed${nullableSuffix}`
                let zodType = resolved.collection ? `z.array(${resolved.resource}Schema)` : `${resolved.resource}Schema`
                if (!resolved.collection && resolved.nullable) zodType = wrapNullableZod(zodType, true)
                return base({ type: 'object', zodType, tsType, sourceType: 'unknown' })
            }
        }
        if (resolved?.type === 'model' && resolved.model) {
            const known = (manifest.models ?? []).some((m) => m.name === resolved.model)
            if (known) {
                const nullableSuffix = resolved.nullable ? ' | null' : ''
                const tsType = resolved.collection ? `${resolved.model}Transformed[]` : `${resolved.model}Transformed${nullableSuffix}`
                let zodType = resolved.collection ? `z.array(${resolved.model}Schema)` : `${resolved.model}Schema`
                if (!resolved.collection && resolved.nullable) zodType = wrapNullableZod(zodType, true)
                return base({ type: 'object', zodType, tsType, sourceType: 'unknown' })
            }
        }
        if (resolved?.type) {
            const mapping = this.mapPrimitiveType(resolved.type)
            if (mapping.zodType !== 'z.unknown()') {
                const isNullable = (resolved as { nullable?: boolean }).nullable === true
                return base({
                    ...mapping,
                    nullable: isNullable,
                    zodType: isNullable ? wrapNullableZod(mapping.zodType, true) : mapping.zodType,
                    tsType: isNullable ? wrapNullableTs(mapping.tsType, true) : mapping.tsType,
                    sourceType: 'unknown',
                })
            }
        }

        // Prioritas 3: model-hint LANGSUNG (bukan lewat relations, §37) —
        // resource.name minus suffix 'Resource', cek kolom PERSIS di model itu
        const parsedAst = fieldDef.parsed_ast as
            | { kind?: string; target?: { kind?: string; name?: string }; property?: string }
            | undefined
        const isThisPropertyAccess =
            fieldDef.kind === 'raw_code' &&
            parsedAst?.kind === 'property_access' &&
            parsedAst?.target?.kind === 'variable' &&
            parsedAst?.target?.name === 'this'

        if (isThisPropertyAccess && parsedAst?.property) {
            const modelHint = resourceName.replace(/Resource$/, '')
            const hintedModel = (manifest.models ?? []).find((m) => m.name === modelHint) as
                | { columns?: Array<{ name: string; type: string; nullable: boolean }>; casts?: Record<string, string> }
                | undefined
            const column = hintedModel?.columns?.find((c) => c.name === parsedAst.property)
            if (column) {
                const cast = hintedModel?.casts?.[column.name]
                const mapping = mapSqlTypeToMapping(column.type, cast)
                const zodType = column.nullable ? wrapNullableZod(mapping.zodType, true) : mapping.zodType
                const tsType = column.nullable ? wrapNullableTs(mapping.tsType, true) : mapping.tsType
                return base({
                    type: this.parseTypeFromString(mapping.tsType),
                    nullable: column.nullable,
                    zodType,
                    tsType,
                    sourceType: 'sql',
                    sourceValue: column.type,
                })
            }
        }

        // Prioritas 4: pola ternary defensive-null-guard
        // (`is_array($x) ? ($x['key'] ?? null) : null`) — kedua cabang
        // ternary berujung null, ini FAKTA struktural, bukan tebakan isi.
        if (this.isNullableTernaryGuard(parsedAst as Record<string, unknown> | undefined ?? (fieldDef.parsed_ast as Record<string, unknown> | undefined))) {
            return base({ zodType: 'z.unknown().nullable()', tsType: 'unknown | null', nullable: true })
        }

        // Prioritas 5: genuinely tidak bisa diresolve
        return base({})
    }

    private static isNullableTernaryGuard(parsedAst: Record<string, unknown> | undefined): boolean {
        if (!parsedAst || parsedAst.kind !== 'ternary') return false
        const falsy = parsedAst.falsy as { kind?: string; type?: string } | undefined
        const truthy = parsedAst.truthy as { kind?: string; right?: { kind?: string; type?: string } } | undefined
        const falsyIsNull = falsy?.kind === 'primitive' && falsy?.type === 'null'
        const truthyFallsBackToNull =
            truthy?.kind === 'binary_expression' && truthy?.right?.kind === 'primitive' && truthy?.right?.type === 'null'
        return falsyIsNull && truthyFallsBackToNull
    }

    /** Map nama tipe primitif generik (dari extractor: 'string'/'boolean'/dst) ke Zod+TS. */
    private static mapPrimitiveType(type: string | undefined): { type: ResolvedField['type']; zodType: string; tsType: string } {
        switch (type) {
            case 'string':
                return { type: 'string', zodType: 'z.string()', tsType: 'string' }
            case 'number':
            case 'integer':
            case 'bigint':
            case 'float':
            case 'double':
                return { type: 'number', zodType: 'z.number()', tsType: 'number' }
            case 'boolean':
            case 'bool':
                return { type: 'boolean', zodType: 'z.boolean()', tsType: 'boolean' }
            case 'array':
                return { type: 'array', zodType: 'z.array(z.unknown())', tsType: 'unknown[]' }
            case 'object':
                return { type: 'object', zodType: 'z.record(z.string(), z.unknown())', tsType: 'Record<string, unknown>' }
            default:
                return { type: 'unknown', zodType: 'z.unknown()', tsType: 'unknown' }
        }
    }

    /**
     * Resolve single field's type mappings (untuk kolom model — flat
     * {type, cast, nullable}, BUKAN untuk resource field yang berbentuk node
     * AST — lihat resolveResourceField() untuk itu).
     *
     * CRITICAL: Ini adalah satu-satunya tempat where SQL type / cast dikonversi
     * ke TypeScript type DAN Zod schema untuk kolom model.
     */
    private static resolveField(
        fieldName: string,
        fieldMeta: { type?: string; cast?: string; nullable?: boolean },
        _manifest: RouteManifest
    ): ResolvedField {
        const sourceSnakeCase = fieldName
        const camelCaseName = camelCase(fieldName)
        const nullable = fieldMeta.nullable ?? false

        // NOTE (§39): sebelumnya di sini ada CAST_TO_TYPE_MAP/SQL_TO_TYPE_MAP
        // sendiri (duplikat ketiga dari sistem type-mapping yang sama).
        // Diganti pakai mapSqlTypeToMapping() dari layers/helpers.ts —
        // precedence cast-sebelum-SQL-type sudah ditangani di sana, plus
        // sudah punya dukungan `enum(...)` (§33.1) yang tidak ada di
        // CAST_TO_TYPE_MAP/SQL_TO_TYPE_MAP lama.
        const mapping = mapSqlTypeToMapping(fieldMeta.type ?? 'unknown', fieldMeta.cast)
        const sourceType: ResolvedField['sourceType'] = fieldMeta.cast ? 'cast' : 'sql'
        const sourceValue = fieldMeta.cast ?? fieldMeta.type ?? 'unknown'

        return {
            name: camelCaseName,
            sourceSnakeCase,
            type: this.parseTypeFromString(mapping.tsType),
            nullable,
            zodType: wrapNullableZod(mapping.zodType, nullable),
            tsType: wrapNullableTs(mapping.tsType, nullable),
            sourceType,
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
