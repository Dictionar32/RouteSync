/**
 * Contract IR Architecture
 * 
 * Domain-centric IR design where the contract units (Resource, Request, Endpoint)
 * are the central organizing principle. Each emitter projects from these domains
 * to their specific output files.
 * 
 * ENRICHED TYPE IR SYSTEM:
 * - Emitters no longer understand semantic compiler details
 * - All type information is pre-resolved into TypeIR
 * - Emitters are pure renderers: TypeIR → Output
 */

import { SemanticType, SemanticNode } from './semantic'

/* =========================================================
 *  TYPE IR SYSTEM - RICH TYPE REPRESENTATION
 * ========================================================= */

/**
 * ENRICHED TYPE IR SYSTEM - ENHANCED VERSION
 * 
 * Adds more sophisticated type handling and migration utilities
 * for seamless transition from SemanticType to TypeIR
 */

/**
 * ResolvedSemanticType — bentuk OBJEK dari hasil resolusi semantic,
 * terpisah dari `SemanticType` (string union sederhana di types/semantic.ts).
 *
 * `SemanticType` cuma cocok buat nilai kayak `"string"`, `"number"`,
 * `"model"`, dst. Tapi kode di ContractIRBuilder (semanticToTypeIR,
 * buildResourceField) butuh bentuk yang lebih kaya -- objek dengan
 * `.kind`/`.resource`/`.model`/`.properties`/dst, persis bentuk yang
 * dicek oleh isPrimitiveType/isResourceType/isModelType/isObjectType/
 * isArrayType/isUnionType/isLiteralType di utils/type-guards.ts.
 *
 * Field manapun yang perlu nampung HASIL RESOLUSI (bukan cuma tag
 * mentah) harus pakai `SemanticType | ResolvedSemanticType`, bukan
 * `SemanticType` doang.
 */
export interface ResolvedSemanticType {
    kind: 'primitive' | 'resource' | 'model' | 'object' | 'array' | 'union' | 'literal'
    // primitive
    type?: SemanticType
    format?: string
    // resource
    resource?: string
    collection?: boolean
    // model
    model?: string
    // object
    properties?: Record<string, ResolvedSemanticType>
    // array
    items?: ResolvedSemanticType
    // union
    types?: ResolvedSemanticType[]
    // literal
    value?: string | number | boolean
    // dibawa dari field.resolved manifest (lihat ContractIRBuilder.buildResourceField)
    resolved?: {
        type?: SemanticType
        model?: string
    }
}

/**
 * Enhanced TypeIR dengan utility methods untuk type safety
 */
export interface EnhancedTypeIR {
    // Base TypeIR properties
    kind: TypeIR['kind']

    // Metadata untuk debugging dan migration tracking
    _migration?: {
        fromSemanticType?: string
        migrationDate?: string
        confidence: 'high' | 'medium' | 'low'
    }

    // Helper flags untuk emitters
    _computed?: {
        isNullable?: boolean
        isOptional?: boolean
        isArray?: boolean
        isReference?: boolean
    }

    // Allow additional properties from specific TypeIR variants
    [key: string]: unknown
}
export type TypeIR =
    | PrimitiveTypeIR
    | ReferenceTypeIR
    | ArrayTypeIR
    | InlineObjectTypeIR
    | NullableTypeIR
    | OptionalTypeIR
    | UnionTypeIR
    | LiteralTypeIR

/**
 * Primitive types - no nested resolution needed
 */
export interface PrimitiveTypeIR {
    kind: 'primitive'
    type: 'string' | 'number' | 'boolean' | 'date' | 'json' | 'unknown'
    format?: string              // ISO date, currency, etc.
}

/**
 * Reference to another generated schema/type
 * 
 * Example: OrderDetailResourceSchema, UserResourceSchema
 * Emitter renders: OrderDetailResourceSchema (direct reference)
 */
export interface ReferenceTypeIR {
    kind: 'reference'
    target: string               // OrderDetailResourceSchema
    module?: string              // For cross-module references
}

/**
 * Array of items - recursive type emission
 * 
 * Example: items: OrderDetailResourceSchema[]
 * Emitter renders: z.array(OrderDetailResourceSchema)
 */
export interface ArrayTypeIR {
    kind: 'array'
    items: TypeIR               // Recursive - can be any type
    minItems?: number
    maxItems?: number
}

/**
 * Inline object with known properties
 * 
 * Example: gateway: { name: string, token: string, redirect_url: string }
 * Emitter renders: z.object({ name: z.string(), token: z.string(), redirect_url: z.string() })
 * 
 * REPLACES: case 'object': return 'z.record(z.unknown())'
 */
export interface InlineObjectTypeIR {
    kind: 'inline_object'
    properties: Record<string, TypeIR>    // Recursive properties
    additionalProperties?: boolean        // Allow extra keys
}

/**
 * Nullable wrapper - compositional nullability
 * 
 * Example: paid_at: string | null
 * Emitter renders: z.string().nullable()
 * 
 * REPLACES: if (field.nullable) logic in emitters
 */
export interface NullableTypeIR {
    kind: 'nullable'
    inner: TypeIR               // Wrapped type
}

/**
 * Optional wrapper - compositional optionality  
 * 
 * Example: description?: string
 * Emitter renders: z.string().optional()
 * 
 * REPLACES: if (field.optional) logic in emitters
 */
export interface OptionalTypeIR {
    kind: 'optional'
    inner: TypeIR               // Wrapped type
}

/**
 * Union of multiple types
 * 
 * Example: status: 'active' | 'inactive' | 'pending'
 * Emitter renders: z.union([z.literal('active'), z.literal('inactive'), z.literal('pending')])
 */
export interface UnionTypeIR {
    kind: 'union'
    types: TypeIR[]             // Union members
}

/**
 * Literal value types
 * 
 * Example: method: 'POST'
 * Emitter renders: z.literal('POST')
 */
export interface LiteralTypeIR {
    kind: 'literal'
    value: string | number | boolean
}

/* =========================================================
 *  EMITTER TARGET TYPES - PROJECTION VARIANTS
 * ========================================================= */

/**
 * Different emitters need different projections of the same logical type.
 * Instead of emitters deciding, IR Builder pre-computes all variants.
 */
export interface TypeProjections {
    contract: TypeIR            // For ContractEmitter (Zod schemas)
    read: TypeIR               // For ReadEmitter (TypeScript interfaces)  
    form: TypeIR               // For FormEmitter (form types)
    field: TypeIR              // For FieldEmitter (field mappings)
    mapper: TypeIR             // For MapperEmitter (runtime functions)
    schema: TypeIR             // For SchemaEmitter (react-hook-form)
}

/* =========================================================
 *  ENHANCED FIELD IR WITH TYPE PROJECTIONS
 * ========================================================= */

/* =========================================================
 *  CONTRACT IR - ROOT STRUCTURE
 * ========================================================= */

export interface ContractIR {
    resources: ResourceIR[]
    requests: RequestIR[]
    endpoints: EndpointIR[]
    sharedTypes: SharedTypeIR[]
    enums: EnumIR[]
    imports: ImportIR[]
    metadata: ContractMetadata
}

/* =========================================================
 *  RESOURCE IR - CENTRAL DOMAIN UNIT
 * ========================================================= */

export interface ResourceIR {
    id: string
    name: string                    // OrderResource
    sourceModel?: string           // Order (Laravel model)
    fields: ResourceFieldIR[]
    aliases: ResourceAliasIR[]
    variants: ResourceVariantIR[]
    mapper: MapperIR
    metadata: ResourceMetadata
}

export interface ResourceFieldIR {
    name: string                   // subtotal_minor (original PHP name)
    transformedName: string        // subtotalMinor (camelCase computed)

    // ENRICHED TYPE SYSTEM - No more SemanticType!
    // Each emitter gets pre-resolved TypeIR projection
    type: TypeProjections          // All emitter projections pre-computed

    // Legacy field (for compatibility during migration)
    // Sebelumnya cuma SemanticType (string union) -- tapi ContractIRBuilder
    // butuh nampung hasil resolusi berbentuk objek juga (lihat ResolvedSemanticType).
    semanticType?: SemanticType | ResolvedSemanticType    // TODO: Remove after full TypeIR migration

    description?: string
    validation?: ValidationRules
    source?: FieldSource          // Where this field comes from
}

export interface FieldSource {
    type: 'model_column' | 'accessor' | 'method' | 'computed' | 'relation'
    path: string                  // e.g., 'created_at' or 'user.name'
    model?: string               // Source model name
}

export interface ResourceAliasIR {
    name: string                   // OrderResourceShow
    kind: "show" | "index" | "collection" | "paginated"
    target: string                 // OrderResourceTransformed
    isArray?: boolean             // for index/collection
}

export interface ResourceVariantIR {
    kind: "read" | "schema" | "contract" | "form"
    fields: ResourceFieldIR[]     // Variant-specific field transformations
    metadata: VariantMetadata
}

export interface VariantMetadata {
    purpose: string               // "TypeScript interfaces", "Zod validation schemas"
    generator: string             // Which emitter uses this variant
    nullable_handling?: 'strict' | 'loose'
    optional_handling?: 'strict' | 'loose'
}

