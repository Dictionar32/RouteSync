/**
 * utils/manifest-to-types.ts
 *
 * Manifest-to-compiler lowering utilities.
 *
 * Extracted from CompilerBridge (previously inline private static methods)
 * so the bridge stays a thin orchestrator:
 *   - manifestToSemanticTypes  → TypeScriptGeneratorPass input (resources only)
 *   - manifestToRequestTypes   → FormGeneratorPass input (flattened, camelCase)
 *   - manifestToContractInput  → ContractGeneratorPass input (nested, snake_case)
 *
 * All logic moved VERBATIM — no behavior changes.
 */

// Types
import type { ParsedModel, ParsedResource, ParsedRoute } from '../../../../core/src/types/route'
import type { RouteManifest } from '../../../../core/src/types/route'
import type { SemanticType } from '../../../../core/src/compiler/types/SemanticType'
import type { SemanticTypesArtifact } from '../../../../core/src/compiler/passes/TypeScriptGeneratorPass'
import type { RequestTypesArtifact, RequestType, FormAction, RequestField } from '../../../../core/src/compiler/artifacts/RequestTypesArtifact'

// Implementation
import { ObjectType } from '../../../../core/src/compiler/types/SemanticType'
import { ImmutableMap, ImmutableSet } from '../../../../core/src/compiler/utils/ImmutableCollections'
import { toCamelCase, toPascalCase } from '../../../../core/src/utils/resource-naming'
import { FormFieldMapper } from '../../../../core/src/compiler/generators/form-generation/FormFieldMapper'
import { flattenResourceFields } from './resource-flattening'
import { PrimitiveTypeFactory } from './PrimitiveTypeFactory'

/**
 * Convert RouteManifest to SemanticTypesArtifact
 * Pure data lowering - uses utilities for complex logic
 *
 * ✅ ONLY PROCESS RESOURCES (not models)
 * - Resources get Show/Index aliases (for API responses)
 * - Models are database tables (not needed in api-read.ts)
 *
 * @param manifest - Input manifest from CLI scan
 * @returns SemanticTypesArtifact for compiler passes
 */
export function manifestToSemanticTypes(manifest: RouteManifest): SemanticTypesArtifact {
    const typesArray: ObjectType[] = []

    // ❌ SKIP models - not needed for API types
    // Models are database tables, not API responses

    // ✅ Convert resources ONLY
    const resourceTypes = processResources(manifest.resources || [])
    typesArray.push(...resourceTypes)

    return {
        typeId: 'SemanticTypes',
        types: typesArray,
        metadata: {
            hash: `manifest-${Date.now()}`,
            producer: 'CompilerBridge',
            dependencies: [],
            timestamp: Date.now(),
            revision: '1.0.0'
        }
    }
}

/**
 * Convert RouteManifest to RequestTypesArtifact (for form generation)
 * Extract validation rules from routes and group by resource
 * FLATTENS nested objects and transforms to camelCase
 *
 * @param manifest - Input manifest from CLI scan
 * @returns RequestTypesArtifact for FormGeneratorPass
 */
export function manifestToRequestTypes(manifest: RouteManifest): RequestTypesArtifact {
    const requestTypes: RequestType[] = []
    const fieldMapper = new FormFieldMapper()

    // Group routes by resource name
    const routesByResource = new Map<string, typeof manifest.routes>()

    for (const route of manifest.routes || []) {
        // Only process POST/PUT/PATCH (create/update actions)
        if (!['POST', 'PUT', 'PATCH'].includes(route.method)) {
            continue
        }

        // Extract resource name from path
        const resourceName = extractResourceName(route)
        if (!resourceName) {
            continue
        }

        // Group routes
        if (!routesByResource.has(resourceName)) {
            routesByResource.set(resourceName, [])
        }
        routesByResource.get(resourceName)!.push(route)
    }

    // Process each resource group
    for (const [resourceName, routes] of routesByResource) {
        const actionsMap = new Map<'create' | 'update', RequestField[]>()

        for (const route of routes) {
            // Determine action type (create/update)
            const action = determineAction(route.method)
            if (!action) continue

            // Parse validation rules
            const fields = parseValidationRules(
                (route.schema?.rules || {}) as Record<string, string>,
                fieldMapper
            )

            if (fields.length > 0) {
                // Merge fields if action already exists
                if (actionsMap.has(action)) {
                    const existing = actionsMap.get(action)!
                    // Add only new fields (avoid duplicates)
                    const existingNames = new Set(existing.map(f => f.transformedName))
                    const newFields = fields.filter(f => !existingNames.has(f.transformedName))
                    actionsMap.set(action, [...existing, ...newFields])
                } else {
                    actionsMap.set(action, fields)
                }
            }
        }

        // Convert map to actions array
        const actions: FormAction[] = []
        for (const [actionName, fields] of actionsMap) {
            actions.push({
                name: actionName,
                fields
            })
        }

        if (actions.length > 0) {
            requestTypes.push({
                resourceName,
                formTypeName: `${toPascalCase(resourceName)}Form`,
                actions
            })
        }
    }

    return {
        typeId: 'RequestTypes',
        requestTypes,
        metadata: {
            hash: `request-types-${Date.now()}`,
            producer: 'CompilerBridge',
            dependencies: [],
            timestamp: Date.now(),
            revision: '1.0.0'
        }
    }
}

