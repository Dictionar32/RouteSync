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
import { ObjectType, ReadonlyCollectionType, CollectionKind, PrimitiveType, PrimitiveKind, ReferenceType } from '../../../../core/src/compiler/types/SemanticType'
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
        // Fields response resource group ini (juga saat responseData di-skip
        // dedupe) — dipakai untuk inferensi tipe request field.
        let inferenceFields: Record<string, SemanticType> | undefined

        // ✅ FIX #2: cari response di route method APAPUN (bukan GET-only).
        // Urutan prioritas: GET dulu (index/show resource path sendiri),
        // lalu route lain (POST /payment/{orderId} → PaymentResource,
        // POST /cart/items → OrderResource).
        const responseRoutes = routes.filter(
            r => r.response && (r.response.kind === 'resource' || r.response.kind === 'model')
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
                            new Set()
                        )
                    }
                } else {
                    // Find resource definition in manifest
                    const resource = manifest.resources?.find(r => r.name === responseResourceName)

                    if (resource) {
                        console.log(`[CompilerBridge] Extracting response data for ${resourceName} from ${responseResourceName} (${routeWithResponse.method})`)

                        // ✅ Konversi resource fields ke SemanticType dengan bentuk
                        // ASLI (nested + snake_case) — TANPA flattening, TANPA
                        // camelCase. Sesuai desain manifestToContractInput:
                        // "Preserves ORIGINAL backend structure".
                        // - Nama field dipakai apa adanya (originalName)
                        // - Object bersarang tetap ObjectType (bukan di-flatten)
                        // - Reference resource (items → OrderDetailResource)
                        //   di-resolve ke ObjectType definisi resource di manifest
                        //   (collection → ReadonlyCollectionType)
                        const fieldsRecord = resourceFieldsToNestedTypes(
                            resource,
                            manifest.resources || [],
                            new Set()
                        )

                        responseData = {
                            resourceName: resource.name,
                            fields: fieldsRecord
                        }

                        inferenceFields = fieldsRecord
                        processedResponseResources.add(responseResourceName)

                        console.log(`[CompilerBridge] Extracted ${Object.keys(fieldsRecord).length} response fields`)
                    } else {
                        console.warn(`[CompilerBridge] Resource ${responseResourceName} not found in manifest`)
                    }
                }
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
    rules: Record<string, string | string[]>,
    fieldMapper: FormFieldMapper
): RequestField[] {
    let fields: RequestField[] = []

    // Wildcard children: parent → childName → parsed rules
    // (mis. checkout items.*.produk_item_id → elemen dari items)
    const wildcardChildren = new Map<string, Map<string, ValidationRule[]>>()

    for (const [fieldName, ruleString] of Object.entries(rules)) {
        // ✅ FIX #5: dukung rule format array JSON
        // (['sometimes','required','email',{}]) bukan hanya string pipe
        if (typeof ruleString !== 'string' && !Array.isArray(ruleString)) {
            console.warn(`[CompilerBridge] Skipping field ${fieldName}: rules is not a string or array`)
            continue
        }

        const parsedRules = normalizeValidationRules(ruleString)

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

    // Terapkan wildcard: upgrade field array parent → array of object
    for (const [parent, children] of wildcardChildren) {
        const props = new Map<string, SemanticType>()

        for (const [childName, childRules] of children) {
            const mapped = fieldMapper.mapValidationToType(childRules)
            props.set(childName, mapped.type)
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
                transformedName: parent,
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
    if (typeof ruleString === 'string') {
        // Format: "required|string|max:255"
        return ruleString.split('|').map(r => {
            const [rule, ...params] = r.split(':')
            return {
                rule,
                parameters: params.length > 0 ? params[0].split(',') : []
            }
        })
    }

    // Format array: ['sometimes', 'required', 'email', {}]
    return ruleString
        .filter((item): item is string => typeof item === 'string')
        .map(rule => ({ rule, parameters: [] }))
}

/**
 * Apakah type masih string DEFAULT (tidak ada rule tipe eksplisit)?
 * Digunakan untuk inferensi tipe dari response field senama.
 */
function isDefaultStringType(type: SemanticType): boolean {
    return type instanceof PrimitiveType && type.type === PrimitiveKind.STRING
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
    seen: Set<string>
): Record<string, SemanticType> {
    const record: Record<string, SemanticType> = {}

    for (const [fieldName, fieldDef] of Object.entries(resource.fields || {})) {
        const fieldType = mapResourceFieldToNestedType(fieldName, fieldDef, allResources, seen)
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
    seen: Set<string>
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
        case 'primitive':
            return PrimitiveTypeFactory.fromString(field.type)

        case 'object': {
            // Nested object — pertahankan sebagai ObjectType (TANPA flattening)
            const nestedTypes = resourceFieldsToNestedTypes(
                { name: fieldName, fields: field.fields || {} } as ParsedResource,
                allResources,
                seen
            )
            const props = new Map(Object.entries(nestedTypes))
            return new ObjectType(
                new ImmutableMap(props),
                new ImmutableSet(new Set(props.keys())),
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
                    seen
                )
                if (nested) return nested
            }
            return new ReferenceType('App\\Models', field.resource ?? 'unknown')

        case 'property_access':
        case 'nullsafe_property_access':
        case 'variable':
        case 'type_cast':
        case 'binary_expression':
        case 'method_call':
        case 'literal':
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
    seen: Set<string>
): SemanticType | undefined {
    if (seen.has(resourceName)) {
        console.warn(`[CompilerBridge] Circular resource reference detected: ${resourceName}. Skipping.`)
        return undefined
    }

    const target = allResources.find(r => r.name === resourceName)
    if (!target) return undefined

    const nextSeen = new Set(seen)
    nextSeen.add(resourceName)

    const nestedTypes = resourceFieldsToNestedTypes(target, allResources, nextSeen)
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