export interface ResourceMetadata {
    sourceFile: string
    controller?: string
    routes?: string[]             // Routes that use this resource
    generated_at: string
    dependencies: string[]        // Other resources this depends on
}

/* =========================================================
 *  REQUEST IR - FORM & INPUT DOMAIN
 * ========================================================= */

export interface RequestIR {
    id: string
    name: string                   // CartItemsRequest
    actions: RequestActionIR[]
    validation: ValidationSchemas
    metadata: RequestMetadata
}

export interface RequestActionIR {
    name: "Create" | "Update" | "Delete" | "Custom"
    customName?: string           // For custom actions
    fields: ResourceFieldIR[]
    rules: ValidationRules[]
    dependencies?: string[]        // Other actions this depends on
}

export interface ValidationSchemas {
    zod?: ZodValidationIR
    laravel?: LaravelValidationIR
    custom?: CustomValidationIR[]
}

export interface ValidationRules {
    type: 'required' | 'optional' | 'nullable' | 'array' | 'object' | 'custom'
    rule?: string                 // Custom validation rule
    message?: string
}

export interface RequestMetadata {
    sourceFile: string
    controller?: string
    routes: string[]              // Routes that use this request
    generated_at: string
}

/* =========================================================
 *  ENDPOINT IR - API CONTRACT DOMAIN  
 * ========================================================= */

export interface EndpointIR {
    id: string
    method: HttpMethod
    path: string
    pathParams: ParameterIR[]
    queryParams: ParameterIR[]
    request?: RequestReference
    response: ResponseReference
    middleware: MiddlewareIR[]
    metadata: EndpointMetadata
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS'

export interface ParameterIR {
    name: string
    type: SemanticType
    required: boolean
    description?: string
    validation?: ValidationRules
}

export interface RequestReference {
    type: 'request_ir' | 'inline' | 'none'
    reference?: string            // RequestIR reference
    inlineFields?: ResourceFieldIR[]
}

export interface ResponseReference {
    type: "resource" | "collection" | "paginated" | "custom" | "empty"
    resource?: string             // ResourceIR reference
    statusCode: number
    headers?: HeaderIR[]
    pagination?: PaginationIR
}

export interface HeaderIR {
    name: string
    value?: string
    required: boolean
}

export interface PaginationIR {
    type: 'cursor' | 'offset' | 'simple'
    metaFields: string[]          // ['total', 'per_page', 'current_page']
}

export interface MiddlewareIR {
    name: string
    parameters?: string[]
    order: number
}

export interface EndpointMetadata {
    controller: string
    action: string
    routeName?: string
    generated_at: string
    authenticated?: boolean
    auth?: boolean  // Add this field for backward compatibility
    cached?: boolean
}

/* =========================================================
 *  MAPPER IR - TRANSFORMATION DOMAIN
 * ========================================================= */

export interface MapperIR {
    source: string                // PHP/Laravel source
    target: string                // TypeScript target  
    mappings: MapperFieldIR[]
    transformations: TransformationRules
}

export interface MapperFieldIR {
    source: string                // created_at
    target: string                // createdAt
    transform?: TransformFunction // date parsing, etc.
    conditional?: ConditionalRule // when to apply mapping
}

export interface TransformationRules {
    dateFields: string[]          // Fields that need date transformation
    currencyFields: string[]      // Fields that need currency transformation
    enumFields: string[]          // Fields that are enums
    customTransforms: CustomTransformIR[]
}

export interface CustomTransformIR {
    field: string
    function: string              // Transform function name
    parameters?: unknown[]        // More type-safe than any[]
}

export type TransformFunction =
    | 'date_iso'
    | 'date_human'
    | 'currency_minor'
    | 'currency_major'
    | 'enum_value'
    | 'custom'

export interface ConditionalRule {
    condition: string             // When to apply this mapping
    parameters?: Record<string, unknown>  // More type-safe than any
}

/* =========================================================
 *  SHARED TYPES & ENUMS
 * ========================================================= */

export interface SharedTypeIR {
    name: string
    type: 'interface' | 'type' | 'class'
    definition: TypeDefinition
    usedBy: string[]              // Which resources/requests use this
}

export interface TypeDefinition {
    fields?: Record<string, SemanticType>
    extends?: string[]
    implements?: string[]
}

export interface EnumIR {
    name: string
    values: EnumValueIR[]
    type: 'string' | 'number'
    metadata: EnumMetadata
}

export interface EnumValueIR {
    key: string
    value: string | number
    description?: string
}

export interface EnumMetadata {
    sourceFile: string
    usedBy: string[]
    generated_at: string
}

export interface ImportIR {
    module: string
    imports: ImportSpecIR[]
    isTypeOnly: boolean
}

export interface ImportSpecIR {
    name: string
    alias?: string
    isDefault?: boolean
}

/* =========================================================
 *  VALIDATION TYPES
 * ========================================================= */

export interface ZodValidationIR {
    schema: string                // Zod schema definition
    imports: string[]
}

export interface LaravelValidationIR {
    rules: Record<string, string[]>
    messages?: Record<string, string>
}

export interface CustomValidationIR {
    name: string
    implementation: string
    dependencies: string[]
}

/* =========================================================
 *  METADATA TYPES
 * ========================================================= */

export interface ContractMetadata {
    version: string
    generated_at: string
    generator_version: string
    source_files: string[]
    total_resources: number
    total_requests: number
    total_endpoints: number
}

/* =========================================================
 *  GENERATION CONTEXT
 * ========================================================= */

export interface GenerationContext {
    projectRoot: string
    outputDir: string
    config: GenerationConfig
    manifest: RouteManifest
}

export interface GenerationConfig {
    typescript: {
        strict: boolean
        target: string
        moduleResolution: string
    }
    validation: {
        useZod: boolean
        useLaravel: boolean
    }
    naming: {
        caseTransform: 'camel' | 'pascal' | 'snake' | 'kebab'
        resourceSuffix: string
        requestSuffix: string
    }
}

// Re-export for compatibility with existing manifest types
export interface RouteManifest {
    resources: ParsedResource[]
    requests: ParsedRequest[]
    routes: ParsedRoute[]
    metadata: ManifestMetadata
}

export interface ParsedResource {
    name: string
    sourceModel?: string
    fields: ParsedField[]
    controller?: string
    routes?: string[]
}

export interface ParsedRequest {
    name: string
    actions: ParsedAction[]
    controller?: string
    routes: string[]
}

export interface ParsedRoute {
    id: string
    method: HttpMethod
    path: string
    controller: string
    action: string
    middleware?: string[]
}

export interface ParsedField {
    name: string
    resolved?: SemanticNode
    optional?: boolean
    nullable?: boolean
    readonly?: boolean
}

export interface ParsedAction {
    name: string
    fields: ParsedField[]
    validation?: Record<string, unknown>  // More specific than any
}

export interface ManifestMetadata {
    version: string
    scanned_at: string
    source_files: string[]
}

// =============================================================================
// EMITTER INTERFACES
// =============================================================================

/**
 * Emitter interface - all emitters implement this
 * They receive the complete ContractIR and project only what they need
 */
export interface IREmitter {
    emit(ir: ContractIR): GeneratedFile[]
}

export interface GeneratedFile {
    path: string
    content: string
    metadata?: FileMetadata
}

export interface FileMetadata {
    emitter: string
    generatedAt: string
    dependencies: string[]
}

export interface GeneratedOutput {
    files: GeneratedFile[]
    ir: ContractIR
    metadata: OutputMetadata
}

export interface OutputMetadata {
    stats: {
        resourceCount: number
        requestCount: number
        endpointCount: number
        fileCount: number
    }
    performance: {
        buildTime: number
        emitTime: number
    }
}

// =============================================================================
// TYPE IR UTILITIES - ENHANCED MIGRATION SUPPORT
// =============================================================================

/**
 * TypeIR utility functions untuk migrasi dan type manipulation yang aman
 */
export class TypeIRUtils {
    /**
     * Safely wrap TypeIR dengan nullable
     */
    static makeNullable(inner: TypeIR): NullableTypeIR {
        return { kind: 'nullable', inner }
    }

    /**
     * Safely wrap TypeIR dengan optional
     */
    static makeOptional(inner: TypeIR): OptionalTypeIR {
        return { kind: 'optional', inner }
    }

    /**
     * Create array TypeIR dengan safe item type
     */
    static makeArray(items: TypeIR, options?: { minItems?: number; maxItems?: number }): ArrayTypeIR {
        return {
            kind: 'array',
            items,
            ...(options?.minItems && { minItems: options.minItems }),
            ...(options?.maxItems && { maxItems: options.maxItems })
        }
    }

    /**
     * Type guard untuk checking TypeIR kinds dengan safety
     */
    static isPrimitive(type: TypeIR): type is PrimitiveTypeIR {
        return type.kind === 'primitive'
    }

    static isReference(type: TypeIR): type is ReferenceTypeIR {
        return type.kind === 'reference'
    }

    static isArray(type: TypeIR): type is ArrayTypeIR {
        return type.kind === 'array'
    }

