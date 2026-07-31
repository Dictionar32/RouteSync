/**
 * Manifest Enrichment Utilities
 *
 * Fixes missing Resources & Models data in manifest:
 * - Infers resources dari route response metadata
 * - Generates model definitions dari response shapes
 * - Creates type relationships dan dependencies
 *
 * Type-safe implementation using discriminated unions dan type predicates
 * without any 'as any' casts.
 */

import {
    RouteManifest,
    ParsedRoute,
    ParsedResource,
    ParsedModel,
    ResponseMetadata,
    ResourceFieldKind,
    ActionDefinition
} from '../../../../../core/src/types/route'
import { IdentifierSanitizer } from './identifier-sanitizer'
import { isRulesMap } from '../../../../../core/src/utils/type-guards'
import { resourceBaseName } from '../../../../../core/src/utils/resource-naming'
import { deriveGroupName } from '../../route-classifier'
import { toTypeName } from '../../names'

/**
 * Type predicates for safe discriminated union handling
 */

/** Check if response is 'object' kind with fields */
function isObjectResponse(response: ResponseMetadata): response is Extract<ResponseMetadata, { kind: 'object' }> {
    return response.kind === 'object'
}

/** Check if response is 'model' kind */
function isModelResponse(response: ResponseMetadata): response is Extract<ResponseMetadata, { kind: 'model' }> {
    return response.kind === 'model'
}

/** Check if response is 'resource' kind */
function isResourceResponse(response: ResponseMetadata): response is Extract<ResponseMetadata, { kind: 'resource' }> {
    return response.kind === 'resource'
}

/** Check if response has resolved semantic data */
function hasResolvedSemantic(response: ResponseMetadata): response is ResponseMetadata & { resolved: NonNullable<ResponseMetadata['resolved']> } {
    return response.resolved !== null && response.resolved !== undefined
}

/** Check if field is object kind */
function isObjectField(field: ResourceFieldKind): field is Extract<ResourceFieldKind, { kind: 'object' }> {
    return field.kind === 'object'
}

/** Check if field is primitive kind */
function isPrimitiveField(field: ResourceFieldKind): field is Extract<ResourceFieldKind, { kind: 'primitive' }> {
    return field.kind === 'primitive'
}

/** Check if field is model kind */
function isModelField(field: ResourceFieldKind): field is Extract<ResourceFieldKind, { kind: 'model' }> {
    return field.kind === 'model'
}

/** Check if field is resource kind */
function isResourceField(field: ResourceFieldKind): field is Extract<ResourceFieldKind, { kind: 'resource' }> {
    return field.kind === 'resource'
}

/**
 * Type definitions for enrichment process
 */

export interface EnrichedManifest extends RouteManifest {
    enrichmentMetadata: EnrichmentMetadata
}

export interface ResourceDefinition {
    name: string
    sanitizedName: string
    baseModel?: string
    endpoints: string[]
    actions: ActionDefinition[]
    collectedFields?: Record<string, ResourceFieldMetadata>
}

export interface ModelDefinition {
    name: string
    sanitizedName: string
    table: string
    columns: ColumnDefinition[]
    source: 'inferred' | 'explicit'
}

export interface ColumnDefinition {
    name: string
    type: string
    nullable: boolean
}

export interface ResourceFieldMetadata {
    name: string
    type: string
    required: boolean
    rule?: string
    validation?: string
}

export interface EnrichmentMetadata {
    resourcesFound: number
    modelsInferred: number
    fieldsExtracted: number
    enrichmentTime: number
    warnings: string[]
}

/**
 * Main enrichment class with discriminated union handling
 */