/**
 * Convert RouteManifest to ContractInput (for contract generation)
 * Preserves ORIGINAL backend structure (nested + snake_case)
 *
 * Different from manifestToRequestTypes:
 * - NO flattening (preserves nested objects)
 * - NO camelCase transformation (preserves snake_case)
 * - Sanitizes resource names (kebab-case → camelCase)
 * - Purpose: Runtime validation of backend JSON structure
 *
 * @param manifest - Input manifest from CLI scan
 * @returns RequestTypesArtifact for ContractGeneratorPass
 */
export function manifestToContractInput(manifest: RouteManifest): RequestTypesArtifact {
    const requestTypes: RequestType[] = []
    const fieldMapper = new FormFieldMapper()

    // Group routes by resource name (include ALL methods for response extraction)
    const routesByResource = new Map<string, typeof manifest.routes>()

    for (const route of manifest.routes || []) {
        // Extract resource name from path
        let resourceName = extractResourceName(route)
        if (!resourceName) {
            continue
        }

        // 🔧 FIX BUG 1: Sanitize resource name (kebab-case → camelCase)
        resourceName = sanitizeResourceName(resourceName)

        // Group routes (ALL methods, not just POST/PUT/PATCH)
        if (!routesByResource.has(resourceName)) {
            routesByResource.set(resourceName, [])
        }
        routesByResource.get(resourceName)!.push(route)
    }

    // Process each resource group
    for (const [resourceName, routes] of routesByResource) {
        const actionsMap = new Map<'create' | 'update', RequestField[]>()

        // Process REQUEST actions (POST/PUT/PATCH only)
        for (const route of routes) {
            // Only process POST/PUT/PATCH for request validation
            if (!['POST', 'PUT', 'PATCH'].includes(route.method)) {
                continue
            }

            // Determine action type (create/update)
            const action = determineAction(route.method)
            if (!action) continue

            // 🔧 FIX BUG 2: Parse validation rules WITHOUT flattening
            const fields = parseValidationRulesPreserveNested(
                (route.schema?.rules || {}) as Record<string, string>,
                fieldMapper
            )

            if (fields.length > 0) {
                // Merge fields if action already exists
                if (actionsMap.has(action)) {
                    const existing = actionsMap.get(action)!
                    // Add only new fields (avoid duplicates)
                    const existingNames = new Set(existing.map(f => f.originalName))
                    const newFields = fields.filter(f => !existingNames.has(f.originalName))
                    actionsMap.set(action, [...existing, ...newFields])
                } else {
                    actionsMap.set(action, fields)
                }
            }
        }

        // Convert map to actions array
        const actions: FormAction[] = []
        for (const [actionName, fields] of actionsMap) {
            actions.push({
                name: actionName,
                fields
            })
        }

        // ============================================
        // ✅ STEP 6: Extract response data from manifest
        // ============================================
        let responseData: RequestType['responseData'] | undefined

        // Find first route with response metadata (GET routes typically)
        const routeWithResponse = routes.find(r => r.response && r.method === 'GET')

        if (routeWithResponse?.response) {
            const response = routeWithResponse.response

            // Type-safe access to discriminated union
            const responseResourceName = response.kind === 'resource'
                ? response.resource
                : response.kind === 'model'
                    ? response.model
                    : undefined

            if (responseResourceName) {
                // Find resource definition in manifest
                const resource = manifest.resources?.find(r => r.name === responseResourceName)

                if (resource) {
                    console.log(`[CompilerBridge] Extracting response data for ${resourceName} from ${responseResourceName}`)

                    // Flatten resource fields (reuse existing utility)
                    const flattenedFields = flattenResourceFields(
                        resource.name,
                        resource.fields || {},
                        { maxDepth: 5, circularRefWarnings: true }
                    )

                    // Convert Map to Record
                    const fieldsRecord: Record<string, SemanticType> = {}
                    for (const [fieldName, fieldType] of flattenedFields) {
                        fieldsRecord[fieldName] = fieldType
                    }

                    responseData = {
                        resourceName: resource.name,
                        fields: fieldsRecord
                    }

                    console.log(`[CompilerBridge] Extracted ${Object.keys(fieldsRecord).length} response fields`)
                } else {
                    console.warn(`[CompilerBridge] Resource ${responseResourceName} not found in manifest`)
                }
            }
        }

        // ✅ FIX: Include resource if EITHER actions OR responseData exist
        // Previously only added if actions.length > 0, which skipped GET-only resources
        if (actions.length > 0 || responseData) {
            requestTypes.push({
                resourceName,
                formTypeName: `${toPascalCase(resourceName)}Contract`,
                actions,
                responseData  // ← Include response data (may be undefined)
            })

            console.log(`[CompilerBridge] ${resourceName}: ${actions.length} request actions, ${responseData ? 'has' : 'no'} response schemas`)
        }
    }

    return {
        typeId: 'RequestTypes',
        requestTypes,
        metadata: {
            hash: `contract-input-${Date.now()}`,
            producer: 'CompilerBridge',
            dependencies: [],
            timestamp: Date.now(),
            revision: '1.0.0'
        }
    }
}