    static isNullable(type: TypeIR): type is NullableTypeIR {
        return type.kind === 'nullable'
    }

    static isOptional(type: TypeIR): type is OptionalTypeIR {
        return type.kind === 'optional'
    }

    /**
     * Unwrap nested nullable/optional types untuk mendapatkan base type
     */
    static unwrapType(type: TypeIR): TypeIR {
        if (this.isNullable(type) || this.isOptional(type)) {
            return this.unwrapType(type.inner)
        }
        return type
    }

    /**
     * Check apakah type adalah nullable di level manapun
     */
    static isDeepNullable(type: TypeIR): boolean {
        if (this.isNullable(type)) return true
        if (this.isOptional(type)) return this.isDeepNullable(type.inner)
        return false
    }

    /**
     * Check apakah type adalah optional di level manapun
     */
    static isDeepOptional(type: TypeIR): boolean {
        if (this.isOptional(type)) return true
        if (this.isNullable(type)) return this.isDeepOptional(type.inner)
        return false
    }

    /**
     * Generate human-readable type description untuk debugging
     */
    static describeType(type: TypeIR): string {
        switch (type.kind) {
            case 'primitive':
                return `primitive(${type.type}${type.format ? `:${type.format}` : ''})`
            case 'reference':
                return `reference(${type.target}${type.module ? `@${type.module}` : ''})`
            case 'array':
                return `array<${this.describeType(type.items)}>`
            case 'nullable':
                return `${this.describeType(type.inner)} | null`
            case 'optional':
                return `${this.describeType(type.inner)}?`
            case 'union':
                return `union(${type.types.map(t => this.describeType(t)).join(' | ')})`
            case 'literal':
                return `literal(${JSON.stringify(type.value)})`
            case 'inline_object':
                const props = Object.entries(type.properties)
                    .map(([key, val]) => `${key}: ${this.describeType(val)}`)
                    .join(', ')
                return `{ ${props} }`
            default:
                const unknownType = type as { kind?: string }
                return `unknown(${unknownType.kind || 'no-kind'})`
        }
    }

    /**
     * Migration helper - convert legacy semantic type structure ke TypeIR dengan logging
     */
    static migrateFromLegacy(legacyType: unknown, context: string): TypeIR {
        console.log(`🔄 Migrating legacy type in ${context}:`, legacyType)

        // Basic fallback untuk migration
        if (!legacyType || typeof legacyType !== 'object') {
            console.warn(`⚠️  Invalid legacy type in ${context}, using unknown`)
            return { kind: 'primitive', type: 'unknown' }
        }

        // TODO: Implement specific migration logic based on actual legacy structure
        return { kind: 'primitive', type: 'unknown' }
    }
}Dari desain IR ini, arahnya sudah jauh lebih matang dibanding versi yang lama. Yang paling penting adalah kamu berhasil memisahkan compiler dan emitter. Emitter sekarang hanya menjadi renderer, bukan lagi tempat business logic.

Yang menurutku sudah sangat bagus:

TypeIR menjadi pusat representasi tipe. Emitter tidak perlu tahu apa itu SemanticNode, ModelNode, ResourceNode, dsb.
Wrapper composition (NullableTypeIR, OptionalTypeIR, ArrayTypeIR) jauh lebih bersih daripada boolean nullable dan optional.
Resource / Request / Endpoint sebagai domain utama membuat IR benar-benar domain-centric, bukan AST-centric.
TypeProjections menghilangkan banyak if emitter === ... di emitter.

Tetapi ada beberapa bagian yang menurutku masih bisa disederhanakan.

1. TypeProjections kemungkinan over-engineered

Sekarang setiap field membawa

type: {
    contract
    read
    form
    field
    mapper
    schema
}

Padahal kemungkinan besar:

80-90%

dari projection itu identik.

Misalnya

string

akan tetap

string

di semua emitter.

Artinya setiap field akan menyimpan 6 buah tree TypeIR yang sebenarnya sama.

Lebih baik

base TypeIR

↓

Emitter Projection Visitor

atau

TypeIR
+ ProjectionHints

misalnya

type: TypeIR

projection: {
    readonly: true
    camelCase: true
    runtimeSchema: true
}

daripada menduplikasi tree enam kali.

2. Nullable dan Optional bisa digabung

Sekarang ada

Optional
Nullable

Padahal bisa dibuat lebih umum

ModifierTypeIR

contoh

{
    kind: "modifier",
    modifier: "optional",
    inner: ...
}

atau

modifier: "nullable"

Sehingga kalau nanti muncul

readonly
promise
lazy
readonly array

IR tidak perlu terus bertambah jenis wrapper.

3. ReferenceTypeIR sebaiknya memakai ID, bukan string

Sekarang

target: string

lebih baik

target: ResourceId

atau

target: SymbolId

String mudah typo.

Compiler biasanya memakai identifier.

4. ValidationRules terlalu sederhana

Sekarang

type:
required
optional
nullable
array
object
custom

Laravel punya jauh lebih banyak.

Misalnya

integer

numeric

min

max

between

exists

unique

confirmed

sometimes

email

url

regex

uuid

ulid

date

after

before

Kalau IR sudah ada, sebaiknya jangan dibatasi.

Lebih bagus

interface ValidationRuleIR{
    name:string
    args: unknown[]
}

Misalnya

min:3

menjadi

{
   name:"min",
   args:[3]
}
5. ParameterIR masih memakai SemanticType

Di sini

type: SemanticType

padahal seluruh filosofi file adalah

emitter tidak mengenal semantic.

Ini inkonsisten.

Seharusnya

type: TypeIR
6. SharedTypeIR juga masih memakai SemanticType

Masih ada

fields?: Record<string, SemanticType>

Harusnya

fields: Record<string, TypeIR>

Kalau tidak nanti emitter tetap harus membaca semantic.

7. ParsedField masih menyimpan SemanticNode
resolved?: SemanticNode

Ini sebenarnya bukan bagian ContractIR.

Ini bagian parser.

Lebih cocok dipisahkan.

Misalnya

Manifest

↓

Semantic Graph

↓

ContractIR

ContractIR seharusnya tidak lagi membawa node compiler.

8. EnhancedTypeIR kemungkinan tidak diperlukan

Sekarang ada

EnhancedTypeIR

yang hanya menambah

_migration

_computed

Ini terasa seperti objek migrasi sementara.

Kalau migrasi selesai, interface ini kemungkinan akan dihapus.

Jadi mungkin tidak perlu menjadi bagian IR permanen.

9. ResourceVariantIR berpotensi menduplikasi data

Misalnya

contract

read

schema

form

masing-masing menyimpan

fields[]

Kalau field ada 50,

berarti tersimpan

50

↓

200 field object

Padahal yang berubah mungkin hanya

camelCase

readonly

optional

Lebih hemat jika variant hanya menyimpan override.

Penilaian keseluruhan

Kalau dibandingkan IR generator TypeScript yang umum, desain ini sudah berada di level yang tinggi karena:

Compiler dan emitter benar-benar terpisah.
Domain (Resource, Request, Endpoint) menjadi pusat, bukan AST.
TypeIR bersifat rekursif dan ekspresif.
Wrapper (nullable, optional, array, union) membentuk representasi tipe yang bersih dan mudah diperluas.

Hal-hal yang paling layak diperbaiki sebelum dijadikan fondasi jangka panjang adalah:

Ganti seluruh sisa SemanticType/SemanticNode di IR menjadi TypeIR.
Hindari duplikasi besar pada TypeProjections dan ResourceVariantIR.
Gunakan identifier terstruktur untuk referensi (ReferenceTypeIR) daripada string.
Jadikan sistem validasi lebih generik agar mampu merepresentasikan seluruh aturan Laravel tanpa perubahan skema IR.

Dengan perubahan itu, desain ini sudah sangat mendekati IR compiler yang benar-benar independen dari frontend maupun backend emitter.import { createHash } from 'crypto'
import type { SemanticIRNode, SourceRef, IRRawNode, SemanticNode, IRContext, ParsedASTNode } from '../types/semantic'
import { isObject, hasProperty, isString } from '../utils/type-guards'

/**
 * Roadmap Stage 2 (IR v3) — see compiler/CompilerRoadmap.md.
 *
 * Today `SemanticIRNode` is only ever constructed transiently, with
 * `meta.stableHash: ""` and `meta.lineage: []` hardcoded
 * (`packages/sdk/src/generator.ts:121`), and that construction site is on a
 * dead code path (backlog H4) — it never runs during `scan`/`generate`.
 *
 * This module is the real construction site: every field resolved by
 * `resolveManifestIncrementally` (packages/cli/src/utils/incremental.ts) gets
 * one of these, with `id`/`source`/`meta.stableHash`/`meta.lineage` actually
 * computed from real inputs, not left empty.
 *
 * Deliberately additive: this does not change what `field.resolved` contains
 * (existing generators keep reading that flat shape unchanged). The IR node
 * built here is a second, addressable artifact — see
 * `packages/cli/src/utils/incremental.ts`'s `irRegistry` and
 * `routesync.ir.json` — which is what "computed once, so stages 3-6 have
 * something stable to key off" (CompilerRoadmap.md Stage 2) actually requires.
 */

/**
 * `stableHash` is a hash of exactly the inputs that determine the resolution
 * outcome: the raw code being resolved plus the semantic result derived from
 * it. It deliberately excludes `id`/`source`/lineage so that moving a field
 * to a different line, or renaming its parent, does not change its hash —
 * only a change to the code or to what it resolves to should invalidate it.
 * This is the same property `ZeroBoilerplate.md` §6 asks for.
 */
export function computeStableHash(rawCode: string, semantic: SemanticNode): string {
  const canonical = JSON.stringify({
    code: rawCode,
    type: semantic.type,
    status: semantic.status,
    model: semantic.model ?? null,
    resource: semantic.resource ?? null,
    collection: !!semantic.collection,
  })
  return createHash('sha256').update(canonical).digest('hex')
}

export interface BuildIRNodeInput {
  /** Deterministic, human-readable path — e.g. `route:GET:/orders/{id}#response.items.0.price` */
  id: string
  source: SourceRef
  rawCode: string
  parsedAst?: unknown
  hints?: IRRawNode['hints']
  semantic: SemanticNode
  /** ids of ancestor nodes, root-first, not including this node's own id */
  lineage: string[]
  context?: IRContext
}

/**
 * Type guard untuk ParsedASTNode
 */
function isParsedASTNode(value: unknown): value is ParsedASTNode {
  return isObject(value) &&
    hasProperty(value, 'kind') &&
    isString(value.kind) &&
    ['property_access', 'method_call', 'binary_expression', 'type_cast',
      'ternary', 'literal', 'nullsafe_chain', 'unknown', 'variable',
      'primitive', 'resource', 'model', 'static_method_call',
      'nullsafe_property_access', 'new_instance'].includes(value.kind)
}

export function buildSemanticIRNode(input: BuildIRNodeInput): SemanticIRNode {
  const node: IRRawNode = {
    kind: 'raw_code',
    code: input.rawCode,
    hints: input.hints,
    parsed_ast: isParsedASTNode(input.parsedAst) ? input.parsedAst : undefined,
  }

  return {
    id: input.id,
    source: input.source,
    node,
    semantic: input.semantic,
    meta: {
      version: 'ir.v2',
      stableHash: computeStableHash(input.rawCode, input.semantic),
      lineage: input.lineage,
      createdAt: new Date().toISOString(),
    },
    context: input.context,
  }
}

/** In-memory registry keyed by `SemanticIRNode.id`, built once per scan and serialized as-is. */
export class IRNodeRegistry {
  private nodes = new Map<string, SemanticIRNode>()