export class ManifestEnricher {
    static enrich(manifest: RouteManifest): EnrichedManifest {
        // Idempotency guard: generate-v2.ts enriches the manifest before calling
        // ContractGenerator.generate(), which enriches it again internally (so it
        // also works when called directly with a raw manifest). Without this guard,
        // a manifest that already went through enrich() gets run through it a
        // second time — re-deriving the same inferred resources/fields from the
        // same routes, which produces a slightly different result than pass 1 in
        // some cases (e.g. a field's type or nullability being computed against
        // already-enriched — not raw — resources) and silently uses the pass-2
        // version everywhere downstream.
        const alreadyEnriched = (manifest as Partial<EnrichedManifest>).enrichmentMetadata
        if (alreadyEnriched) {
            return manifest as EnrichedManifest
        }

        const startTime = performance.now()
        const warnings: string[] = []

        console.log('🔍 Enriching manifest with missing Resources & Models...')

        // Step 1: Extract resources dari route responses
        const resourcesMap = this.extractResources(manifest, warnings)

        // Step 2: Infer models dari routes dan resources
        const modelsMap = this.inferModels(manifest, resourcesMap, warnings)

        // Step 3: Build action definitions per resource
        this.buildActionDefinitions(manifest, resourcesMap, warnings)

        // Step 4: Extract dan populate fields untuk setiap resource
        this.populateResourceFields(manifest, resourcesMap, warnings)

        const enrichmentTime = performance.now() - startTime
        const resourceDefinitions = Array.from(resourcesMap.values())
        const authoredModelNames = new Set((manifest.models || []).map((m) => m.name))
        const modelDefinitions = Array.from(modelsMap.values()).filter(
            (md) => !authoredModelNames.has(md.name)
        )

        // Auto-inferred resources should only fill gaps — a resource already
        // hand-authored in manifest.resources is more complete/curated (it went
        // through the parser's own field resolution) than what extractResources()
        // can re-derive purely from route.response metadata. Without this filter,
        // every route referencing an already-authored resource re-adds a poorer
        // duplicate, and whichever one lands last in the merged array silently
        // wins downstream in ContractIRBuilder.
        // Compare by base name (Resource suffix stripped), not raw name — an
        // authored "OrderResource" and an inferred "Order" resolve to the same
        // final interface name (resourceBaseName() strips "Resource" from both
        // at emit time), so raw-name comparison here never caught the collision
        // and both copies survived into the merged array.
        const authoredResourceBaseNames = new Set(
            (manifest.resources || []).map((r) => resourceBaseName(r.name))
        )
        const newlyInferredResources = resourceDefinitions.filter(
            (rd) => !authoredResourceBaseNames.has(resourceBaseName(rd.name))
        )

        // Convert to RouteManifest compatible format
        const parsedResources = newlyInferredResources.map(
            (rd): ParsedResource => {
                const collectedFields = rd.collectedFields
                let fields: Record<string, ResourceFieldKind> = {}

                // Prefer the raw ResourceFieldKind straight off the route response —
                // it preserves nested 'object' fields, .resolved.type, and .nullable.
                // collectedFields (built by populateResourceFields) only ever kept a
                // bare type-name string per top-level field, discarding all of that,
                // but it was being read first whenever it was non-empty — which was
                // almost always, since populateResourceFields runs unconditionally —
                // so this richer raw path was essentially dead code before.
                for (const routeId of rd.endpoints) {
                    const route = (manifest.routes || []).find(
                        (r) => (r.name || `${r.method}_${r.path}`) === routeId
                    )

                    if (route?.response && isObjectResponse(route.response)) {
                        const schemaFields = this.extractFieldsFromResponse(route.response)
                        Object.assign(fields, schemaFields)
                    }
                }

                // Fallback: resources backed by a 'model'/'resource' kind response
                // (no raw .fields to walk directly) still need the flattened metadata.
                if (Object.keys(fields).length === 0 && collectedFields && Object.keys(collectedFields).length > 0) {
                    fields = this.convertMetadataToResourceFields(collectedFields)
                }

                // Use populated fields atau fallback ke default
                const finalFields =
                    Object.keys(fields).length > 0
                        ? fields
                        : this.generateDefaultResourceFields(rd.baseModel)

                return {
                    name: rd.name,
                    sanitizedName: rd.sanitizedName,
                    baseModel: rd.baseModel,
                    actions: rd.actions,
                    endpoints: rd.endpoints,
                    fields: finalFields,
                    sourceFile: null,
                    sourceLine: null
                }
            }
        )

        const parsedModels = modelDefinitions.map(
            (md): ParsedModel => ({
                name: md.name,
                table: md.table,
                columns: md.columns.map((col) => ({
                    name: col.name,
                    type: col.type,
                    nullable: col.nullable
                }))
            })
        )

        console.log(`✅ Manifest enriched in ${enrichmentTime.toFixed(2)}ms:`)
        console.log(`   - Resources: ${resourceDefinitions.length}`)
        console.log(`   - Models: ${modelDefinitions.length}`)
        console.log(`   - Warnings: ${warnings.length}`)

        return {
            ...manifest,
            resources: [...(manifest.resources || []), ...parsedResources],
            models: [...(manifest.models || []), ...parsedModels],
            enrichmentMetadata: {
                resourcesFound: resourceDefinitions.length,
                modelsInferred: modelDefinitions.length,
                fieldsExtracted: modelDefinitions.reduce(
                    (sum, model) => sum + model.columns.length,
                    0
                ),
                enrichmentTime,
                warnings
            }
        }
    }