/**
 * Process resources from manifest
 * Uses flattenResourceFields utility for nested objects
 *
 * @param resources - Array of ParsedResource from manifest
 * @returns Array of ObjectType for semantic types
 */
function processResources(resources: ParsedResource[]): ObjectType[] {
    const result: ObjectType[] = []

    // Validate resources array
    if (!Array.isArray(resources)) {
        throw new Error(
            `manifest.resources is not an array (type: ${typeof resources})`
        )
    }

    for (const resource of resources) {
        const properties = new Map()

        // ✅ Use existing utility instead of inline flattening
        const flattenedFields = flattenResourceFields(
            resource.name,
            resource.fields || {},
            {
                maxDepth: 5,
                circularRefWarnings: true
            }
        )

        // Convert flattened fields to properties
        for (const [fieldName, fieldType] of flattenedFields) {
            properties.set(fieldName, fieldType)
        }

        // Create ObjectType for resource
        const objectType = new ObjectType(
            new ImmutableMap(properties),
            new ImmutableSet(new Set(Array.from(properties.keys()))),
            undefined, // no base
            [], // no interfaces
            new ImmutableMap(new Map<string, string>([
                ['name', resource.name],
                ['kind', 'resource']
            ]))
        )

        result.push(objectType)
    }

    return result
}

/**
 * Process models from manifest
 * Converts database models to ObjectType instances
 *
 * @param models - Array of ParsedModel from manifest
 * @returns Array of ObjectType for semantic types
 */
function processModels(models: ParsedModel[]): ObjectType[] {
    const result: ObjectType[] = []

    for (const model of models) {
        const properties = new Map()

        // Convert each column to property with camelCase
        for (const column of model.columns || []) {
            const camelName = toCamelCase(column.name)  // ✅ Use utility
            const columnType = PrimitiveTypeFactory.fromSqlType(column.type)  // ✅ Use factory
            properties.set(camelName, columnType)
        }

        // Create ObjectType for model
        const objectType = new ObjectType(
            new ImmutableMap(properties),
            new ImmutableSet(new Set(Array.from(properties.keys()))),
            undefined, // no base
            [], // no interfaces
            new ImmutableMap(new Map<string, string>([
                ['name', model.name],
                ['kind', 'model']
            ]))
        )

        result.push(objectType)
    }

    return result
}

/**
 * Sanitize resource name to valid JavaScript identifier
 * Converts kebab-case to camelCase
 *
 * Examples:
 * - "forgot-password" → "forgotPassword"
 * - "reset-password" → "resetPassword"
 * - "buy-now" → "buyNow"
 * - "cart" → "cart"
 *
 * @param resourceName - Raw resource name from route path
 * @returns Sanitized camelCase identifier
 */