  add(node: SemanticIRNode): SemanticIRNode {
    this.nodes.set(node.id, node)
    return node
  }

  get(id: string): SemanticIRNode | undefined {
    return this.nodes.get(id)
  }

  toJSON(): Record<string, SemanticIRNode> {
    return Object.fromEntries(this.nodes)
  }

  get size(): number {
    return this.nodes.size
  }
}Menurutku implementasi ini justru salah satu bagian yang paling kuat dari roadmap-mu. Ini sudah mulai terlihat seperti compiler IR sungguhan, bukan sekadar objek hasil parsing.

Yang aku suka:

computeStableHash() hanya bergantung pada rawCode + semantic result. Itu berarti perubahan lokasi file, nomor baris, atau parent tidak membuat hash berubah. Ini sangat cocok untuk incremental compilation.
IRNodeRegistry sederhana tetapi efektif. Map<string, SemanticIRNode> sudah cukup untuk lookup O(1) dan serialisasi ke routesync.ir.json.
buildSemanticIRNode() hanya bertugas membangun IR. Tidak ada business logic yang bercampur di dalamnya.

Namun ada beberapa hal yang menurutku masih bisa diperbaiki.

1. createdAt sebaiknya tidak ada di IR

Sekarang setiap node memiliki

createdAt: new Date().toISOString()

Ini membuat dua scan identik menghasilkan file IR yang berbeda.

Contohnya

Scan 1

createdAt = 10:00
Scan 2

createdAt = 10:01

Padahal source code sama persis.

Untuk compiler, IR sebaiknya deterministik.

Kalau memang ingin debugging, lebih baik timestamp disimpan di metadata scan:

routesync.ir.json

metadata:
    generatedAt

bukan di setiap node.

2. version: "ir.v2" sebaiknya menjadi konstanta

Daripada

version: "ir.v2"

lebih baik

const IR_VERSION = "ir.v2"

atau enum.

Nanti ketika menjadi v3, cukup mengganti satu tempat.

3. stableHash bisa dibuat lebih extensible

Sekarang

JSON.stringify({
    code,
    type,
    status,
    model,
    resource,
    collection
})

Kalau nanti SemanticNode bertambah

enum

union

literal

nullable

array

generic

kamu harus ingat mengubah hash.

Lebih aman kalau SemanticNode memiliki canonical serializer sendiri.

Misalnya

serializeSemanticNode(semantic)

baru hasilnya di-hash.

4. lineage sebaiknya immutable

Sekarang

lineage: input.lineage

Kalau array itu masih dipakai di luar, bisa berubah.

Lebih aman

lineage: [...input.lineage]

atau

Object.freeze([...input.lineage])
5. IRNodeRegistry.add()

Sekarang

this.nodes.set(node.id, node)

diam-diam overwrite.

Padahal duplicate id harusnya bug.

Lebih aman

if (this.nodes.has(node.id)) {
    throw new Error(...)
}

karena id seharusnya unik.

6. toJSON()

Sekarang

Object.fromEntries(this.nodes)

Kalau tujuanmu adalah serialisasi, bagus.

Tetapi kalau nanti ingin stable diff di Git,

lebih baik sort dulu.

Misalnya

Object.fromEntries(
    [...this.nodes.entries()]
        .sort(...)
)

supaya output selalu konsisten.

7. parsedAst?: unknown

Ini terasa masih sementara.

Sekarang

parsedAst?: unknown

lalu

isParsedASTNode()

Kalau memang seluruh parser menghasilkan ParsedASTNode, lebih baik langsung

parsedAst?: ParsedASTNode

Sehingga type guard tidak lagi diperlukan di sini.

Kalau masih ada parser lama, keputusan sekarang masih masuk akal sebagai tahap migrasi.

8. IRNodeRegistry

Menurutku nanti akan berkembang menjadi semacam graph.

Sekarang hanya punya

get()

add()

size()

toJSON()

Roadmap berikutnya kemungkinan akan membutuhkan

getChildren(id)

getParents(id)

findBySource(file)

findByStableHash(hash)

findByModel(model)

findByResource(resource)

Karena node sudah punya source, lineage, dan stableHash, registry bisa menjadi indeks utama compiler, bukan sekadar penyimpanan.

Kesimpulan

Secara keseluruhan, implementasi ini sudah sangat sesuai dengan arsitektur compiler yang sedang kamu bangun. Yang paling penting adalah kamu sudah memisahkan SemanticIRNode sebagai artefak stabil yang bisa direferensikan lintas tahap, bukan hanya objek sementara yang dipakai emitter.

Perbaikan yang paling aku prioritaskan sebelum menjadikannya fondasi jangka panjang adalah:

Hilangkan createdAt dari setiap node agar IR deterministik.
Jadikan versi IR sebagai konstanta global.
Cegah IRNodeRegistry menimpa node dengan id yang sama.
Salin (copy) lineage agar node benar-benar immutable.
Pertimbangkan membuat registry menjadi graph/index pada tahap berikutnya, bukan hanya Map<string, SemanticIRNode>.

Selain poin-poin itu, struktur dan tanggung jawab modul ini sudah bersih dan sejalan dengan konsep incremental compiler yang kamu tuju.                       /**
 * Contract IR Builder
 * 
 * Converts semantic analysis results into the domain-centric Contract IR structure.
 * This is the central transformation that enables thin emitters.
 * 
 * ENHANCED WITH TYPE IR SYSTEM:
 * - Builds rich TypeIR projections for each emitter
 * - Eliminates semantic compiler knowledge from emitters  
 * - Pre-resolves all type information (nullable, optional, nested objects)
 */

import { createHash } from 'crypto'
import type {
    ContractIR,
    ResourceIR,
    RequestIR,
    EndpointIR,
    SharedTypeIR,
    EnumIR,
    ImportIR,
    RouteManifest,
    ParsedResource,
    ParsedRequest,
    ParsedRoute,
    ResourceFieldIR,
    ResourceAliasIR,
    ResourceVariantIR,
    MapperIR,
    MapperFieldIR,
    RequestActionIR,
    ParameterIR,
    ResponseReference,
    RequestReference,
    TransformationRules,
    GenerationContext,
    ContractMetadata,
    TypeIR,
    TypeProjections,
    PrimitiveTypeIR,
    ReferenceTypeIR,
    ValidationRules,
    TransformFunction,
    ResolvedSemanticType
} from '../types/ir'

import { SemanticType } from '../types/semantic'
import {
    isPrimitiveType,
    isResourceType,
    isModelType,
    isObjectType,
    isArrayType,
    isUnionType,
    isLiteralType,
    safeStringCast,
    hasKind
} from '../utils/type-guards'
import { TypeIRUtils } from '../types/ir'

interface ParsedFieldData {
    name: string
    nullable?: boolean
    optional?: boolean
    readonly?: boolean
    description?: string
    validation?: Record<string, unknown>
    resolved?: {
        type?: SemanticType
        model?: string
    }
    semanticType?: SemanticType
}

interface ParsedActionData {
    name: string
    fields: ParsedFieldData[]
    validation?: Record<string, unknown>
}

export class ContractIRBuilder {
    private resources: Map<string, ResourceIR> = new Map()
    private requests: Map<string, RequestIR> = new Map()
    private endpoints: Map<string, EndpointIR> = new Map()
    private sharedTypes: Map<string, SharedTypeIR> = new Map()
    private enums: Map<string, EnumIR> = new Map()

