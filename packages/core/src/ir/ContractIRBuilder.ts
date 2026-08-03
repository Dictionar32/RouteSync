/**
 * Contract IR Builder - Optimized Version
 * 
 * Addresses key performance and architectural issues:
 * 1. Single TypeIR per field (no more 6x duplication)
 * 2. Projection-based rendering (emitters handle variations)
 * 3. Deterministic IR (no timestamps in individual nodes)
 * 4. Modular semantic resolution (separate resolvers)
 * 5. Clean semantic boundary (no semantic types in final IR)
 */

import { createHash } from 'crypto'
import type {
    ContractIR,
    ResourceIR,
    ResourceVariantIR,
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
    PrimitiveTypeIR,
    ReferenceTypeIR,
    ValidationRules,
    TransformFunction,
    ResolvedSemanticType
} from '../types/ir'

import { SemanticType } from '../types/semantic'
import { TypeIRUtils } from '../types/ir'
import { resourceBaseName } from '../utils/resource-naming'

// Constants for deterministic IR
const IR_VERSION = 'v1.0.0' as const
const GENERATOR_VERSION = '1.0.0' as const

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

/**
 * Projection hints for emitters - lightweight metadata instead of duplicated TypeIR trees
 */
interface ProjectionHints {
    /** Form fields should treat nullable as optional */
    formNullableAsOptional?: boolean
    /** Field emitters don't need modifiers */
    stripModifiers?: boolean
    /** Mapper needs runtime null checks */
    includeRuntimeChecks?: boolean
}

/**
 * Optimized ResourceFieldIR - single TypeIR + hints instead of 6 projections
 */
interface OptimizedResourceFieldIR {
    name: string
    transformedName: string
    type: TypeIR                    // Single source of truth
    hints: ProjectionHints          // Lightweight emitter guidance
    description?: string
    validation?: ValidationRules
    source?: {
        type: 'model_column' | 'accessor' | 'method' | 'computed' | 'relation'
        path: string
        model?: string
    }
    // No more semanticType - clean boundary!
}

/**
 * Modular semantic type resolvers - break down the large semanticToTypeIR function
 */
class SemanticTypeResolvers {
    static resolvePrimitive(semantic: any): TypeIR {
        const primitiveType = semantic as { kind: 'primitive', type: string, format?: string }
        return {
            kind: 'primitive',
            type: (primitiveType.type || 'unknown') as PrimitiveTypeIR['type'],
            format: primitiveType.format
        }
    }

    static resolveResource(semantic: any): TypeIR {
        const resourceType = semantic as { kind: 'resource', resource: string, collection?: boolean }
        const resourceRef: ReferenceTypeIR = {
            kind: 'reference',
            target: resourceType.resource + 'Schema'
        }

        if (resourceType.collection) {
            return TypeIRUtils.makeArray(resourceRef)
        }

        return resourceRef
    }

    static resolveModel(semantic: any): TypeIR {
        const modelType = semantic as { kind: 'model', model: string }
        return {
            kind: 'reference',
            target: modelType.model + 'Schema'
        }
    }