    /**
     * Convert ResourceFieldMetadata to ResourceFieldKind using discriminated union
     */
    private static convertMetadataToResourceFields(
        metadata: Record<string, ResourceFieldMetadata>
    ): Record<string, ResourceFieldKind> {
        const fields: Record<string, ResourceFieldKind> = {}

        for (const [fieldName, fieldMeta] of Object.entries(metadata)) {
            const fieldKind: Extract<ResourceFieldKind, { kind: 'primitive' }> = {
                kind: 'primitive',
                type: fieldMeta.type || 'unknown'
            }

            fields[fieldName] = fieldKind
        }

        return fields
    }

    /**
     * Extract resource name from response using type guard
     */
    private static getResourceNameFromResponse(
        response: ResponseMetadata
    ): string | null {
        if (isResourceResponse(response)) {
            return response.resource
        }

        if (isModelResponse(response)) {
            return response.model
        }

        if (hasResolvedSemantic(response) && response.resolved.type) {
            return response.resolved.type
        }

        return null
    }

    /**
     * Extract fields from object response using discriminated union
     */
    private static extractFieldsFromResponse(
        response: Extract<ResponseMetadata, { kind: 'object' }>
    ): Record<string, ResourceFieldKind> {
        const fields: Record<string, ResourceFieldKind> = {}

        for (const [fieldName, fieldData] of Object.entries(response.fields)) {
            fields[fieldName] = fieldData
        }

        return fields
    }

    /**
     * Extract base model name from resource name
     */
    private static extractBaseModelName(resourceName: string): string {
        // Remove "Resource" suffix jika ada
        if (resourceName.endsWith('Resource')) {
            return resourceName.slice(0, -8) // Remove "Resource"
        }

        // Remove "Response" suffix jika ada
        if (resourceName.endsWith('Response')) {
            return resourceName.slice(0, -8) // Remove "Response"
        }

        return resourceName
    }

    /**
     * Infer table name from model name
     */
    private static inferTableName(modelName: string): string {
        return (
            modelName
                .replace(/([A-Z])/g, '_$1')
                .toLowerCase()
                .replace(/^_/, '') + 's'
        )
    }

    /**
     * Extract resources dari route responses
     */
    private static extractResources(
        manifest: RouteManifest,
        warnings: string[]
    ): Map<string, ResourceDefinition> {
        const resourcesMap = new Map<string, ResourceDefinition>()

        for (const route of manifest.routes || []) {
            if (!route.response) continue

            // Extract resource name dari response metadata
            let resourceName = this.getResourceNameFromResponse(route.response)

            // Fallback: an 'object'-kind response (a raw response()->json([...]) array
            // literal in the controller — not backed by a Model or JsonResource class)
            // has no name in the manifest at all. The old ZodTierGenerator only ever
            // synthesized a name for these on GET routes, deriving it from the URL path
            // (deriveGroupName + toTypeName) — e.g. GET /categories -> "Categories",
            // GET /oauth/{provider}/redirect -> "OauthRedirect". Non-GET object routes
            // (login, logout, cart.delete, wishlist.post, ...) intentionally stay
            // unnamed here, same as before — they're per-action ack/error shapes that
            // were never meant to get a shared exported type.
            if (
                !resourceName &&
                route.method?.toUpperCase() === 'GET' &&
                isObjectResponse(route.response) &&
                Object.keys(route.response.fields || {}).length > 0
            ) {
                resourceName = toTypeName(deriveGroupName(route.path))
            }

            if (!resourceName) continue

            const sanitizedName = IdentifierSanitizer.toPascalCase(resourceName)

            if (!IdentifierSanitizer.isValidIdentifier(sanitizedName)) {
                warnings.push(
                    `Invalid resource identifier: ${resourceName} → ${sanitizedName}`
                )
                continue
            }

            // Get atau create resource definition
            let resource = resourcesMap.get(resourceName)
            if (!resource) {
                resource = {
                    name: resourceName,
                    sanitizedName,
                    baseModel: this.extractBaseModelName(resourceName),
                    endpoints: [],
                    actions: []
                }
                resourcesMap.set(resourceName, resource)
            }

            // Add route ke resource
            const routeId = route.name || `${route.method}_${route.path}`
            if (!resource.endpoints.includes(routeId)) {
                resource.endpoints.push(routeId)
            }
        }

        return resourcesMap
    }