    constructor(
        private context: GenerationContext
    ) { }

    /**
     * Main entry point: builds Contract IR from parsed manifest
     */
    buildFromManifest(manifest: RouteManifest): ContractIR {
        console.log('🏗️  Building Contract IR from manifest...')

        // Build Resources from parsed resources
        for (const resource of manifest.resources) {
            const resourceIR = this.buildResourceIR(resource)
            this.resources.set(resourceIR.name, resourceIR)
        }

        // Build Requests from form analysis  
        for (const request of manifest.requests) {
            const requestIR = this.buildRequestIR(request)
            this.requests.set(requestIR.name, requestIR)
        }

        // Build Endpoints from routes
        for (const route of manifest.routes) {
            const endpointIR = this.buildEndpointIR(route)
            this.endpoints.set(endpointIR.id, endpointIR)
        }

        // Build shared types and enums
        this.buildSharedTypes()
        this.buildEnums()

        const ir: ContractIR = {
            resources: Array.from(this.resources.values()),
            requests: Array.from(this.requests.values()),
            endpoints: Array.from(this.endpoints.values()),
            sharedTypes: Array.from(this.sharedTypes.values()),
            enums: Array.from(this.enums.values()),
            imports: this.buildImports(),
            metadata: this.buildMetadata(manifest)
        }

        console.log(`✅ Built Contract IR: ${ir.resources.length} resources, ${ir.requests.length} requests, ${ir.endpoints.length} endpoints`)
        return ir
    }

    /**
     * Build ResourceIR from parsed resource
     */
    private buildResourceIR(resource: ParsedResource): ResourceIR {
        const fields = resource.fields.map(field => this.buildResourceField(field))

        const resourceIR: ResourceIR = {
            id: this.generateResourceId(resource),
            name: resource.name,
            sourceModel: resource.sourceModel,
            fields,
            aliases: this.buildResourceAliases(resource),
            variants: this.buildResourceVariants(resource, fields),
            mapper: this.buildResourceMapper(resource, fields),
            metadata: {
                sourceFile: resource.name,
                controller: resource.controller,
                routes: resource.routes || [],
                generated_at: new Date().toISOString(),
                dependencies: this.extractDependencies(fields)
            }
        }

        return resourceIR
    }

    /**
     * Build RequestIR from parsed request
     */
    private buildRequestIR(request: ParsedRequest): RequestIR {
        const actions = request.actions.map(action => this.buildRequestAction(action))

        const requestIR: RequestIR = {
            id: this.generateRequestId(request),
            name: request.name,
            actions,
            validation: {
                zod: undefined,
                laravel: undefined,
                custom: []
            },
            metadata: {
                sourceFile: request.name,
                controller: request.controller,
                routes: request.routes,
                generated_at: new Date().toISOString()
            }
        }

        return requestIR
    }

    /**
     * Build EndpointIR from parsed route
     */
    private buildEndpointIR(route: ParsedRoute): EndpointIR {
        const endpointIR: EndpointIR = {
            id: route.id,
            method: route.method,
            path: route.path,
            pathParams: this.extractPathParams(route.path),
            queryParams: [],
            request: this.buildRequestReference(route),
            response: this.buildResponseReference(route),
            middleware: (route.middleware || []).map((name, index) => ({
                name,
                parameters: [],
                order: index
            })),
            metadata: {
                controller: route.controller,
                action: route.action,
                generated_at: new Date().toISOString()
            }
        }

        return endpointIR
    }

    /**
     * Build ResourceFieldIR with semantic type and transformations
     */
    private buildResourceField(field: ParsedFieldData): ResourceFieldIR {
        // Extract semantic type from resolved data if available
        let semanticType: SemanticType | ResolvedSemanticType | undefined = field.semanticType

        // Check if field has resolved type information from manifest
        if (field.resolved?.type) {
            semanticType = {
                kind: 'primitive',
                type: field.resolved.type,
                resolved: field.resolved
            }
            console.log(`✅ Using resolved type for ${field.name}: ${field.resolved.type}`)
        } else {
            console.warn(`⚠️  No resolved type for field: ${field.name}`)
        }

        const typeProjections = this.buildTypeProjectionsFromField(field, semanticType)

        return {
            name: field.name,
            transformedName: this.transformFieldName(field.name),
            type: typeProjections,
            semanticType: semanticType,
            description: field.description,
            validation: field.validation ? this.buildValidationRules(field.validation) : undefined,
            source: field.resolved?.model ? {
                type: 'model_column' as const,
                path: field.name,
                model: field.resolved.model
            } : {
                type: 'computed' as const,
                path: field.name
            }
        }
    }

    /**
     * Build enriched TypeProjections from field data
     */
    private buildTypeProjectionsFromField(field: ParsedFieldData, semanticType?: SemanticType | ResolvedSemanticType | undefined): TypeProjections {
        const nullable = field.nullable || false
        const optional = field.optional || false
        const resolvedSemanticType = semanticType || field.resolved?.type || field.semanticType

        const contractType = this.buildContractTypeIR(resolvedSemanticType, nullable, optional)
        const readType = this.buildReadTypeIR(resolvedSemanticType, nullable, optional)
        const formType = this.buildFormTypeIR(resolvedSemanticType, nullable, optional)
        const fieldType = this.buildFieldTypeIR(resolvedSemanticType, nullable, optional)
        const mapperType = this.buildMapperTypeIR(resolvedSemanticType, nullable, optional)
        const schemaType = this.buildSchemaTypeIR(resolvedSemanticType, nullable, optional)

        return {
            contract: contractType,
            read: readType,
            form: formType,
            field: fieldType,
            mapper: mapperType,
            schema: schemaType
        }
    }

    /**
     * Build TypeIR for ContractEmitter - exact nullable/optional handling
     */
    private buildContractTypeIR(semanticType: SemanticType | ResolvedSemanticType | undefined, nullable: boolean, optional: boolean): TypeIR {
        let baseType = this.semanticToTypeIR(semanticType)

        if (nullable) {
            baseType = TypeIRUtils.makeNullable(baseType)
        }

        if (optional) {
            baseType = TypeIRUtils.makeOptional(baseType)
        }

        return baseType
    }

    /**
     * Build TypeIR for ReadEmitter - preserves nullable/optional  
     */
    private buildReadTypeIR(semanticType: SemanticType | ResolvedSemanticType | undefined, nullable: boolean, optional: boolean): TypeIR {
        return this.buildContractTypeIR(semanticType, nullable, optional)
    }

    /**
     * Build TypeIR for FormEmitter - treats nullable as optional
     */
    private buildFormTypeIR(semanticType: SemanticType | ResolvedSemanticType | undefined, nullable: boolean, optional: boolean): TypeIR {
        let baseType = this.semanticToTypeIR(semanticType)

        if (nullable || optional) {
            baseType = { kind: 'optional', inner: baseType }
        }

        return baseType
    }

    /**
     * Build TypeIR for FieldEmitter - no modifiers needed
     */
    private buildFieldTypeIR(semanticType: SemanticType | ResolvedSemanticType | undefined, nullable: boolean, optional: boolean): TypeIR {
        return this.semanticToTypeIR(semanticType)
    }

    /**
     * Build TypeIR for MapperEmitter - needs nullable info for runtime checks
     */
    private buildMapperTypeIR(semanticType: SemanticType | ResolvedSemanticType | undefined, nullable: boolean, optional: boolean): TypeIR {
        let baseType = this.semanticToTypeIR(semanticType)

        if (nullable) {
            baseType = TypeIRUtils.makeNullable(baseType)
        }

        if (optional) {
            baseType = TypeIRUtils.makeOptional(baseType)
        }

        return baseType
    }

    /**
     * Build TypeIR for SchemaEmitter - needs nullable/optional for validation
     */
    private buildSchemaTypeIR(semanticType: SemanticType | ResolvedSemanticType | undefined, nullable: boolean, optional: boolean): TypeIR {
        return this.buildContractTypeIR(semanticType, nullable, optional)
    }