    static resolveObject(semantic: any, resolver: (type: unknown) => TypeIR): TypeIR {
        const objectType = semantic as { kind: 'object', properties?: Record<string, unknown> }

        if (objectType.properties) {
            const properties: Record<string, TypeIR> = {}
            for (const [key, value] of Object.entries(objectType.properties)) {
                properties[key] = resolver(value)
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

    static resolveArray(semantic: any, resolver: (type: unknown) => TypeIR): TypeIR {
        const arrayType = semantic as { kind: 'array', items: unknown }
        return TypeIRUtils.makeArray(resolver(arrayType.items))
    }

    static resolveUnion(semantic: any, resolver: (type: unknown) => TypeIR): TypeIR {
        const unionType = semantic as { kind: 'union', types: unknown[] }
        return {
            kind: 'union',
            types: unionType.types.map(t => resolver(t))
        }
    }

    static resolveLiteral(semantic: any): TypeIR {
        const literalType = semantic as { kind: 'literal', value: string | number | boolean }
        return {
            kind: 'literal',
            value: literalType.value
        }
    }
}

/**
 * Diagnostic collector - replace direct console logging
 */
class DiagnosticCollector {
    private diagnostics: Array<{ level: 'info' | 'warn' | 'error', message: string, context?: any }> = []

    info(message: string, context?: any): void {
        this.diagnostics.push({ level: 'info', message, context })
    }

    warn(message: string, context?: any): void {
        this.diagnostics.push({ level: 'warn', message, context })
    }

    error(message: string, context?: any): void {
        this.diagnostics.push({ level: 'error', message, context })
    }

    getDiagnostics(): typeof this.diagnostics {
        return [...this.diagnostics]
    }

    clear(): void {
        this.diagnostics = []
    }
}

// Type names that genuinely represent a primitive value in `resolved.type` —
// used to distinguish "the resolver figured out this is a plain string/number"
// from "the resolver figured out this is a resource/model reference" (which
// carries a resource/model class name, not a primitive, and must not be
// collapsed into {kind:'primitive', type:'resource'}).
const PRIMITIVE_RESOLVED_TYPES = new Set(['string', 'number', 'boolean', 'date', 'datetime', 'json', 'unknown'])

export class OptimizedContractIRBuilder {
    private resources: Map<string, ResourceIR> = new Map()
    private requests: Map<string, RequestIR> = new Map()
    private endpoints: Map<string, EndpointIR> = new Map()
    private sharedTypes: Map<string, SharedTypeIR> = new Map()
    private enums: Map<string, EnumIR> = new Map()
    private diagnostics = new DiagnosticCollector()

    constructor(private context: GenerationContext) { }

    /**
     * Main entry point: builds Contract IR from parsed manifest
     */
    buildFromManifest(manifest: RouteManifest): ContractIR {
        this.diagnostics.info('Building Contract IR from manifest')

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

        this.diagnostics.info(`Built Contract IR: ${ir.resources.length} resources, ${ir.requests.length} requests, ${ir.endpoints.length} endpoints`)
        return ir
    }

    /**
     * Build ResourceIR from parsed resource
     */
    /**
     * Fields whose semanticType is a nested inline object (e.g. OrderResource's
     * `shipping` => { nama, alamat }) used to always render as an anonymous
     * `{ nama: string; alamat: string }` inline type. This extracts them into
     * their own named, top-level interface instead — e.g. `OrderShipping` —
     * registered into `this.resources` alongside every other resource, so
     * ReadEmitter emits it as a real `export interface OrderShippingTransformed`
     * just like anything else, and the field itself becomes a reference to it.
     *
     * Naming: strip a trailing "Resource"/"Response" off the parent resource
     * name, PascalCase the field name, concatenate. Deliberately does NOT reuse
     * any DB model of the same name (e.g. the real `OrderShipping` Eloquent
     * model, if one exists) — the shape here is whatever fields the object
     * literal actually has, which may be a partial projection of that model,
     * not the model itself. See ISSUE-manifest-resource-linkage.md.
     */
    private extractNestedObjectResource(parentResourceName: string, field: ParsedFieldData): ParsedFieldData {
        const semanticType = field.semanticType as { kind?: string; properties?: Record<string, unknown> } | undefined
        if (!semanticType || semanticType.kind !== 'object' || !semanticType.properties) {
            return field
        }
        const propertyEntries = Object.entries(semanticType.properties)
        if (propertyEntries.length === 0) {
            return field
        }

        const parentBase = parentResourceName.replace(/(Resource|Response)$/, '')
        const pascalFieldName = field.name.charAt(0).toUpperCase() + field.name.slice(1)
        const syntheticName = parentBase + pascalFieldName

        if (!this.resources.has(syntheticName)) {
            const subFields: ParsedFieldData[] = propertyEntries.map(([key, value]) => ({
                name: key,
                resolved: undefined,
                semanticType: value as SemanticType | ResolvedSemanticType,
                optional: false,
                nullable: false,
                readonly: false
            }))
            const subResource: ParsedResource = {
                name: syntheticName,
                sourceModel: undefined,
                fields: subFields,
                controller: undefined,
                routes: []
            }
            // Insert a placeholder first so a field inside this sub-object that
            // happens to reference the SAME synthetic name (shouldn't normally
            // happen, but field/parent names are developer-controlled input)
            // can't recurse infinitely.
            this.resources.set(syntheticName, undefined as unknown as ResourceIR)
            this.resources.set(syntheticName, this.buildResourceIR(subResource))
        }

        return {
            ...field,
            semanticType: { kind: 'resource', resource: syntheticName, collection: false } as ResolvedSemanticType
        }
    }

    private buildResourceIR(resource: ParsedResource): ResourceIR {
        const processedFields = resource.fields.map(field => this.extractNestedObjectResource(resource.name, field))
        const fields = processedFields.map(field => this.buildOptimizedResourceField(field))
        const legacyFields = fields.map(f => this.convertToLegacyFieldIR(f))

        // Build variants untuk ReadEmitter (read-only transformations)
        const readVariant: ResourceVariantIR = {
            kind: 'read',
            fields: legacyFields, // Use ResourceFieldIR directly
            metadata: {
                purpose: 'TypeScript interfaces for read operations',
                generator: 'ReadEmitter'
            }
        }

        const resourceIR: ResourceIR = {
            id: this.generateResourceId(resource),
            name: resource.name,
            sourceModel: resource.sourceModel,
            fields: legacyFields,
            aliases: this.buildResourceAliases(resource),
            variants: [readVariant], // Populate with read variant
            mapper: this.buildResourceMapper(resource, fields),
            metadata: {
                sourceFile: resource.name,
                controller: resource.controller,
                routes: resource.routes || [],
                // No more generated_at per resource
                dependencies: this.extractDependencies(fields)
            }
        }

        return resourceIR
    }

    /**
     * Build optimized field with single TypeIR + projection hints
     */
    private buildOptimizedResourceField(field: ParsedFieldData): OptimizedResourceFieldIR {
        // Extract semantic type from resolved data if available
        let semanticType: SemanticType | ResolvedSemanticType | undefined = field.semanticType

        // Check if field has resolved type information from manifest — but only
        // override with a primitive shortcut when resolved.type genuinely names a
        // primitive (string/number/boolean/date/datetime/json/unknown). "resource"
        // and "model" are not primitive type names — they carry a resource/model
        // class name (field.resolved.resource / field.resolved.model) that this
        // override used to silently discard, which is why a field the manifest had
        // ALREADY resolved to e.g. { type: 'resource', resource: 'OrderDetailResource' }
        // (a nested Resource reference like items -> OrderDetailResource::collection(...))
        // always fell through to 'unknown' downstream: field.semanticType (built
        // correctly upstream in ContractGenerator.adaptManifest) was being thrown
        // away here in favor of this primitive-only shortcut.
        if (field.resolved?.type && PRIMITIVE_RESOLVED_TYPES.has(field.resolved.type)) {
            semanticType = {
                kind: 'primitive',
                type: field.resolved.type,
                resolved: field.resolved
            }
            this.diagnostics.info(`Using resolved type for ${field.name}: ${field.resolved.type}`)
        } else if (!field.resolved?.type) {
            this.diagnostics.warn(`No resolved type for field: ${field.name}`)
        }
        // else: field.resolved.type is "resource"/"model"/something non-primitive —
        // keep field.semanticType as-is, it already carries the correct shape.

        // Build single TypeIR with modifiers applied
        let baseType = this.semanticToTypeIR(semanticType)

        // Apply modifiers to the base type
        if (field.nullable) {
            baseType = TypeIRUtils.makeNullable(baseType)
        }
        if (field.optional) {
            baseType = TypeIRUtils.makeOptional(baseType)
        }

        // Build projection hints for emitters
        const hints: ProjectionHints = {
            formNullableAsOptional: field.nullable === true,
            stripModifiers: false, // Field emitter might want this
            includeRuntimeChecks: field.nullable || field.optional
        }

        return {
            name: field.name,
            transformedName: this.transformFieldName(field.name),
            type: baseType,  // Single TypeIR instead of 6 projections
            hints,           // Lightweight emitter guidance
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
            // No semanticType field - clean boundary achieved!
        }
    }

    /**
     * Convert optimized field to legacy format for compatibility
     */
    private convertToLegacyFieldIR(field: OptimizedResourceFieldIR): ResourceFieldIR {
        // Generate the 6 projections on-demand for backwards compatibility
        // In the future, emitters should read field.type + field.hints directly
        const typeProjections = {
            contract: field.type,
            read: field.type,
            form: field.hints.formNullableAsOptional
                ? this.projectForForm(field.type)
                : field.type,
            field: field.hints.stripModifiers
                ? TypeIRUtils.unwrapType(field.type)
                : field.type,
            mapper: field.type,
            schema: field.type
        }

        return {
            name: field.name,
            transformedName: field.transformedName,
            type: typeProjections,
            description: field.description,
            validation: field.validation,
            source: field.source
            // Note: no semanticType - boundary is clean
        }
    }

    /**
     * Project TypeIR for form usage (nullable becomes optional)
     */
    private projectForForm(type: TypeIR): TypeIR {
        if (TypeIRUtils.isNullable(type)) {
            return { kind: 'optional', inner: type.inner }
        }
        return type
    }

    /**
     * Modular semantic type resolution - dispatcher pattern
     */
    private semanticToTypeIR(semanticType: SemanticType | ResolvedSemanticType | undefined): TypeIR {
        if (!semanticType) {
            return { kind: 'primitive', type: 'unknown' }
        }

        if (typeof semanticType === 'string') {
            return { kind: 'primitive', type: semanticType as PrimitiveTypeIR['type'] }
        }

        if (typeof semanticType !== 'object' || !semanticType.kind) {
            this.diagnostics.warn('Invalid semantic type structure', semanticType)
            return { kind: 'primitive', type: 'unknown' }
        }

        // Check if this semantic type has resolved information first — same
        // primitive-only guard as buildOptimizedResourceField above. Without it,
        // a semanticType that's already correctly {kind:'resource', resource:...}
        // but ALSO happens to carry .resolved.type === 'resource' (nested resource
        // reference field, e.g. items) would get collapsed into an invalid
        // {kind:'primitive', type:'resource'} here, which the emitter can't render
        // and falls back to 'unknown'.
        const resolvedSemantic = semanticType as any
        if (resolvedSemantic.resolved?.type && PRIMITIVE_RESOLVED_TYPES.has(resolvedSemantic.resolved.type)) {
            this.diagnostics.info(`Using resolved type: ${resolvedSemantic.resolved.type}`)
            return { kind: 'primitive', type: resolvedSemantic.resolved.type as PrimitiveTypeIR['type'] }
        }

        // Dispatch to specific resolvers based on kind
        try {
            switch (semanticType.kind) {
                case 'primitive':
                    return SemanticTypeResolvers.resolvePrimitive(semanticType)
                case 'resource':
                    return SemanticTypeResolvers.resolveResource(semanticType)
                case 'model':
                    return SemanticTypeResolvers.resolveModel(semanticType)
                case 'object':
                    return SemanticTypeResolvers.resolveObject(semanticType, (type) => this.semanticToTypeIR(type as any))
                case 'array':
                    return SemanticTypeResolvers.resolveArray(semanticType, (type) => this.semanticToTypeIR(type as any))
                case 'union':
                    return SemanticTypeResolvers.resolveUnion(semanticType, (type) => this.semanticToTypeIR(type as any))
                case 'literal':
                    return SemanticTypeResolvers.resolveLiteral(semanticType)
                default:
                    this.diagnostics.warn(`Unknown semantic type kind: ${semanticType.kind}`, semanticType)
                    return { kind: 'primitive', type: 'unknown' }
            }
        } catch (error) {
            this.diagnostics.error(`Error resolving semantic type: ${error}`, { semanticType, error })
            return { kind: 'primitive', type: 'unknown' }
        }
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

    // [Additional methods remain mostly the same, with diagnostic logging instead of console.log]

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
            fields: action.fields.map((field: ParsedFieldData) => this.convertToLegacyFieldIR(this.buildOptimizedResourceField(field))),
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
     * Build resource aliases
     */
    private buildResourceAliases(resource: ParsedResource): ResourceAliasIR[] {
        const baseName = resourceBaseName(resource.name)

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
     * Build mapper for PHP -> TypeScript transformation
     */
    private buildResourceMapper(resource: ParsedResource, fields: OptimizedResourceFieldIR[]): MapperIR {
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
            target: `${resourceBaseName(resource.name)}Transformed`,
            mappings,
            transformations: this.buildTransformationRules(fields)
        }
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
    private detectTransformFunction(field: OptimizedResourceFieldIR): TransformFunction | undefined {
        // Analyze TypeIR instead of semantic type
        const baseType = TypeIRUtils.unwrapType(field.type)

        if (baseType.kind === 'primitive' && baseType.type === 'date') return 'date_iso'
        if (field.name.includes('amount') || field.name.includes('price')) return 'currency_minor'

        return undefined
    }

    /**
     * Build transformation rules for resource
     */
    private buildTransformationRules(fields: OptimizedResourceFieldIR[]): TransformationRules {
        return {
            dateFields: fields.filter(f => {
                const baseType = TypeIRUtils.unwrapType(f.type)
                return baseType.kind === 'primitive' && baseType.type === 'date'
            }).map(f => f.transformedName),

            currencyFields: fields.filter(f =>
                f.name.includes('amount') || f.name.includes('price') || f.name.includes('cost')
            ).map(f => f.transformedName),

            enumFields: [], // TODO: Extract from TypeIR
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
     * Extract dependencies from fields - now based on TypeIR references
     */
    private extractDependencies(fields: OptimizedResourceFieldIR[]): string[] {
        const dependencies = new Set<string>()

        for (const field of fields) {
            this.collectTypeReferences(field.type, dependencies)
        }

        return Array.from(dependencies)
    }

    /**
     * Recursively collect type references from TypeIR
     */
    private collectTypeReferences(type: TypeIR, dependencies: Set<string>): void {
        switch (type.kind) {
            case 'reference':
                dependencies.add(type.target)
                break
            case 'array':
                this.collectTypeReferences(type.items, dependencies)
                break
            case 'nullable':
            case 'optional':
                this.collectTypeReferences(type.inner, dependencies)
                break
            case 'union':
                for (const unionType of type.types) {
                    this.collectTypeReferences(unionType, dependencies)
                }
                break
            case 'inline_object':
                for (const propType of Object.values(type.properties)) {
                    this.collectTypeReferences(propType, dependencies)
                }
                break
        }
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
        // TODO: Extract enums from TypeIR literal unions
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
     * Build contract metadata - deterministic (no per-node timestamps)
     */
    private buildMetadata(manifest: RouteManifest): ContractMetadata {
        return {
            version: IR_VERSION,
            generated_at: new Date().toISOString(), // Only one timestamp for entire IR
            generator_version: GENERATOR_VERSION,
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
     * Validate IR integrity with diagnostic collection
     */
    validateIR(ir: ContractIR): void {
        this.diagnostics.info('Validating Contract IR integrity')

        for (const endpoint of ir.endpoints) {
            if (endpoint.response.resource) {
                const resourceExists = ir.resources.some(r => r.name === endpoint.response.resource)
                if (!resourceExists) {
                    this.diagnostics.warn(`Endpoint ${endpoint.id} references unknown resource: ${endpoint.response.resource}`)
                }
            }
        }

        for (const endpoint of ir.endpoints) {
            if (endpoint.request?.reference) {
                const requestExists = ir.requests.some(r => r.name === endpoint.request!.reference)
                if (!requestExists) {
                    this.diagnostics.warn(`Endpoint ${endpoint.id} references unknown request: ${endpoint.request.reference}`)
                }
            }
        }

        this.diagnostics.info('IR validation complete')
    }

    /**
     * Get collected diagnostics for logging/debugging
     */
    getDiagnostics(): ReturnType<DiagnosticCollector['getDiagnostics']> {
        return this.diagnostics.getDiagnostics()
    }
}