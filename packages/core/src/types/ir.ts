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

    // Same rationale as ResourceFieldIR.semanticType (see below): `resolved` above
    // can only carry a flat SemanticType tag + model name, not enough to represent
    // resource/object/array/union kinds. ContractIRBuilder needs the richer object
    // form for those, so adaptManifest() sets this directly for non-primitive fields.
    semanticType?: SemanticType | ResolvedSemanticType
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
}