    /**
     * Convert semantic type to base TypeIR (without modifiers) - ENHANCED VERSION
     * Uses resolved type information from manifest when available
     */
    private semanticToTypeIR(semanticType: SemanticType | ResolvedSemanticType | undefined): TypeIR {
        if (!semanticType) {
            return { kind: 'primitive', type: 'unknown' }
        }

        if (typeof semanticType === 'string') {
            return { kind: 'primitive', type: semanticType as PrimitiveTypeIR['type'] }
        }

        if (!hasKind(semanticType)) {
            return { kind: 'primitive', type: 'unknown' }
        }

        // Check if this semantic type has resolved information first
        const resolvedSemantic = semanticType
        if (resolvedSemantic.resolved?.type) {
            const resolvedType = resolvedSemantic.resolved.type
            console.log(`🔍 Using resolved type: ${resolvedType}`)
            return { kind: 'primitive', type: resolvedType as PrimitiveTypeIR['type'] }
        }

        // Menggunakan type guards utility yang lebih aman
        if (isPrimitiveType(semanticType)) {
            const primitiveType = semanticType as { kind: 'primitive', type: string, format?: string }
            return {
                kind: 'primitive',
                type: safeStringCast(primitiveType.type, 'unknown') as PrimitiveTypeIR['type'],
                format: primitiveType.format
            }
        }

        if (isResourceType(semanticType)) {
            const resourceType = semanticType as { kind: 'resource', resource: string, collection?: boolean }
            const resourceRef: ReferenceTypeIR = {
                kind: 'reference',
                target: resourceType.resource + 'Schema'
            }

            if (resourceType.collection) {
                return TypeIRUtils.makeArray(resourceRef)
            }

            return resourceRef
        }

        if (isModelType(semanticType)) {
            const modelType = semanticType as { kind: 'model', model: string }
            return {
                kind: 'reference',
                target: modelType.model + 'Schema'
            }
        }

        if (isObjectType(semanticType)) {
            const objectType = semanticType as { kind: 'object', properties?: Record<string, unknown> }
            if (objectType.properties) {
                const properties: Record<string, TypeIR> = {}
                for (const [key, value] of Object.entries(objectType.properties)) {
                    properties[key] = this.semanticToTypeIR(value as SemanticType | ResolvedSemanticType | undefined)
                }

                return {
                    kind: 'inline_object',
                    properties,
                    additionalProperties: false
                }
            }

            return {
                kind: 'inline_object',
                properties: {},
                additionalProperties: true
            }
        }

        if (isArrayType(semanticType)) {
            const arrayType = semanticType as { kind: 'array', items: unknown }
            return TypeIRUtils.makeArray(this.semanticToTypeIR(arrayType.items as SemanticType | ResolvedSemanticType | undefined))
        }

        if (isUnionType(semanticType)) {
            const unionType = semanticType as { kind: 'union', types: unknown[] }
            return {
                kind: 'union',
                types: unionType.types.map((t: unknown) => this.semanticToTypeIR(t as SemanticType | ResolvedSemanticType | undefined))
            }
        }

        if (isLiteralType(semanticType)) {
            const literalType = semanticType as { kind: 'literal', value: string | number | boolean }
            return {
                kind: 'literal',
                value: literalType.value
            }
        }

        // Fallback yang lebih aman dengan logging yang informatif
        const unknownType = semanticType as { kind?: string }
        console.warn(`⚠️  Unknown semantic type:`, {
            kind: unknownType.kind,
            type: typeof semanticType,
            keys: Object.keys(semanticType)
        })
        return { kind: 'primitive', type: 'unknown' }
    }

    /**
     * Build resource aliases (Show, Index only - removed redundant Collection/Paginated types)
     */
    private buildResourceAliases(resource: ParsedResource): ResourceAliasIR[] {
        const baseName = resource.name.replace('Resource', '')

        return [
            {
                name: `${baseName}Show`,
                kind: "show",
                target: `${baseName}Transformed`
            },
            {
                name: `${baseName}Index`,
                kind: "index",
                target: `${baseName}Transformed`,
                isArray: true
            }
        ]
    }

    /**
     * Build resource variants for different use cases
     */
    private buildResourceVariants(
        resource: ParsedResource,
        fields: ResourceFieldIR[]
    ): ResourceVariantIR[] {
        return [
            {
                kind: "read",
                fields: this.transformFieldsForRead(fields),
                metadata: {
                    purpose: "TypeScript interfaces for API responses",
                    generator: "ReadEmitter"
                }
            },
            {
                kind: "schema",
                fields: this.transformFieldsForSchema(fields),
                metadata: {
                    purpose: "Zod validation schemas",
                    generator: "SchemaEmitter",
                    nullable_handling: 'strict'
                }
            },
            {
                kind: "contract",
                fields: this.transformFieldsForContract(fields),
                metadata: {
                    purpose: "API contracts and documentation",
                    generator: "ContractEmitter"
                }
            },
            {
                kind: "form",
                fields: this.transformFieldsForForm(fields),
                metadata: {
                    purpose: "Form input types",
                    generator: "FormEmitter",
                    optional_handling: 'loose'
                }
            }
        ]
    }

    /**
     * Build mapper for PHP -> TypeScript transformation
     */
    private buildResourceMapper(resource: ParsedResource, fields: ResourceFieldIR[]): MapperIR {
        const mappings: MapperFieldIR[] = fields.map(field => ({
            source: field.name,
            target: field.transformedName,
            transform: this.detectTransformFunction(field),
            conditional: field.source?.type === 'computed' ? {
                condition: 'field_exists',
                parameters: { field: field.name }
            } : undefined
        }))

        return {
            source: resource.sourceModel || resource.name,
            target: `${resource.name}Transformed`,
            mappings,
            transformations: this.buildTransformationRules(fields)
        }
    }

    /**
     * Build request action from parsed action
     */
    private buildRequestAction(action: ParsedActionData): RequestActionIR {
        return {
            name: action.name === 'Create' || action.name === 'Update' || action.name === 'Delete'
                ? action.name
                : 'Custom',
            customName: action.name !== 'Create' && action.name !== 'Update' && action.name !== 'Delete'
                ? action.name
                : undefined,
            fields: action.fields.map((field: ParsedFieldData) => this.buildResourceField(field)),
            rules: action.validation ? [this.buildValidationRules(action.validation)] : [],
            dependencies: []
        }
    }

    /**
     * Transform field names: subtotal_minor -> subtotalMinor
     */
    private transformFieldName(phpName: string): string {
        const caseTransform = this.context.config.naming.caseTransform

        switch (caseTransform) {
            case 'camel':
                return phpName.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
            case 'pascal':
                return phpName.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
                    .replace(/^([a-z])/, letter => letter.toUpperCase())
            case 'snake':
                return phpName
            case 'kebab':
                return phpName.replace(/_/g, '-')
            default:
                return phpName.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
        }
    }

    /**
     * Transform fields for read variant (TypeScript interfaces)
     */
    private transformFieldsForRead(fields: ResourceFieldIR[]): ResourceFieldIR[] {
        return fields.map(field => ({ ...field }))
    }

    /**
     * Transform fields for schema variant (Zod validation)
     */
    private transformFieldsForSchema(fields: ResourceFieldIR[]): ResourceFieldIR[] {
        return fields.map(field => ({ ...field }))
    }

    /**
     * Transform fields for contract variant (API documentation)
     */
    private transformFieldsForContract(fields: ResourceFieldIR[]): ResourceFieldIR[] {
        return fields.map(field => ({
            ...field,
            description: field.description || `${field.transformedName} field`
        }))
    }

    /**
     * Transform fields for form variant (input forms)
     */
    private transformFieldsForForm(fields: ResourceFieldIR[]): ResourceFieldIR[] {
        return fields.filter(field => field.source?.type !== 'computed')
            .map(field => ({ ...field }))
    }

    /**
     * Extract path parameters from route path
     */
    private extractPathParams(path: string): ParameterIR[] {
        const paramMatches = path.match(/\{([^}]+)\}/g) || []
        return paramMatches.map(match => {
            const name = match.slice(1, -1)
            return {
                name,
                type: this.inferParamType(name),
                required: true,
                description: `Path parameter: ${name}`
            }
        })
    }

    /**
     * Infer parameter type from name
     */
    private inferParamType(name: string): SemanticType {
        if (name.includes('id') || name.includes('Id')) return 'number'
        if (name.includes('slug')) return 'string'
        if (name.includes('uuid') || name.includes('Uuid')) return 'string'
        return 'string'
    }

    /**
     * Build request reference for endpoint
     */
    private buildRequestReference(route: ParsedRoute): RequestReference | undefined {
        if (route.method === 'GET') return undefined

        const requestName = `${route.controller}${route.action}Request`
        const request = this.requests.get(requestName)

        if (request) {
            return {
                type: 'request_ir',
                reference: request.name
            }
        }

        return {
            type: 'none'
        }
    }

    /**
     * Build response reference for endpoint
     */
    private buildResponseReference(route: ParsedRoute): ResponseReference {
        const resourceName = `${route.controller.replace('Controller', '')}Resource`
        const resource = this.resources.get(resourceName)

        if (resource) {
            const isCollection = route.action === 'index' || route.path.includes('search')
            return {
                type: isCollection ? "collection" : "resource",
                resource: resource.name,
                statusCode: 200
            }
        }

        return {
            type: "custom",
            statusCode: 200
        }
    }

