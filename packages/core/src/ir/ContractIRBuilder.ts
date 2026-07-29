/**
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