    /**
     * Infer models dari resources dan routes
     */
    private static inferModels(
        manifest: RouteManifest,
        resourcesMap: Map<string, ResourceDefinition>,
        _warnings: string[]
    ): Map<string, ModelDefinition> {
        const modelsMap = new Map<string, ModelDefinition>()

        // Infer dari resources
        for (const resource of resourcesMap.values()) {
            const isBackedByRealModel =
                !resource.name.endsWith('Response') &&
                resource.endpoints.some((routeId) => {
                    const route = (manifest.routes || []).find(
                        (r) => (r.name || `${r.method}_${r.path}`) === routeId
                    )
                    const kind = route?.response?.kind
                    return kind === 'model' || kind === 'resource'
                })
            if (!isBackedByRealModel) continue

            if (resource.baseModel) {
                const modelName = resource.baseModel
                const sanitizedName = IdentifierSanitizer.toPascalCase(modelName)

                if (!modelsMap.has(modelName)) {
                    modelsMap.set(modelName, {
                        name: modelName,
                        sanitizedName,
                        table: this.inferTableName(modelName),
                        columns: this.inferColumnsFromResource(
                            manifest,
                            resource
                        ),
                        source: 'inferred'
                    })
                }
            }
        }

        return modelsMap
    }

    /**
     * Infer columns dari resource endpoints using type-safe discriminated unions
     */
    private static inferColumnsFromResource(
        manifest: RouteManifest,
        resource: ResourceDefinition
    ): ColumnDefinition[] {
        const columns: ColumnDefinition[] = []
        const processedNames = new Set<string>()

        // Priority 1: Extract fields dari response metadata (most accurate)
        for (const routeId of resource.endpoints) {
            const route = (manifest.routes || []).find(
                (r) => (r.name || `${r.method}_${r.path}`) === routeId
            )

            if (route?.response && isObjectResponse(route.response)) {
                // Safe extraction using type guard
                for (const [fieldName, fieldData] of Object.entries(
                    route.response.fields
                )) {
                    if (processedNames.has(fieldName)) continue
                    processedNames.add(fieldName)

                    // Extract type dengan discriminated union check
                    let fieldType = 'string'
                    if (isPrimitiveField(fieldData)) {
                        fieldType = fieldData.type
                    } else if (isModelField(fieldData)) {
                        fieldType = fieldData.model
                    } else if (isResourceField(fieldData)) {
                        fieldType = fieldData.resource
                    } else if (isObjectField(fieldData)) {
                        fieldType = 'object'
                    }

                    columns.push({
                        name: fieldName,
                        type: fieldType,
                        nullable: !isPrimitiveField(fieldData)
                    })
                }
            }
        }

        // Add default columns jika masih tidak ada
        if (columns.length === 0) {
            columns.push(
                {
                    name: 'id',
                    type: 'bigint',
                    nullable: false
                },
                {
                    name: 'created_at',
                    type: 'timestamp',
                    nullable: true
                },
                {
                    name: 'updated_at',
                    type: 'timestamp',
                    nullable: true
                }
            )
        }

        return columns
    }

    /**
     * Build action definitions per resource
     */
    private static buildActionDefinitions(
        manifest: RouteManifest,
        resourcesMap: Map<string, ResourceDefinition>,
        _warnings: string[]
    ): void {
        for (const resource of resourcesMap.values()) {
            const actionsMap = new Map<string, ActionDefinition>()

            // Group routes by action
            for (const routeId of resource.endpoints) {
                const route = (manifest.routes || []).find(
                    (r) => (r.name || `${r.method}_${r.path}`) === routeId
                )
                if (!route) continue

                const actionName = this.mapMethodToAction(route.method, route.path)

                let action = actionsMap.get(actionName)
                if (!action) {
                    action = {
                        name: actionName,
                        method: route.method,
                        hasBody: ['POST', 'PUT', 'PATCH'].includes(route.method),
                        hasResponse: true,
                        routes: []
                    }
                    actionsMap.set(actionName, action)
                }

                action.routes.push(routeId)
            }

            resource.actions = Array.from(actionsMap.values())
        }
    }