    /**
     * Detect transformation function needed for field
     */
    private detectTransformFunction(field: ResourceFieldIR): TransformFunction | undefined {
        if (field.semanticType === 'datetime') return 'date_iso'
        if (typeof field.semanticType === 'string' && field.name.includes('amount')) return 'currency_minor'
        if (typeof field.semanticType === 'string' && field.name.includes('price')) return 'currency_minor'
        return undefined
    }

    /**
     * Build transformation rules for resource
     */
    private buildTransformationRules(fields: ResourceFieldIR[]): TransformationRules {
        return {
            dateFields: fields.filter(f => f.semanticType === 'datetime').map(f => f.transformedName),
            currencyFields: fields.filter(f =>
                f.name.includes('amount') || f.name.includes('price') || f.name.includes('cost')
            ).map(f => f.transformedName),
            enumFields: fields.filter(f =>
                typeof f.semanticType === 'string' &&
                f.semanticType === 'string' &&
                f.validation?.type === 'custom'
            ).map(f => f.transformedName),
            customTransforms: []
        }
    }

    /**
     * Build validation rules
     */
    private buildValidationRules(validation: Record<string, unknown>): ValidationRules {
        return {
            type: 'required'
        }
    }

    /**
     * Extract dependencies from fields
     */
    private extractDependencies(fields: ResourceFieldIR[]): string[] {
        return fields
            .filter(field => field.source?.type === 'relation')
            .map(field => field.source!.model!)
            .filter((model, index, arr) => arr.indexOf(model) === index)
    }

    /**
     * Build shared types (extracted from common patterns)
     */
    private buildSharedTypes(): void {
        this.sharedTypes.set('Pagination', {
            name: 'Pagination',
            type: 'interface',
            definition: {
                fields: {
                    total: 'number',
                    perPage: 'number',
                    currentPage: 'number',
                    lastPage: 'number'
                }
            },
            usedBy: []
        })
    }

    /**
     * Build enums (extracted from field patterns)
     */
    private buildEnums(): void {
        // TODO: Extract enums from field validation patterns
    }

    /**
     * Build import statements
     */
    private buildImports(): ImportIR[] {
        const imports: ImportIR[] = []

        if (this.context.config.validation.useZod) {
            imports.push({
                module: 'zod',
                imports: [{ name: 'z' }],
                isTypeOnly: false
            })
        }

        return imports
    }

    /**
     * Build contract metadata
     */
    private buildMetadata(manifest: RouteManifest): ContractMetadata {
        return {
            version: 'v1.0.0',
            generated_at: new Date().toISOString(),
            generator_version: '1.0.0',
            source_files: manifest.metadata.source_files,
            total_resources: this.resources.size,
            total_requests: this.requests.size,
            total_endpoints: this.endpoints.size
        }
    }

    /**
     * Generate stable resource ID
     */
    private generateResourceId(resource: ParsedResource): string {
        return createHash('md5')
            .update(`resource:${resource.name}:${resource.sourceModel || 'unknown'}`)
            .digest('hex')
            .substring(0, 8)
    }

    /**
     * Generate stable request ID  
     */
    private generateRequestId(request: ParsedRequest): string {
        return createHash('md5')
            .update(`request:${request.name}:${request.controller || 'unknown'}`)
            .digest('hex')
            .substring(0, 8)
    }

    /**
     * Validate IR integrity
     */
    validateIR(ir: ContractIR): void {
        console.log('🔍 Validating Contract IR integrity...')

        for (const endpoint of ir.endpoints) {
            if (endpoint.response.resource) {
                const resourceExists = ir.resources.some(r => r.name === endpoint.response.resource)
                if (!resourceExists) {
                    console.warn(`⚠️  Endpoint ${endpoint.id} references unknown resource: ${endpoint.response.resource}`)
                }
            }
        }

        for (const endpoint of ir.endpoints) {
            if (endpoint.request?.reference) {
                const requestExists = ir.requests.some(r => r.name === endpoint.request!.reference)
                if (!requestExists) {
                    console.warn(`⚠️  Endpoint ${endpoint.id} references unknown request: ${endpoint.request.reference}`)
                }
            }
        }

        console.log('✅ IR validation complete')
    }
}

Secara arsitektur, ini sudah jauh lebih baik daripada generator lama. Aku melihat builder ini benar-benar mulai menjadi compiler pass daripada sekadar "mapper manifest → output". Tetapi ada beberapa bagian yang menurutku masih menunjukkan transisi dari arsitektur lama.

Yang sudah sangat bagus
1. Builder menjadi satu-satunya tempat yang memahami Semantic

Ini yang paling penting.

Manifest
      ↓
ContractIRBuilder
      ↓
ContractIR
      ↓
Emitter

Emitter tidak lagi melakukan

if (field.semanticType === ...)

Semua keputusan ada di builder.

Itu desain compiler yang benar.

2. semanticToTypeIR()

Ini menurutku fungsi paling penting di seluruh builder.

Dia menjadi boundary

Semantic

↓

TypeIR

Sesudah melewati fungsi ini seluruh pipeline seharusnya tidak mengenal Semantic lagi.

Aku suka arah ini.

3. TypeIR recursive

Misalnya

array
    object
        union
            nullable

semua bisa dibangun secara rekursif.

Ini sangat scalable.

4. Object handling

Daripada dulu

object
↓

z.record(z.unknown())

sekarang sudah

properties

↓

InlineObjectTypeIR

Ini peningkatan besar.

Yang menurutku masih kurang bagus
1. Builder membuat 6 projection

Menurutku ini masalah terbesar.

Sekarang

field

↓

contract
read
form
field
mapper
schema

Padahal semuanya memanggil

semanticToTypeIR()

enam kali.

Misalnya

User

↓

reference(UserSchema)

dibuat enam kali.

Padahal hasilnya identik.

Lebih baik

baseType

↓

Projection Visitor

atau

baseType

↓

clone bila perlu

Daripada membangun tree enam kali.

Kalau suatu resource punya 400 field, pekerjaan builder menjadi berlipat tanpa manfaat.

2. buildContractTypeIR(), buildReadTypeIR(), buildMapperTypeIR()

Sekarang isinya hampir sama.

Contract

↓

nullable

↓

optional
Read

↓

nullable

↓

optional
Mapper

↓

nullable

↓

optional

Secara praktis ini hanya copy-paste.

Lebih bagus

buildProjectedType(
    mode
)

misalnya

ProjectionMode.Contract

ProjectionMode.Read

ProjectionMode.Form

Semua aturan ada di satu tempat.

3. semanticToTypeIR() terlalu besar

Sekarang dia menangani

primitive

resource

model

object

array

union

literal

fallback

Sudah mulai mendekati 100+ baris.

Aku akan memecah menjadi dispatcher.

Misalnya

PrimitiveResolver

↓

ObjectResolver

↓

ArrayResolver

↓

ReferenceResolver

Builder menjadi jauh lebih kecil.

4. Logging di tengah compiler

Misalnya

console.log()

console.warn()

di

semanticToTypeIR()

buildResourceField()

Compiler biasanya tidak mencetak langsung.

Lebih baik ada

DiagnosticCollector

atau

Logger

supaya library bisa dipakai tanpa menghasilkan output terminal.

5. generated_at

Masalah yang sama seperti IR tadi.

generated_at

new Date()

ada di

Resource

Request

Endpoint

Akibatnya IR selalu berubah walaupun source sama.

Kalau tujuanmu incremental compilation atau snapshot test, ini akan mengganggu.

Lebih baik timestamp hanya ada di

ContractMetadata
6. buildResourceVariants()

Ini menurutku masih desain lama.

Sekarang

read

schema

contract

form

masing-masing menyimpan

fields[]

Padahal semua field sama.

Yang berubah hanya cara emitter membaca.

Artinya builder menyimpan banyak data yang identik.

7. MapperIR

Sekarang

MapperIR

masih cukup dekat dengan emitter.

Misalnya

target:
UserTransformed

Menurutku mapper tidak perlu tahu nama output.

Lebih baik

mapping

↓

field mapping

↓

transform

Biarkan emitter menentukan nama fungsi.

8. semanticType masih ikut dibawa

Masih ada

semanticType:
SemanticType | ResolvedSemanticType

Padahal tujuan IR adalah menghilangkan semantic.

Kalau emitter masih bisa membaca

field.semanticType

berarti boundary belum benar-benar bersih.

Idealnya nanti tinggal

type: TypeIR

tanpa semanticType.

9. extractDependencies()

Kalau dependency masih dihitung dari field setelah TypeIR selesai, itu bagus.

Tetapi kalau masih melihat semantic lama, sebaiknya dependency diekstrak dari

ReferenceTypeIR

karena itulah representasi resmi setelah lowering.

Nilai keseluruhan

Kalau melihat seluruh builder ini, aku menilai evolusinya seperti ini:

Pemisahan Semantic → TypeIR: ★★★★★ (sudah sangat tepat)
Desain recursive TypeIR: ★★★★★
Boundary compiler vs emitter: ★★★★★
Efisiensi implementasi: ★★★☆☆ (masih ada duplikasi)
Determinisme IR: ★★★☆☆ (timestamp dan logging masih mengganggu)
Kebersihan builder: ★★★★☆ (fungsi mulai besar dan layak dipecah)

Perubahan yang paling berdampak menurutku adalah:

Jadikan semanticToTypeIR() satu-satunya proses lowering, lalu gunakan hasilnya untuk semua emitter, bukan membangun enam tree yang hampir identik.
Hilangkan seluruh jejak semanticType dari ResourceFieldIR setelah migrasi selesai, sehingga ContractIR benar-benar independen dari compiler semantic.
Kurangi duplikasi pada TypeProjections dan ResourceVariantIR; simpan satu representasi dasar (TypeIR) dan biarkan variasi dibentuk melalui aturan proyeksi, bukan dengan menggandakan struktur data. Dengan begitu ContractIRBuilder akan lebih mendekati sebuah compiler pass yang menghasilkan IR kanonis daripada generator yang menyiapkan output spesifik untuk setiap emitter.
hari ini 9.43
Kan generate 5 file terus nanti gimana tetep bisa generate kah?

Bisa, justru itu tujuan IR.

Yang berubah bukan jumlah file yang dihasilkan, tetapi cara emitter mendapatkan informasi.

Misalnya sekarang kamu punya:

Field
 ├── contract: TypeIR
 ├── read: TypeIR
 ├── form: TypeIR
 ├── mapper: TypeIR
 └── schema: TypeIR

Lalu emitter tinggal mengambil:

ContractEmitter -> field.type.contract
ReadEmitter     -> field.type.read
FormEmitter     -> field.type.form
...

Ini memang mudah, tetapi TypeIR yang sama disimpan berkali-kali.

Alternatifnya adalah menyimpan satu TypeIR:

Field
 └── type: TypeIR

Lalu setiap emitter mempunyai renderer sendiri.

Misalnya:

ContractEmitter
renderType(field.type)

ReadEmitter
renderType(field.type)

FormEmitter
renderType(field.type)

Yang berbeda hanyalah aturan render.

Contoh:

TypeIR:
optional(
    nullable(
        string
    )
)

ContractEmitter menghasilkan:

z.string().nullable().optional()

ReadEmitter menghasilkan:

string | null | undefined

FormEmitter bisa menghasilkan:

string | undefined

MapperEmitter mungkin menghasilkan kode runtime yang mengecek null.

Jadi satu TypeIR bisa menghasilkan lima output berbeda.

Kalau ada kasus yang memang benar-benar berbeda, misalnya form tidak boleh memakai readonly atau mapper membutuhkan informasi tambahan, kamu tidak perlu membuat enam TypeIR. Cukup tambahkan metadata kecil, misalnya:

field: {
    type: TypeIR,
    projection: {
        form: {
            treatNullableAsOptional: true
        }
    }
}

atau

renderType(type, Projection.Form)

Jadi tetap bisa menghasilkan 5 file:

ContractIR
        │
        ├── ContractEmitter → api-contract.ts
        ├── ReadEmitter     → api-read.ts
        ├── FormEmitter     → api-form.ts
        ├── MapperEmitter   → api-mapper.ts
        └── SchemaEmitter   → api-schema.ts

Perbedaannya adalah IR hanya menyimpan satu sumber kebenaran (TypeIR), sedangkan setiap emitter memproyeksikannya sesuai kebutuhannya. Ini biasanya lebih hemat memori, mengurangi duplikasi, dan membuat perubahan tipe di masa depan cukup dilakukan di satu tempat.

Jadi cuma ber eda cara menangani pembacaan nya doang?

Iya, tepat sekali.

Yang berbeda bukan datanya, tetapi cara emitter membaca data yang sama.

Misalnya IR menyimpan satu tipe:

User?

atau dalam TypeIR:

optional(
    reference(User)
)

Lalu masing-masing emitter menerjemahkannya sesuai kebutuhannya.

Emitter	Hasil
ContractEmitter	z.object(...).optional()
ReadEmitter	User | undefined
FormEmitter	User | undefined (atau aturan khusus form)
MapperEmitter	Kode runtime untuk cek undefined
SchemaEmitter	Schema validasi

Jadi alurnya menjadi:

            TypeIR
               │
      ┌────────┼────────┐
      │        │        │
 Contract    Read     Form
  Render    Render    Render
      │        │        │
 api-contract api-read api-form

Bukan seperti sekarang:

Field
 ├── contract: TypeIR
 ├── read: TypeIR
 ├── form: TypeIR
 ├── mapper: TypeIR
 └── schema: TypeIR

Karena pada kenyataannya, sekitar 90% struktur TypeIR tersebut sama. Yang berubah hanya bagaimana emitter mengubah TypeIR menjadi kode.

Jadi benar, perbedaannya ada di strategi pembacaan/rendering, bukan pada data yang disimpan di IR. Itu juga membuat ContractIR menjadi lebih kecil dan lebih mudah dirawat karena hanya ada satu sumber kebenaran untuk tipe.

Kan generate 5 file terus nanti gimana tetep bisa generate kah?

Bisa, justru itu tujuan IR.

Yang berubah bukan jumlah file yang dihasilkan, tetapi cara emitter mendapatkan informasi.

Misalnya sekarang kamu punya:

Field
 ├── contract: TypeIR
 ├── read: TypeIR
 ├── form: TypeIR
 ├── mapper: TypeIR
 └── schema: TypeIR

Lalu emitter tinggal mengambil:

ContractEmitter -> field.type.contract
ReadEmitter     -> field.type.read
FormEmitter     -> field.type.form
...

Ini memang mudah, tetapi TypeIR yang sama disimpan berkali-kali.

Alternatifnya adalah menyimpan satu TypeIR:

Field
 └── type: TypeIR

Lalu setiap emitter mempunyai renderer sendiri.

Misalnya:

ContractEmitter
renderType(field.type)

ReadEmitter
renderType(field.type)

FormEmitter
renderType(field.type)

Yang berbeda hanyalah aturan render.

Contoh:

TypeIR:
optional(
    nullable(
        string
    )
)

ContractEmitter menghasilkan:

z.string().nullable().optional()

ReadEmitter menghasilkan:

string | null | undefined

FormEmitter bisa menghasilkan:

string | undefined

MapperEmitter mungkin menghasilkan kode runtime yang mengecek null.

Jadi satu TypeIR bisa menghasilkan lima output berbeda.

Kalau ada kasus yang memang benar-benar berbeda, misalnya form tidak boleh memakai readonly atau mapper membutuhkan informasi tambahan, kamu tidak perlu membuat enam TypeIR. Cukup tambahkan metadata kecil, misalnya:

field: {
    type: TypeIR,
    projection: {
        form: {
            treatNullableAsOptional: true
        }
    }
}

atau

renderType(type, Projection.Form)

Jadi tetap bisa menghasilkan 5 file:

ContractIR
        │
        ├── ContractEmitter → api-contract.ts
        ├── ReadEmitter     → api-read.ts
        ├── FormEmitter     → api-form.ts
        ├── MapperEmitter   → api-mapper.ts
        └── SchemaEmitter   → api-schema.ts

Perbedaannya adalah IR hanya menyimpan satu sumber kebenaran (TypeIR), sedangkan setiap emitter memproyeksikannya sesuai kebutuhannya. Ini biasanya lebih hemat memori, mengurangi duplikasi, dan membuat perubahan tipe di masa depan cukup dilakukan di satu tempat.

Jadi cuma ber eda cara menangani pembacaan nya doang?

Iya, tepat sekali.

Yang berbeda bukan datanya, tetapi cara emitter membaca data yang sama.

Misalnya IR menyimpan satu tipe:

User?

atau dalam TypeIR:

optional(
    reference(User)
)

Lalu masing-masing emitter menerjemahkannya sesuai kebutuhannya.

Emitter	Hasil
ContractEmitter	z.object(...).optional()
ReadEmitter	User | undefined
FormEmitter	User | undefined (atau aturan khusus form)
MapperEmitter	Kode runtime untuk cek undefined
SchemaEmitter	Schema validasi

Jadi alurnya menjadi:

            TypeIR
               │
      ┌────────┼────────┐
      │        │        │
 Contract    Read     Form
  Render    Render    Render
      │        │        │
 api-contract api-read api-form

Bukan seperti sekarang:

Field
 ├── contract: TypeIR
 ├── read: TypeIR
 ├── form: TypeIR
 ├── mapper: TypeIR
 └── schema: TypeIR

Karena pada kenyataannya, sekitar 90% struktur TypeIR tersebut sama. Yang berubah hanya bagaimana emitter mengubah TypeIR menjadi kode.

Jadi benar, perbedaannya ada di strategi pembacaan/rendering, bukan pada data yang disimpan di IR. Itu juga membuat ContractIR menjadi lebih kecil dan lebih mudah dirawat karena hanya ada satu sumber kebenaran untuk tipe.
