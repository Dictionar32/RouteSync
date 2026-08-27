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
import type { ParsedModel, ParsedResource, ParsedRoute, ResourceFieldKind } from '../../../../core/src/types/route'
import type { RouteManifest } from '../../../../core/src/types/route'
import type { SemanticType } from '../../../../core/src/compiler/types/SemanticType'
import type { SemanticTypesArtifact } from '../../../../core/src/compiler/passes/TypeScriptGeneratorPass'
import type { RequestTypesArtifact, RequestType, FormAction, RequestField } from '../../../../core/src/compiler/artifacts/RequestTypesArtifact'

// Implementation
import { ObjectType, ReadonlyCollectionType, MutableCollectionType, CollectionKind, PrimitiveType, PrimitiveKind, ReferenceType } from '../../../../core/src/compiler/types/SemanticType'
import { ImmutableMap, ImmutableSet } from '../../../../core/src/compiler/utils/ImmutableCollections'
import { toCamelCase, toPascalCase } from '../../../../core/src/utils/resource-naming'
import { FormFieldMapper } from '../../../../core/src/compiler/generators/form-generation/FormFieldMapper'
import type { ValidationRule } from '../../../../core/src/compiler/generators/form-generation/FormFieldMapper'
import { flattenResourceFields, primitiveStringToSemanticType } from './resource-flattening'
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
    const resourceTypes = processResources(manifest.resources || [], manifest.models || [])
    typesArray.push(...resourceTypes)

    // ✅ Extract inline responses (from routes) for api-read.ts transformed types
    const contractInput = manifestToContractInput(manifest)
    const existingNames = new Set(resourceTypes.map(t => t.annotations?.get('name')).filter(Boolean))

    const capitalize = (str: string) => str ? str.charAt(0).toUpperCase() + str.slice(1) : ''

    function flattenSemanticTypeFields(
        prefix: string,
        type: SemanticType,
        props: Map<string, SemanticType>
    ): void {
        if (type instanceof ObjectType) {
            if (type.annotations?.get('kind') === 'nullable_wrapper') {
                const inner = type.properties.get('__value')
                if (inner) {
                    flattenSemanticTypeFields(prefix, inner, props)
                    return
                }
            }
            for (const [key, propType] of type.properties.entries()) {
                const newKey = prefix ? `${prefix}${capitalize(toCamelCase(key))}` : toCamelCase(key)
                flattenSemanticTypeFields(newKey, propType, props)
            }
            return
        }

        if (type instanceof ReadonlyCollectionType || type instanceof MutableCollectionType) {
            let elem = type.elementType
            const elemName = elem instanceof ReferenceType ? elem.name.split('\\').pop() : (elem instanceof ObjectType ? elem.annotations?.get('name') : undefined)
            const resourceDef = elemName ? manifest.resources?.find(r => r.name === elemName) : undefined
            const model = elemName ? manifest.models?.find(m => m.name === elemName) : undefined

            if (resourceDef) {
                const resPascal = toPascalCase(resourceDef.name)
                elem = new ReferenceType('', `${resPascal}Transformed`)
            } else if (model) {
                const modelProps = new Map<string, SemanticType>()
                for (const col of model.columns || []) {
                    const baseType = PrimitiveTypeFactory.fromSqlType(col.type)
                    const colType = col.nullable ? markNullableSemanticType(baseType) : baseType
                    modelProps.set(toCamelCase(col.name), colType)
                }
                elem = new ObjectType(
                    new ImmutableMap(modelProps),
                    new ImmutableSet(new Set(Array.from(modelProps.keys()))),
                    undefined,
                    [],
                    new ImmutableMap(new Map([['name', model.name]]))
                )
            } else if (elem instanceof ObjectType) {
                const elemProps = new Map<string, SemanticType>()
                for (const [key, propType] of elem.properties.entries()) {
                    elemProps.set(toCamelCase(key), propType)
                }
                elem = new ObjectType(
                    new ImmutableMap(elemProps),
                    new ImmutableSet(new Set(Array.from(elemProps.keys()))),
                    elem.baseObject,
                    elem.interfaces,
                    elem.annotations
                )
            }

            const collType = type instanceof ReadonlyCollectionType
                ? new ReadonlyCollectionType(type.collectionKind, elem)
                : new MutableCollectionType(type.collectionKind, elem)

            props.set(prefix, collType)
            return
        }

        if (type instanceof ReferenceType) {
            const refName = type.name.split('\\').pop()
            const model = manifest.models?.find(m => m.name === type.name || m.name === refName)
            if (model) {
                const modelProps = new Map<string, SemanticType>()
                for (const col of model.columns || []) {
                    const baseType = PrimitiveTypeFactory.fromSqlType(col.type)
                    const colType = col.nullable ? markNullableSemanticType(baseType) : baseType
                    modelProps.set(toCamelCase(col.name), colType)
                }
                const objType = new ObjectType(
                    new ImmutableMap(modelProps),
                    new ImmutableSet(new Set(Array.from(modelProps.keys()))),
                    undefined,
                    [],
                    new ImmutableMap(new Map([['name', model.name]]))
                )
                props.set(prefix, objType)
                return
            }
        }

        props.set(prefix, type)
    }

    for (const reqType of contractInput.requestTypes) {
        if (reqType.responseData) {
            const rawName = reqType.responseData.resourceName
            const pascalName = toPascalCase(rawName)
            if (!existingNames.has(rawName) && !existingNames.has(pascalName)) {
                existingNames.add(rawName)
                existingNames.add(pascalName)

                const props = new Map<string, SemanticType>()
                for (const [key, semanticType] of Object.entries(reqType.responseData.fields)) {
                    flattenSemanticTypeFields(toCamelCase(key), semanticType, props)
                }

                const objectType = new ObjectType(
                    new ImmutableMap(props),
                    new ImmutableSet(new Set(Array.from(props.keys()))),
                    undefined,
                    [],
                    new ImmutableMap(new Map<string, string>([
                        ['name', pascalName],
                        ['kind', 'inline']
                    ]))
                )
                typesArray.push(objectType)
            }
        }
    }

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

            // Parse validation rules (preserving nested object shapes for forms)
            const fields = parseValidationRulesPreserveNested(
                (route.schema?.rules || {}) as Record<string, string | string[]>,
                fieldMapper,
                { path: route.path, method: route.method, action: route.action },
                { camelCaseTransformedName: true }
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
        let actions: FormAction[] = []
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

    // ✅ FIX #2: dedupe global per RESPONSE resource — response resource bisa
    // berbeda dari resource path (POST /cart/items → OrderResource), sehingga
    // satu response resource bisa muncul di beberapa group. Tanpa dedupe ini,
    // ContractCodeBuilder merender export schema yang sama dua kali.
    const processedResponseResources = new Set<string>()

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
                (route.schema?.rules || {}) as Record<string, string | string[]>,
                fieldMapper,
                { path: route.path, method: route.method, action: route.action }
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
        let actions: FormAction[] = []
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
        // Fields response resource group ini (juga saat responseData di-skip
        // dedupe) — dipakai untuk inferensi tipe request field.
        let inferenceFields: Record<string, SemanticType> | undefined

        // ✅ FIX #2: cari response di route method APAPUN (bukan GET-only).
        // Urutan prioritas: GET dulu (index/show resource path sendiri),
        // lalu route lain (POST /payment/{orderId} → PaymentResource,
        // POST /cart/items → OrderResource).
        // ✅ INLINE RESPONSE FIX: Also accept inline and intentionally unknown
        // responses so their route is retained in the generated contract input.
        const responseRoutes = routes.filter(
            r => r.response && (
                r.response.kind === 'resource' ||
                r.response.kind === 'model' ||
                r.response.kind === 'object' ||  // ← Inline responses from manifest
                r.response.kind === 'array' ||   // ← Canonical top-level collection descriptor
                r.response.kind === 'unknown'
            )
        )
        const routeWithResponse =
            responseRoutes.find(r => r.method === 'GET') ?? responseRoutes[0]

        if (routeWithResponse?.response) {
            const response = routeWithResponse.response

            // Type-safe access to discriminated union
            const responseResourceName = response.kind === 'resource'
                ? response.resource
                : response.kind === 'model'
                    ? response.model
                    : undefined

            if (responseResourceName) {
                // ✅ Dedupe global: response resource yang sama sudah
                // diproses di group lain — skip SET responseData (hindari
                // export duplikat di ContractCodeBuilder), tapi tetap bangun
                // fields untuk inferensi tipe request group ini.
                if (processedResponseResources.has(responseResourceName)) {
                    console.log(`[CompilerBridge] Response ${responseResourceName} already extracted (skip duplicate for ${resourceName})`)

                    const resource = manifest.resources?.find(r => r.name === responseResourceName)
                    if (resource) {
                        inferenceFields = resourceFieldsToNestedTypes(
                            resource,
                            manifest.resources || [],
                            manifest.models || [],
                            new Set()
                        )
                    }
                } else {
                    // Find resource or model definition in manifest
                    const resource = manifest.resources?.find(r => r.name === responseResourceName)
                    const model = !resource ? manifest.models?.find(m => m.name === responseResourceName) : undefined

                    if (resource) {
                        console.log(`[CompilerBridge] Extracting response data for ${resourceName} from ${responseResourceName} (${routeWithResponse.method})`)

                        const fieldsRecord = resourceFieldsToNestedTypes(
                            resource,
                            manifest.resources || [],
                            manifest.models || [],
                            new Set()
                        )

                        responseData = {
                            resourceName: resource.name,
                            fields: fieldsRecord
                        }

                        inferenceFields = fieldsRecord
                        processedResponseResources.add(responseResourceName)

                        console.log(`[CompilerBridge] Extracted ${Object.keys(fieldsRecord).length} response fields`)
                    } else if (model) {
                        console.log(`[CompilerBridge] Extracting model columns for type inference from ${model.name}`)
                        const fieldsRecord: Record<string, SemanticType> = {}
                        for (const col of model.columns) {
                            const colType = col.type.toLowerCase()
                            const isNum = colType.includes('int') || colType.includes('float') || colType.includes('double') || colType.includes('decimal') || colType.includes('numeric')
                            fieldsRecord[col.name] = isNum
                                ? new PrimitiveType(PrimitiveKind.NUMBER)
                                : new PrimitiveType(PrimitiveKind.STRING)
                        }
                        inferenceFields = fieldsRecord
                        processedResponseResources.add(responseResourceName)
                        console.log(`[CompilerBridge] Extracted ${Object.keys(fieldsRecord).length} model column fields for ${model.name}`)
                    } else {
                        console.warn(`[CompilerBridge] Resource or Model ${responseResourceName} not found in manifest`)
                    }
                }
            } else if (response.kind === 'object' && response.fields) {
                // ✅ INLINE RESPONSE: Handle inline response objects (not resource references)
                // Generate synthetic resource name from route path
                const syntheticName = generateInlineResourceName(routeWithResponse)

                // Check for collision with existing resources
                const collisionResource = manifest.resources?.find(r => r.name === syntheticName)
                const finalName = collisionResource ? `${syntheticName}Inline` : syntheticName

                console.log(`[CompilerBridge] Extracting inline response for ${resourceName} from ${routeWithResponse.path} as ${finalName}`)

                // Convert inline fields to SemanticType using EXISTING utility
                // resourceFieldsToNestedTypes works for both ParsedResource and inline fields
                const fieldsRecord = resourceFieldsToNestedTypes(
                    {
                        name: finalName,
                        fields: response.fields
                    } as ParsedResource,
                    manifest.resources || [],
                    manifest.models || [],
                    new Set()
                )

                const responseFields = response.collection
                    ? {
                        data: new ReadonlyCollectionType(
                            CollectionKind.ARRAY,
                            buildInlineObjectType(finalName, fieldsRecord)
                        )
                    }
                    : fieldsRecord

                responseData = {
                    resourceName: finalName,
                    fields: responseFields
                }

                inferenceFields = fieldsRecord

                console.log(`[CompilerBridge] Extracted ${Object.keys(fieldsRecord).length} inline response fields${response.collection ? ' as collection' : ''}`)
            } else if (response.kind === 'array') {
                const syntheticName = generateInlineResourceName(routeWithResponse)
                const collisionResource = manifest.resources?.find(r => r.name === syntheticName)
                const finalName = collisionResource ? `${syntheticName}Inline` : syntheticName

                // A canonical top-level array has no object field name of its
                // own. Keep the established response artifact convention by
                // exposing it through `data`, while preserving its recursive
                // element type (resource, model, object, primitive, or array).
                const arrayType = mapResourceFieldToNestedType(
                    'data',
                    response as ResourceFieldKind,
                    manifest.resources || [],
                    new Set()
                ) ?? new ReadonlyCollectionType(
                    CollectionKind.ARRAY,
                    new ReferenceType('App\\Models', 'unknown')
                )

                responseData = {
                    resourceName: finalName,
                    fields: { data: arrayType }
                }
                inferenceFields = responseData.fields

                console.log(`[CompilerBridge] Extracted canonical array response for ${resourceName} from ${routeWithResponse.path} as ${finalName}`)
            } else if (response.kind === 'unknown') {
                const syntheticName = generateInlineResourceName(routeWithResponse)
                const collisionResource = manifest.resources?.find(r => r.name === syntheticName)
                const finalName = collisionResource ? `${syntheticName}Inline` : syntheticName

                // Keep an explicitly unknown response in the artifact without
                // inventing a model-derived schema. The empty field map is an
                // honest representation of the manifest's available knowledge.
                responseData = {
                    resourceName: finalName,
                    fields: {}
                }
                inferenceFields = {}

                console.log(`[CompilerBridge] Preserving unknown response for ${resourceName} from ${routeWithResponse.path} as ${finalName}`)
            }
        }

        // ✅ Inferensi tipe request dari response (field senama):
        // request field yang tidak punya rule tipe (masih string default)
        // di-upgrade ke z.number() kalau ada field dengan nama yang sama
        // bertipe number di response resource-nya. Contoh: cart.create.
        // produk_item_id (rule exists tanpa tipe) ↔ OrderResource.items.
        // produk_item_id: z.number(). Field dengan rule tipe eksplisit
        // (string/numeric/array) TIDAK disentuh.
        // Pakai inferenceFields (ada walau responseData di-skip dedupe).
        if (inferenceFields) {
            actions = actions.map(action => ({
                ...action,
                fields: action.fields.map(f => inferRequestFieldType(f, inferenceFields!))
            }))
        }

        // ✅ FIX: Include resource if EITHER actions OR responseData exist
        // Previously only added if actions.length > 0, which skipped GET-only resources
        // Convert field names and ObjectType properties to camelCase for RequestTypes (Form types)
        if (actions.length > 0 || responseData) {
            requestTypes.push({
                resourceName,
                formTypeName: `${toPascalCase(resourceName)}Form`,
                actions,
                responseData  // ← Include response data (may be undefined)
            })

            console.log(`[CompilerBridge] ${resourceName}: ${actions.length} request actions, ${responseData ? 'has' : 'no'} response schemas`)
        }
    }

    // ✅ STEP 2: Extract contract-reachable child resources
    // Scan manifest.resources for any child resource referenced in responseData
    // that hasn't been registered yet, so ContractGeneratorPass generates its ApiResponse type.
    if (manifest.resources) {
        let foundNewChild = true;
        while (foundNewChild) {
            foundNewChild = false;
            const currentResponseTypes = requestTypes
                .filter(rt => rt.responseData)
                .map(rt => rt.responseData!.fields);

            for (const manifestRes of manifest.resources) {
                if (processedResponseResources.has(manifestRes.name)) continue;

                // Check if manifestRes is referenced as element or nested type in currentResponseTypes
                const isReachable = currentResponseTypes.some(fieldsMap => {
                    return Object.values(fieldsMap).some(fieldType => {
                        let target: SemanticType | undefined = fieldType;
                        if (fieldType instanceof ReadonlyCollectionType || fieldType instanceof MutableCollectionType) {
                            target = fieldType.elementType;
                        }
                        if (target instanceof ObjectType) {
                            const name = target.annotations?.get('name') ?? (target as any).metadata?.get('name');
                            return name === manifestRes.name;
                        }
                        return false;
                    });
                });

                if (isReachable) {
                    const fieldsRecord = resourceFieldsToNestedTypes(
                        manifestRes,
                        manifest.resources,
                        manifest.models || [],
                        new Set()
                    );
                    requestTypes.push({
                        resourceName: manifestRes.name,
                        formTypeName: `${toPascalCase(manifestRes.name)}Contract`,
                        actions: [],
                        responseData: {
                            resourceName: manifestRes.name,
                            fields: fieldsRecord
                        }
                    });
                    processedResponseResources.add(manifestRes.name);
                    foundNewChild = true;
                    console.log(`[CompilerBridge] Registered contract-reachable child resource: ${manifestRes.name}`);
                }
            }
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
function processResources(resources: ParsedResource[], allModels: ParsedModel[] = []): ObjectType[] {
    const result: ObjectType[] = []

    // Validate resources array
    if (!Array.isArray(resources)) {
        throw new Error(
            `manifest.resources is not an array (type: ${typeof resources})`
        )
    }

    for (const resource of resources) {
        const properties = new Map<string, SemanticType>()

        // Flatten resource fields to camelCase properties (api-read.ts flattened read types)
        const flattenedFields = flattenResourceFields(
            resource.name,
            resource.fields || {},
            {
                maxDepth: 5,
                circularRefWarnings: true
            }
        )

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
 * Generate synthetic resource name for inline responses
 * 
 * Creates a meaningful name from the route path for inline response objects.
 * 
 * @example
 * /api/payment/confirm → PaymentConfirm
 * /api/auth/login → AuthLogin
 * /api/auth/social → AuthSocial
 * /api/register → Register
 * /api/forgot-password → ForgotPassword (kebab-case → camelCase)
 * 
 * @param route - Route with inline response
 * @returns PascalCase synthetic resource name
 */
export function generateInlineResourceName(route: ParsedRoute): string {
    const segments = route.path
        .replace(/^\//, '')  // Remove leading slash
        .split('/')
        .filter(s => s.toLowerCase() !== 'api' && !s.startsWith('{'))  // Remove 'api' (case-insensitive) and params like {id}
        .map(s => s.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase()))  // kebab-case → camelCase

    if (segments.length === 0) return 'Unknown'

    if (segments.length === 1) {
        // Single segment: just capitalize first letter
        return segments[0].charAt(0).toUpperCase() + segments[0].slice(1)
    }

    // Multiple segments: use first + last, PascalCase both
    const first = segments[0]
    const last = segments[segments.length - 1]

    const pascalFirst = first.charAt(0).toUpperCase() + first.slice(1)
    const pascalLast = last.charAt(0).toUpperCase() + last.slice(1)

    return pascalFirst + pascalLast
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
    rules: Record<string, string | string[]>,
    fieldMapper: FormFieldMapper,
    context?: { path?: string; method?: string; action?: string },
    options?: { camelCaseTransformedName?: boolean }
): RequestField[] {
    let fields: RequestField[] = []
    const toName = (name: string) => options?.camelCaseTransformedName ? toCamelCase(name) : name

    // Wildcard children: parent → childName → parsed rules
    // (mis. checkout items.*.produk_item_id → elemen dari items)
    const wildcardChildren = new Map<string, Map<string, ValidationRule[]>>()
    // Direct wildcards (attachments.*) describe scalar array elements.
    const wildcardElements = new Map<string, ValidationRule[]>()

    for (const [fieldName, ruleString] of Object.entries(rules)) {
        // ✅ FIX #5: dukung rule format array JSON
        // (['sometimes','required','email',{}]) bukan hanya string pipe
        if (typeof ruleString !== 'string' && !Array.isArray(ruleString)) {
            console.warn(`[CompilerBridge] Skipping field ${fieldName}: rules is not a string or array`)
            continue
        }

        const parsedRules = normalizeValidationRules(ruleString)

        const wildcardElementMatch = fieldName.match(/^([^.]+)\.\*$/)
        if (wildcardElementMatch) {
            wildcardElements.set(wildcardElementMatch[1], parsedRules)
            continue
        }

        // ✅ FIX #4: wildcard (items.*.produk_item_id) TIDAK di-skip —
        // dikumpulkan sebagai elemen dari array parent-nya
        const wildcardMatch = fieldName.match(/^([^.]+)\.\*\.(.+)$/)
        if (wildcardMatch) {
            const parent = wildcardMatch[1]
            const child = wildcardMatch[2]

            if (!wildcardChildren.has(parent)) {
                wildcardChildren.set(parent, new Map())
            }
            wildcardChildren.get(parent)!.set(child, parsedRules)
            continue
        }

        const hasExplicitType = parsedRules.some(r =>
            ['string', 'integer', 'numeric', 'boolean', 'file', 'image', 'mimes', 'mimetypes', 'json', 'date', 'date_format', 'array'].includes(r.rule)
        )
        if (!hasExplicitType) {
            const routeInfo = context?.path
                ? ` pada [${context.method ?? ''} ${context.path}] (${context.action || 'inline'})`
                : ''
            const suggestedType = parsedRules.some(r => r.rule === 'exists') ? 'integer' : 'string'
            console.warn(
                `[CompilerBridge] ⚠️ Tipe field "${fieldName}" tidak dapat dipastikan${routeInfo}. Rule validasi "${fieldName}" tidak menentukan tipe eksplisit (contoh: '${fieldName}' => '${suggestedType}'). Harap perbarui rule validasi pada backend Laravel Anda.`
            )
        }

        // Map to TypeScript type
        const mapped = fieldMapper.mapValidationToType(parsedRules)

        // 🚨 CRITICAL DIFFERENCE: Use originalName for BOTH fields
        // - NO transformation to camelCase
        // - Preserves snake_case from backend
        fields.push({
            originalName: fieldName,
            transformedName: toName(fieldName),
            type: mapped.type,
            fileConstraints: mapped.fileConstraints,
            required: mapped.required,
            nullable: mapped.nullable
        })
    }

    // `attachments.*: file` upgrades `attachments: array` to File[].
    for (const [parent, elementRules] of wildcardElements) {
        const hasExplicitType = elementRules.some(r =>
            ['string', 'integer', 'numeric', 'boolean', 'file', 'image', 'mimes', 'mimetypes', 'json', 'date', 'date_format'].includes(r.rule)
        )
        if (!hasExplicitType) {
            const routeInfo = context?.path
                ? ` pada [${context.method ?? ''} ${context.path}] (${context.action || 'inline'})`
                : ''
            console.warn(
                `[CompilerBridge] ⚠️ Tipe elemen "${parent}.*" tidak dapat dipastikan${routeInfo}. Rule validasi "${parent}.*" tidak menentukan tipe eksplisit (contoh: '${parent}.*' => 'sometimes|string'). Harap perbarui rule validasi pada backend Laravel Anda.`
            )
        }

        const mapped = fieldMapper.mapValidationToType(elementRules)
        const elementType = hasExplicitType ? mapped.type : new PrimitiveType(PrimitiveKind.UNKNOWN)
        const type = new ReadonlyCollectionType(CollectionKind.ARRAY, elementType)
        const parentField = fields.find(field => field.originalName === parent)

        if (parentField) {
            fields = fields.map(field =>
                field.originalName === parent
                    ? { ...field, type, fileConstraints: mapped.fileConstraints }
                    : field
            )
        } else {
            fields.push({
                originalName: parent,
                transformedName: toName(parent),
                type,
                fileConstraints: mapped.fileConstraints,
                required: false,
                nullable: false
            })
        }
    }

    // Terapkan wildcard: upgrade field array parent → array of object
    for (const [parent, children] of wildcardChildren) {
        const props = new Map<string, SemanticType>()

        for (const [childName, childRules] of children) {
            const mapped = fieldMapper.mapValidationToType(childRules)
            props.set(toName(childName), mapped.type)
        }

        const elementObject = new ObjectType(
            new ImmutableMap(props),
            new ImmutableSet(new Set(props.keys())),
            undefined, // no base
            [], // no interfaces
            new ImmutableMap(new Map<string, string>([
                ['name', parent],
                ['kind', 'array_element']
            ]))
        )

        const arrayType = new ReadonlyCollectionType(CollectionKind.ARRAY, elementObject)
        const parentField = fields.find(f => f.originalName === parent)

        if (parentField) {
            // Upgrade: items: z.array(z.string()) → z.array(z.object({...}))
            fields = fields.map(f =>
                f.originalName === parent ? { ...f, type: arrayType } : f
            )
        } else {
            // Wildcard tanpa field parent di rules — buat field baru
            fields.push({
                originalName: parent,
                transformedName: toName(parent),
                type: arrayType,
                required: false,
                nullable: false
            })
        }

        console.log(`[CompilerBridge] Resolved array wildcard ${parent}.* → z.array(z.object({ ${Array.from(props.keys()).join(', ')} }))`)
    }

    return fields
}

/**
 * Normalisasi rule string jadi ValidationRule[]
 *
 * Mendukung dua format Laravel:
 * - String pipe: "required|string|max:255"
 * - Array JSON: ['sometimes', 'required', 'email', {}] — item non-string
 *   (opsi parameter) diabaikan, aturan diekstrak dari string saja
 */
function normalizeValidationRules(ruleString: string | string[]): ValidationRule[] {
    const ruleParts = typeof ruleString === 'string'
        ? ruleString.split('|')
        : ruleString.filter((item): item is string => typeof item === 'string')

    return ruleParts.map(rulePart => {
        const [rule, ...params] = rulePart.split(':')
        return {
            rule,
            parameters: params.length > 0 ? params[0].split(',') : []
        }
    })
}

/**
 * Apakah type masih string DEFAULT (tidak ada rule tipe eksplisit)?
 * Digunakan untuk inferensi tipe dari response field senama.
 */
function isDefaultStringType(type: SemanticType): boolean {
    return type instanceof PrimitiveType && type.type === PrimitiveKind.STRING
}

/**
 * Convert RequestField transformedName and nested ObjectType property keys to camelCase for Form types
 */
function convertRequestFieldToCamelCase(field: RequestField): RequestField {
    const transformedName = toCamelCase(field.originalName)
    let type = field.type

    if (
        type instanceof ReadonlyCollectionType &&
        type.elementType instanceof ObjectType
    ) {
        const element = type.elementType
        const newProps = new Map<string, SemanticType>()
        for (const [propName, propType] of element.properties.entries()) {
            newProps.set(toCamelCase(propName), propType)
        }
        const newElement = new ObjectType(
            new ImmutableMap(newProps),
            new ImmutableSet(new Set(newProps.keys())),
            element.baseObject,
            element.interfaces,
            element.annotations
        )
        type = new ReadonlyCollectionType(CollectionKind.ARRAY, newElement)
    } else if (type instanceof ObjectType) {
        const newProps = new Map<string, SemanticType>()
        for (const [propName, propType] of type.properties.entries()) {
            newProps.set(toCamelCase(propName), propType)
        }
        type = new ObjectType(
            new ImmutableMap(newProps),
            new ImmutableSet(new Set(newProps.keys())),
            type.baseObject,
            type.interfaces,
            type.annotations
        )
    }

    return {
        ...field,
        transformedName,
        type
    }
}

/**
 * Upgrade tipe request field dari response field senama yang bertipe number:
 * - primitif string-default → number (kalau ada cocokan)
 * - array-of-object (wildcard items.*) → elemen object string-default yang
 *   cocok juga di-upgrade (rebuild ObjectType — properties immutable)
 */
function inferRequestFieldType(
    field: RequestField,
    responseFields: Record<string, SemanticType>
): RequestField {
    if (isDefaultStringType(field.type)) {
        const inferred = findNumberTypeInResponse(responseFields, field.originalName)
        return inferred ? { ...field, type: inferred } : field
    }

    if (
        field.type instanceof ReadonlyCollectionType
        && field.type.elementType instanceof ObjectType
    ) {
        const element = field.type.elementType
        const newProps = new Map<string, SemanticType>()
        for (const [propName, propType] of element.properties.entries()) {
            if (isDefaultStringType(propType)) {
                const inferred = findNumberTypeInResponse(responseFields, propName)
                newProps.set(propName, inferred ?? propType)
            } else {
                newProps.set(propName, propType)
            }
        }

        // Perlu upgrade? (cek apakah ada yang berubah)
        const changed = element.properties.entries().some(
            ([propName, propType]) => newProps.get(propName) !== propType
        )
        if (!changed) return field

        const newElement = new ObjectType(
            new ImmutableMap(newProps),
            new ImmutableSet(new Set(newProps.keys())),
            element.baseObject,
            element.interfaces,
            element.annotations
        )
        return {
            ...field,
            type: new ReadonlyCollectionType(CollectionKind.ARRAY, newElement)
        }
    }

    return field
}

/**
 * Cari field bertipe number di response fields (rekursif, termasuk nested
 * object dan array-of-object seperti items) dengan nama yang sama persis.
 * Return undefined kalau tidak ketemu atau tipenya bukan number.
 */
function findNumberTypeInResponse(
    fields: Record<string, SemanticType>,
    name: string
): SemanticType | undefined {
    for (const [fieldName, fieldType] of Object.entries(fields)) {
        if (fieldName === name) {
            return fieldType instanceof PrimitiveType && fieldType.type === PrimitiveKind.NUMBER
                ? fieldType
                : undefined
        }

        if (fieldType instanceof ObjectType) {
            const nested = findNumberTypeInResponse(
                Object.fromEntries(fieldType.properties.entries()),
                name
            )
            if (nested) return nested
        }

        if (
            fieldType instanceof ReadonlyCollectionType
            && fieldType.elementType instanceof ObjectType
        ) {
            const nested = findNumberTypeInResponse(
                Object.fromEntries(fieldType.elementType.properties.entries()),
                name
            )
            if (nested) return nested
        }
    }
    return undefined
}

/**
 * Parse validation rules to RequestField array
 */
function parseValidationRules(
    rules: Record<string, string | string[]>,
    fieldMapper: FormFieldMapper,
    context?: { path?: string; method?: string; action?: string }
): RequestField[] {
    const fields: RequestField[] = []
    const wildcardElements = new Map<string, ValidationRule[]>()

    for (const [fieldName, ruleString] of Object.entries(rules)) {
        // Laravel permits both pipe strings and arrays of rule strings.
        if (typeof ruleString !== 'string' && !Array.isArray(ruleString)) {
            console.warn(`[CompilerBridge] Skipping field ${fieldName}: rules is not a string or array`)
            continue
        }

        const parsedRules = normalizeValidationRules(ruleString)

        const wildcardElementMatch = fieldName.match(/^(.+)\.\*$/)
        if (wildcardElementMatch) {
            wildcardElements.set(wildcardElementMatch[1], parsedRules)
            continue
        }

        // Nested object wildcards (items.*.fieldName) are handled only by the
        // contract lowering path, where the object shape is preserved.
        if (fieldName.includes('.*.') || fieldName.includes('.*')) {
            console.warn(`[CompilerBridge] Skipping nested array field: ${fieldName}`)
            continue
        }

        const hasExplicitType = parsedRules.some(r =>
            ['string', 'integer', 'numeric', 'boolean', 'file', 'image', 'mimes', 'mimetypes', 'json', 'date', 'date_format', 'array'].includes(r.rule)
        )
        if (!hasExplicitType) {
            const routeInfo = context?.path
                ? ` pada [${context.method ?? ''} ${context.path}] (${context.action || 'inline'})`
                : ''
            const suggestedType = parsedRules.some(r => r.rule === 'exists') ? 'integer' : 'string'
            console.warn(
                `[CompilerBridge] ⚠️ Tipe field "${fieldName}" tidak dapat dipastikan${routeInfo}. Rule validasi "${fieldName}" tidak menentukan tipe eksplisit (contoh: '${fieldName}' => '${suggestedType}'). Harap perbarui rule validasi pada backend Laravel Anda.`
            )
        }

        // Map to TypeScript type
        const mapped = fieldMapper.mapValidationToType(parsedRules)

        fields.push({
            originalName: fieldName,
            transformedName: toCamelCase(fieldName),
            type: mapped.type,
            fileConstraints: mapped.fileConstraints,
            required: mapped.required,
            nullable: mapped.nullable
        })
    }

    for (const [parent, elementRules] of wildcardElements) {
        const hasExplicitType = elementRules.some(r =>
            ['string', 'integer', 'numeric', 'boolean', 'file', 'image', 'mimes', 'mimetypes', 'json', 'date', 'date_format'].includes(r.rule)
        )
        if (!hasExplicitType) {
            const routeInfo = context?.path
                ? ` pada [${context.method ?? ''} ${context.path}] (${context.action || 'inline'})`
                : ''
            console.warn(
                `[CompilerBridge] ⚠️ Tipe elemen "${parent}.*" tidak dapat dipastikan${routeInfo}. Rule validasi "${parent}.*" tidak menentukan tipe eksplisit (contoh: '${parent}.*' => 'sometimes|string'). Harap perbarui rule validasi pada backend Laravel Anda.`
            )
        }

        const mapped = fieldMapper.mapValidationToType(elementRules)
        const elementType = hasExplicitType ? mapped.type : new PrimitiveType(PrimitiveKind.UNKNOWN)
        const type = new ReadonlyCollectionType(CollectionKind.ARRAY, elementType)
        const parentField = fields.find(field => field.originalName === parent)

        if (parentField) {
            const index = fields.indexOf(parentField)
            fields[index] = { ...parentField, type, fileConstraints: mapped.fileConstraints }
        } else {
            fields.push({
                originalName: parent,
                transformedName: toCamelCase(parent),
                type,
                fileConstraints: mapped.fileConstraints,
                required: false,
                nullable: false
            })
        }
    }

    return fields
}

/**
 * Convert resource fields to nested SemanticTypes preserving ORIGINAL
 * backend structure (nested objects + snake_case field names).
 *
 * Ini satu-satunya konversi bentuk untuk response schema jalur contract:
 * - Nama field dipakai APA ADANYA (snake_case asli, TANPA camelCase)
 * - Object bersarang tetap ObjectType (TANPA flattening ke leaf field)
 * - Reference resource (resolved.type === 'resource', mis. items →
 *   OrderDetailResource::collection()) di-resolve ke ObjectType definisi
 *   resource di manifest — collection → ReadonlyCollectionType
 *
 * @param resource - Resource dari manifest
 * @param allResources - Semua resource (untuk resolve referensi)
 * @param seen - Nama resource yang sedang diproses (deteksi circular)
 * @returns Record nama field → SemanticType (nama asli, bukan camelCase)
 */
function resourceFieldsToNestedTypes(
    resource: ParsedResource,
    allResources: ParsedResource[],
    allModels: ParsedModel[] = [],
    seen: Set<string> = new Set()
): Record<string, SemanticType> {
    const record: Record<string, SemanticType> = {}

    for (const [fieldName, fieldDef] of Object.entries(resource.fields || {})) {
        const fieldType = mapResourceFieldToNestedType(fieldName, fieldDef, allResources, allModels, seen)
        if (fieldType) {
            record[fieldName] = fieldType
        }
    }

    return record
}

/**
 * Bungkus SemanticType dengan penanda nullable untuk response contract.
 *
 * SemanticType (PrimitiveType/ObjectType/...) tidak membawa flag nullable —
 * `nullable` hanya ada di ParsedField/ParsedResponseField (di-set false oleh
 * ContractGeneratorPass.convertSingleField). Pola defensive-null ternary
 * (`is_array($x) ? ($x['k'] ?? null) : null`) terbukti legal-null secara
 * struktural, jadi kita bungkus tipe dasarnya dalam ObjectType sintetis
 * ber-annotation — ContractGeneratorPass.convertSingleField mengenali
 * penanda ini dan meneruskan nullable:true tanpa mengubah vocab SemanticType
 * itu sendiri.
 */
function markNullableSemanticType(baseType: SemanticType): SemanticType {
    return new ObjectType(
        new ImmutableMap(new Map([['__value', baseType]])),
        new ImmutableSet(new Set(['__value'])),
        undefined,
        [],
        new ImmutableMap(new Map([
            ['kind', 'nullable_wrapper'],
            ['__value', 'nullable']
        ]))
    )
}

/**
 * Map satu field resource ke SemanticType (bentuk asli, nested).
 *
 * Resolved check dilakukan SEBELUM switch karena member union tidak
 * mendeklarasikan 'static_method_call' (items di manifest) dan resolved
 * runtime punya lebih banyak metadata (resource/collection) daripada tipe
 * deklarasi ({ type: string }).
 */
function mapResourceFieldToNestedType(
    fieldName: string,
    field: ResourceFieldKind,
    allResources: ParsedResource[],
    allModels: ParsedModel[] = [],
    seen: Set<string> = new Set()
): SemanticType | undefined {
    const resolved = (field as {
        resolved?: { type?: string; resource?: string; collection?: boolean }
    }).resolved

    // Reference ke resource lain — resolve ke ObjectType definisi resource
    // di manifest (bukan ReferenceType → z.unknown())
    if (resolved?.type === 'resource' && resolved.resource) {
        const nested = buildNestedResourceType(
            resolved.resource,
            resolved.collection ?? false,
            allResources,
            allModels,
            seen
        )
        if (nested) {
            console.log(`[CompilerBridge] Resolved ${fieldName} → ${resolved.resource}${resolved.collection ? '[]' : ''}`)
            return nested
        }
    }

    // ternary bukan member union ResourceFieldKind — cek via cast (sama
    // seperti static_method_call). Infer dari branch truthy; pola defensive-
    // null guard `is_array($x) ? ($x['k'] ?? null) : null` (falsy = null,
    // truthy ?? null) menghasilkan tipe NULlABLE dari tipe truthy.
    if ((field as { kind?: string }).kind === 'ternary') {
        const ternary = field as unknown as {
            truthy?: { resolved?: { type?: string; nullable?: boolean } }
            falsy?: { kind?: string; type?: string; value?: unknown }
        }
        const truthyResolved = ternary.truthy?.resolved
        const truthyIsNullish = ternary.truthy?.kind === 'binary_expression'
            && (ternary.truthy as { right?: { kind?: string; value?: unknown } }).right?.kind === 'literal'
            && (ternary.truthy as { right?: { kind?: string; value?: unknown } }).right?.value === null
        const falsyIsNull = ternary.falsy?.kind === 'literal' && ternary.falsy?.value === null

        // `string | null` → z.string().nullable() — bukan z.string() polos:
        // branch falsy (atau `?? null` di truthy) membuktikan null legal.
        const isNullable = truthyResolved?.nullable === true || truthyIsNullish || falsyIsNull

        // json-member: property access JSON yang di-resolve kernel (setelah
        // fix casts di scan/normalizer, $gateway['name'] jadi json-member).
        // Tidak membawa tipe primitif konkret — representasinya string, dan
        // karena seluruh chain ini lahir dari pola `?? null`, selalu nullable.
        const truthyResolvedType = truthyResolved?.type
        const baseType = truthyResolvedType === 'json-member' || truthyResolvedType === 'json-object'
            ? new PrimitiveType(PrimitiveKind.STRING)
            : truthyResolvedType
                ? primitiveStringToSemanticType(truthyResolvedType)
                : new PrimitiveType(PrimitiveKind.STRING)
        return isNullable ? markNullableSemanticType(baseType) : baseType
    }

    switch (field.kind) {
        case 'array': {
            const element = field.element
            const elementType = element && typeof element === 'object'
                ? mapResourceFieldToNestedType(`${fieldName}[]`, element, allResources, allModels, seen)
                : undefined

            // Preserve array semantics even for malformed runtime manifests.
            // A missing/unmappable element becomes z.unknown() downstream, but
            // the contract still states that the field itself is an array.
            return new ReadonlyCollectionType(
                CollectionKind.ARRAY,
                elementType ?? new ReferenceType('App\\Models', 'unknown')
            )
        }

        case 'primitive':
            return PrimitiveTypeFactory.fromString(field.type)

        case 'object': {
            // Nested object — pertahankan sebagai ObjectType (TANPA flattening)
            // Recursively process nested fields
            const nestedProps = new Map<string, SemanticType>()

            for (const [nestedFieldName, nestedFieldDef] of Object.entries(field.fields || {})) {
                const nestedType = mapResourceFieldToNestedType(
                    nestedFieldName,
                    nestedFieldDef,
                    allResources,
                    allModels,
                    seen
                )
                if (nestedType) {
                    nestedProps.set(nestedFieldName, nestedType)
                }
            }

            return new ObjectType(
                new ImmutableMap(nestedProps),
                new ImmutableSet(new Set(nestedProps.keys())),
                undefined, // no base
                [], // no interfaces
                new ImmutableMap(new Map<string, string>([
                    ['name', fieldName],
                    ['kind', 'object']
                ]))
            )
        }

        case 'resource':
            // Field kind='resource' langsung (tanpa resolved) — sama: resolve
            if (field.resource) {
                const nested = buildNestedResourceType(
                    field.resource,
                    field.collection ?? false,
                    allResources,
                    allModels,
                    seen
                )
                if (nested) return nested
            }
            return new ReferenceType('App\\Models', field.resource ?? 'unknown')

        case 'model': {
            if (field.model && allModels) {
                const modelDef = allModels.find(m => m.name === field.model)
                if (modelDef && modelDef.columns && modelDef.columns.length > 0) {
                    const props = new Map<string, SemanticType>()
                    for (const col of modelDef.columns) {
                        const baseType = PrimitiveTypeFactory.fromSqlType(col.type)
                        const colType = col.nullable ? markNullableSemanticType(baseType) : baseType
                        props.set(col.name, colType)
                    }
                    const objType = new ObjectType(
                        new ImmutableMap(props),
                        new ImmutableSet(new Set(props.keys())),
                        undefined,
                        [],
                        new ImmutableMap(new Map<string, string>([
                            ['name', field.model],
                            ['kind', 'model']
                        ]))
                    )
                    return field.collection
                        ? new ReadonlyCollectionType(CollectionKind.ARRAY, objType)
                        : objType
                }
            }
            const modelType = new ReferenceType('App\\Models', field.model)
            return field.collection
                ? new ReadonlyCollectionType(CollectionKind.ARRAY, modelType)
                : modelType
        }

        case 'property_access':
        case 'nullsafe_property_access':
        case 'variable':
        case 'type_cast':
        case 'binary_expression':
        case 'method_call':
        case 'static_method_call':
        case 'literal':
            // Check if resolved refers to a resource or model reference
            if (resolved?.type === 'resource' && resolved?.resource) {
                const nested = buildNestedResourceType(
                    resolved.resource,
                    resolved.collection ?? false,
                    allResources,
                    allModels,
                    seen
                )
                if (nested) return nested
                const ref = new ReferenceType('App\\Http\\Resources', resolved.resource)
                return resolved.collection
                    ? new ReadonlyCollectionType(CollectionKind.ARRAY, ref)
                    : ref
            }
            if (resolved?.type === 'model' && resolved?.model) {
                const ref = new ReferenceType('App\\Models', resolved.model)
                return resolved.collection
                    ? new ReadonlyCollectionType(CollectionKind.ARRAY, ref)
                    : ref
            }
            // Infer type dari resolved metadata (sama dengan flatten)
            return resolved?.type
                ? primitiveStringToSemanticType(resolved.type)
                : new PrimitiveType(PrimitiveKind.STRING)

        default:
            // model / unknown / (static_method_call tanpa resolved) —
            // opaque, mapper akan fallback ke z.unknown()
            return new ReferenceType(
                'App\\Models',
                field.kind === 'model' ? field.model ?? 'unknown' : 'unknown'
            )
    }
}

/** Build the element type for an inline response marked `collection: true`. */
function buildInlineObjectType(
    name: string,
    fields: Record<string, SemanticType>
): ObjectType {
    const properties = new Map(Object.entries(fields))

    return new ObjectType(
        new ImmutableMap(properties),
        new ImmutableSet(new Set(properties.keys())),
        undefined,
        [],
        new ImmutableMap(new Map<string, string>([
            ['name', name],
            ['kind', 'object']
        ]))
    )
}

/**
 * Build ObjectType dari definisi resource di manifest (nested, nama asli).
 * collection → ReadonlyCollectionType(ARRAY, ObjectType)
 *
 * Guard circular reference: resource yang sedang diproses (di `seen`)
 * tidak di-resolve ulang.
 */
function buildNestedResourceType(
    resourceName: string,
    collection: boolean,
    allResources: ParsedResource[],
    allModels: ParsedModel[] = [],
    seen: Set<string> = new Set()
): SemanticType | undefined {
    if (seen.has(resourceName)) {
        console.warn(`[CompilerBridge] Circular resource reference detected: ${resourceName}. Skipping.`)
        return undefined
    }

    const target = allResources.find(r => r.name === resourceName)
    if (!target) return undefined

    const nextSeen = new Set(seen)
    nextSeen.add(resourceName)

    const nestedTypes = resourceFieldsToNestedTypes(target, allResources, allModels, nextSeen)
    const props = new Map(Object.entries(nestedTypes))

    const nestedObject = new ObjectType(
        new ImmutableMap(props),
        new ImmutableSet(new Set(props.keys())),
        undefined, // no base
        [], // no interfaces
        new ImmutableMap(new Map<string, string>([
            ['name', target.name],
            ['kind', 'resource']
        ]))
    )

    return collection
        ? new ReadonlyCollectionType(CollectionKind.ARRAY, nestedObject)
        : nestedObject
}

/**
 * Extract resource name from route path
 * Examples: /api/users/{id} → users, /api/cart/items → cart
 */
function extractResourceName(route: ParsedRoute): string | null {
    // Remove leading slash and split by slash
    const rawSegments = route.path.replace(/^\//, '').split('/')
        .filter(segment => segment && segment !== 'api' && !segment.startsWith('{'))

    if (rawSegments.length === 0) {
        return null
    }

    const camelSegments = rawSegments.map((seg, idx) => {
        const sanitized = sanitizeResourceName(seg)
        return idx === 0 ? sanitized : toPascalCase(sanitized)
    })

    return camelSegments.join('')
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