    /**
     * Map HTTP method to CRUD action
     */
    private static mapMethodToAction(method: string, path: string): string {
        const hasParam = path.includes('{') || path.includes(':')

        switch (method.toUpperCase()) {
            case 'GET':
                return hasParam ? 'show' : 'index'
            case 'POST':
                return 'create'
            case 'PUT':
            case 'PATCH':
                return 'update'
            case 'DELETE':
                return 'destroy'
            default:
                return method.toLowerCase()
        }
    }

    /**
     * Extract fields dari validation rules
     */
    private static extractFieldsFromSchema(
        rules: Record<string, unknown>
    ): Record<string, ResourceFieldMetadata> {
        const fields: Record<string, ResourceFieldMetadata> = {}

        for (const [fieldName, rule] of Object.entries(rules)) {
            const ruleString = Array.isArray(rule) ? rule.join('|') : String(rule)
            const sanitizedName = IdentifierSanitizer.toCamelCase(fieldName)
            const isRequired = ruleString.includes('required')

            fields[sanitizedName] = {
                name: sanitizedName,
                type: this.inferTypeFromRule(ruleString),
                required: isRequired,
                rule: ruleString,
                validation: this.buildValidation(ruleString)
            }
        }

        return fields
    }

    /**
     * Infer type dari Laravel validation rule
     */
    private static inferTypeFromRule(rule: string): string {
        const ruleLower = rule.toLowerCase()

        if (ruleLower.includes('email')) {
            return 'string'
        }

        if (ruleLower.includes('integer') || ruleLower.includes('numeric')) {
            return 'number'
        }

        if (ruleLower.includes('boolean')) {
            return 'boolean'
        }

        if (ruleLower.includes('array')) {
            return 'array'
        }

        if (ruleLower.includes('date')) {
            return 'string'
        }

        if (ruleLower.includes('json')) {
            return 'object'
        }

        return 'string'
    }

    /**
     * Build validation rules untuk Zod
     */
    private static buildValidation(rule: string): string {
        const ruleLower = rule.toLowerCase()
        const parts: string[] = []

        // Email validation
        if (ruleLower.includes('email')) {
            parts.push('email()')
        }

        // Max length validation
        const maxMatch = rule.match(/max[:|=_]*(\d+)/i)
        if (maxMatch) {
            parts.push(`max(${maxMatch[1]})`)
        }

        // Min length validation
        const minMatch = rule.match(/min[:|=_]*(\d+)/i)
        if (minMatch) {
            parts.push(`min(${minMatch[1]})`)
        }

        // Integer validation
        if (ruleLower.includes('integer')) {
            parts.push('int()')
        }

        return parts.length > 0 ? parts.join('.') : 'nonempty()'
    }

    /**
     * Generate default resource fields
     */
    private static generateDefaultResourceFields(
        _baseModel?: string
    ): Record<string, ResourceFieldKind> {
        return {
            id: {
                kind: 'primitive',
                type: 'number'
            },
            createdAt: {
                kind: 'primitive',
                type: 'string'
            },
            updatedAt: {
                kind: 'primitive',
                type: 'string'
            }
        }
    }