function sanitizeResourceName(resourceName: string): string {
    // Convert kebab-case to camelCase
    return resourceName.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())
}

/**
 * Parse validation rules preserving ORIGINAL backend structure (for contracts)
 *
 * Different from parseValidationRules (for forms):
 * - NO flattening of nested objects (preserves nesting)
 * - NO camelCase transformation (uses original snake_case)
 * - Fields use originalName as-is (not transformed)
 *
 * @param rules - Validation rules from manifest
 * @param fieldMapper - Mapper for type inference
 * @returns Array of RequestField with ORIGINAL naming
 */
function parseValidationRulesPreserveNested(
    rules: Record<string, string>,
    fieldMapper: FormFieldMapper
): RequestField[] {
    const fields: RequestField[] = []

    for (const [fieldName, ruleString] of Object.entries(rules)) {
        // Skip if ruleString is not a string
        if (typeof ruleString !== 'string') {
            console.warn(`[CompilerBridge] Skipping field ${fieldName}: rules is not a string`)
            continue
        }

        // Skip nested array fields (items.*.fieldName)
        // These need special handling which we'll implement later
        if (fieldName.includes('.*.') || fieldName.includes('.*')) {
            console.warn(`[CompilerBridge] Skipping nested array field: ${fieldName}`)
            continue
        }

        // Parse rule string (format: "required|string|max:255")
        const parsedRules = ruleString.split('|').map(r => {
            const [rule, ...params] = r.split(':')
            return {
                rule,
                parameters: params.length > 0 ? params[0].split(',') : []
            }
        })

        // Map to TypeScript type
        const mapped = fieldMapper.mapValidationToType(parsedRules)

        // 🚨 CRITICAL DIFFERENCE: Use originalName for BOTH fields
        // - NO transformation to camelCase
        // - Preserves snake_case from backend
        fields.push({
            originalName: fieldName,        // ← snake_case preserved
            transformedName: fieldName,     // ← Same as original (NO transform)
            type: mapped.type,
            required: mapped.required,
            nullable: mapped.nullable
        })
    }

    return fields
}

/**
 * Parse validation rules to RequestField array
 */
function parseValidationRules(
    rules: Record<string, string>,
    fieldMapper: FormFieldMapper
): RequestField[] {
    const fields: RequestField[] = []

    for (const [fieldName, ruleString] of Object.entries(rules)) {
        // Skip if ruleString is not a string
        if (typeof ruleString !== 'string') {
            console.warn(`[CompilerBridge] Skipping field ${fieldName}: rules is not a string`)
            continue
        }

        // Skip nested array fields (items.*.fieldName)
        // These need special handling which we'll implement later
        if (fieldName.includes('.*.') || fieldName.includes('.*')) {
            console.warn(`[CompilerBridge] Skipping nested array field: ${fieldName}`)
            continue
        }

        // Parse rule string (format: "required|string|max:255")
        const parsedRules = ruleString.split('|').map(r => {
            const [rule, ...params] = r.split(':')
            return {
                rule,
                parameters: params.length > 0 ? params[0].split(',') : []
            }
        })

        // Map to TypeScript type
        const mapped = fieldMapper.mapValidationToType(parsedRules)

        fields.push({
            originalName: fieldName,
            transformedName: toCamelCase(fieldName),
            type: mapped.type,
            required: mapped.required,
            nullable: mapped.nullable
        })
    }

    return fields
}

/**
 * Extract resource name from route path
 * Examples: /api/users/{id} → users, /api/cart/items → cart
 */
function extractResourceName(route: ParsedRoute): string | null {
    // Remove leading slash and split by slash
    const segments = route.path.replace(/^\//, '').split('/')

    // Find first non-api segment
    for (const segment of segments) {
        // Skip 'api' prefix and path parameters
        if (segment === 'api' || segment.startsWith('{')) {
            continue
        }
        // Return first valid segment
        if (segment.length > 0) {
            return segment
        }
    }

    return null
}

/**
 * Determine action type from HTTP method
 */
function determineAction(method: string): 'create' | 'update' | null {
    switch (method.toUpperCase()) {
        case 'POST':
            return 'create'
        case 'PUT':
        case 'PATCH':
            return 'update'
        default:
            return null
    }
}
