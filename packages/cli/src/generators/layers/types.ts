/**
 * layers/types.ts
 * 
 * Shared type definitions untuk all emitter layers
 * 
 * RULE: Semua layer HARUS import types dari sini
 * tidak boleh define sendiri interface yang overlapping
 */

import { RouteManifest, SemanticResolutionKernel, camelCase } from '@routesync/core'
import type { CompilerIR } from '../semantic-resolver'

/**
 * Context yang di-pass ke tiap layer emitter
 * 
 * Contains:
 * - Original manifest (facts)
 * - Caches untuk avoid duplicate computations
 * - Semantic kernel untuk type resolution
 * - `ir`: hasil SemanticResolver.resolve() — SATU-SATUNYA sumber kebenaran
 *   untuk field resolution (Engine.Fix.md §39). Kalau tersedia, emitter
 *   HARUS baca dari `ir.fieldMappings` dulu sebelum melakukan resolusi
 *   sendiri. Opsional supaya emitter tetap bisa dites standalone tanpa
 *   perlu menjalankan SemanticResolver setiap kali (lihat test suite).
 */
export interface LayerContext {
    manifest: RouteManifest
    knownModels: Set<string>
    knownResources: Set<string>
    knownSchemas: Set<string>
    kernel?: SemanticResolutionKernel
    ir?: CompilerIR
}

/**
 * Route response composition — hasil dari semantic resolution
 * 
 * Ini adalah IR yang di-pass antar layers
 * PENTING: Computed ONCE oleh ContractLayer, di-reuse oleh ReadLayer & MapperLayer
 */
export interface RouteResponseComposition {
    // Zod type expression (e.g., 'OrderResourceSchema')
    zType: string

    // TypeScript type expression (e.g., 'OrderResourceResponse')
    tsType: string

    // Composition flags
    isCollection: boolean
    isPaginated: boolean
    isWrapped: boolean

    // Was this aliased to existing resource, atau generated fallback?
    isResourceAlias: boolean

    // Generated response name (untuk mappers, read types)
    name?: string
}

/**
 * Parsed model structure dari manifest
 * 
 * Dari Route: model.columns, model.casts, model.accessors
 * Can be dari @routesync/core atau generated locally
 */
export interface ParsedModel {
    name: string
    tableName?: string
    kind?: string
    fields?: Record<string, ParsedField | unknown>
    relations?: Record<string, unknown>
    accessors?: Record<string, unknown>
    layer?: string
    // @routesync/core also uses these
    columns?: Array<{ name: string; type: string; nullable?: boolean }>
    casts?: Record<string, string>
}

export interface ParsedField {
    name?: string
    type: string
    cast?: string
    nullable?: boolean
    default?: unknown
    kind?: string
}

/**
 * Parsed resource structure dari manifest
 * 
 * Dari Route: response.resource dengan fields
 */
export interface ParsedResource {
    name: string
    kind?: string
    fields?: Record<string, ParsedField | unknown>
}

/**
 * Augmented route dengan resolved metadata
 * 
 * Type harus flexible karena route object dari @routesync/core
 * bisa punya berbagai struktur (resolved, semantic, deprecated fields)
 */
export interface ParsedRoute {
    name?: string
    method?: string
    path?: string
    actionName?: string
    controllerName?: string
    groupName?: string
    response?: RuntimeAugmented<Record<string, unknown>>
    schema?: { rules?: Record<string, unknown> }
    // Assignments: peta nama variabel -> ekspresi PHP mentah, dipakai untuk
    // resolve field ber-kind 'raw_code' (mis. `$categories` -> `Category::orderBy(...)->get(...)`)
    assignments?: Record<string, string>
    // Augmented fields
    resolved?: SemanticNode
    semantic?: SemanticNode
}

export type RuntimeAugmented<T = unknown> = T & {
    resolved?: SemanticNode
    semantic?: SemanticNode
    kind?: string
    type?: string
    collection?: boolean
    paginated?: boolean
    wrapped?: boolean
    nullable?: boolean
    fields?: Record<string, unknown>
}

export interface SemanticNode {
    status?: string
    type?: string
    kind?: string
    model?: string
    resource?: string
    collection?: boolean
    paginated?: boolean
    wrapped?: boolean
    nullable?: boolean
    fields?: Record<string, unknown>
}

/**
 * Output dari each layer emitter
 */
export interface LayerOutput {
    lines: string[]
    metadata?: Record<string, unknown>
}

/**
 * Zod type inference result
 * 
 * Computed dari SQL type + cast, used by ContractLayer & ReadLayer
 */
export interface TypeMapping {
    zodType: string // e.g., 'z.string()', 'z.number().nullable()'
    tsType: string // e.g., 'string', 'number | null'
    baseType: string // e.g., 'string', 'number'
    isNullable: boolean
}

/**
 * Field-level metadata untuk nested field generation
 * 
 * Used by ContractLayer untuk emit z.object({ ... }) di-correct indentation
 */
export interface FieldMetadata {
    name: string
    snakeCaseName: string
    zodType: string
    tsType: string
    nullable: boolean
    isArray: boolean
    isObject: boolean
    nestedFields?: FieldMetadata[]
}