    /**
     * Populate resource fields dari manifest routes using discriminated union
     */
    private static populateResourceFields(
        manifest: RouteManifest,
        resourcesMap: Map<string, ResourceDefinition>,
        _warnings: string[]
    ): void {
        for (const resource of resourcesMap.values()) {
            const fieldsMap = new Map<string, ResourceFieldMetadata>()

            // Priority 1: Collect fields dari response metadata (most accurate)
            for (const routeId of resource.endpoints) {
                const route = (manifest.routes || []).find(
                    (r) => (r.name || `${r.method}_${r.path}`) === routeId
                )

                if (route?.response && isObjectResponse(route.response)) {
                    // Safe extraction dengan discriminated union
                    for (const [fieldName, fieldData] of Object.entries(
                        route.response.fields
                    )) {
                        if (!fieldsMap.has(fieldName)) {
                            const sanitizedName = IdentifierSanitizer.toCamelCase(fieldName)

                            // Determine type safely using type guards
                            let fieldType = 'string'
                            if (isPrimitiveField(fieldData)) {
                                fieldType = fieldData.type
                            } else if (isModelField(fieldData)) {
                                fieldType = fieldData.model
                            } else if (isResourceField(fieldData)) {
                                fieldType = fieldData.resource
                            } else if (isObjectField(fieldData)) {
                                fieldType = 'object'
                            }

                            fieldsMap.set(fieldName, {
                                name: sanitizedName,
                                type: fieldType,
                                required: true
                            })
                        }
                    }
                }
            }

            // Priority 2: Fallback to schema rules if no response fields
            if (fieldsMap.size === 0) {
                for (const routeId of resource.endpoints) {
                    const route = (manifest.routes || []).find(
                        (r) => (r.name || `${r.method}_${r.path}`) === routeId
                    )

                    // Try to extract schema rules using type-safe pattern
                    if (route && route.schema !== null && route.schema !== undefined && typeof route.schema === 'object' && !Array.isArray(route.schema)) {
                        // route.schema may be a wrapper `{ rules: {...} }` (Laravel FormRequest
                        // shape from the manifest) or already a flat rules map. Narrow via
                        // isRulesMap instead of assuming the wrapper shape, so a nested
                        // object never gets misread as a single field.
                        const nestedRules: unknown = route.schema.rules
                        const rulesSource: Record<string, unknown> = isRulesMap(nestedRules)
                            ? nestedRules
                            : route.schema

                        const schemaRules: Record<string, unknown> = {}
                        for (const [key, value] of Object.entries(rulesSource)) {
                            schemaRules[key] = value
                        }

                        const fields = this.extractFieldsFromSchema(schemaRules)

                        // Safely iterate field entries without casting
                        for (const [key, val] of Object.entries(fields)) {
                            if (!fieldsMap.has(key)) {
                                fieldsMap.set(key, val)
                            }
                        }
                    }
                }
            }

            // Assign collected fields back to resource
            resource.collectedFields = Object.fromEntries(fieldsMap)
        }
    }

    /**
     * Test function untuk validate enrichment process
     */
    static test(manifest: RouteManifest): void {
        console.log('🧪 Testing Manifest Enrichment...')
        console.log('='.repeat(40))

        const enriched = this.enrich(manifest)

        console.log('📊 Enrichment Results:')
        console.log(`   Original routes: ${manifest.routes?.length || 0}`)
        console.log(`   Original resources: ${manifest.resources?.length || 0}`)
        console.log(`   Original models: ${manifest.models?.length || 0}`)
        console.log('')
        console.log(`   Enriched resources: ${enriched.resources?.length || 0}`)
        console.log(`   Enriched models: ${enriched.models?.length || 0}`)
        console.log(
            `   Total fields: ${enriched.enrichmentMetadata.fieldsExtracted}`
        )
        console.log(
            `   Warnings: ${enriched.enrichmentMetadata.warnings.length}`
        )

        if (enriched.enrichmentMetadata.warnings.length > 0) {
            console.log('\n⚠️  Warnings:')
            enriched.enrichmentMetadata.warnings.forEach((warning) =>
                console.log(`   - ${warning}`)
            )
        }

        console.log('\n📦 Resources found:')
        enriched.resources?.forEach((resource) => {
            console.log(`   - ${resource.name} (${resource.sanitizedName || 'N/A'})`)
            console.log(`     Base model: ${resource.baseModel || 'none'}`)
            console.log(
                `     Actions: ${resource.actions?.map((a) => a.name).join(', ') || 'none'}`
            )
            console.log(`     Endpoints: ${resource.endpoints?.length || 0}`)
        })

        console.log('\n🏗️  Models inferred:')
        enriched.models?.forEach((model) => {
            console.log(`   - ${model.name}`)
            console.log(`     Table: ${model.table}`)
            console.log(`     Columns: ${model.columns?.length || 0}`)
        })

        console.log('\n✅ Enrichment test completed!')
    }
}