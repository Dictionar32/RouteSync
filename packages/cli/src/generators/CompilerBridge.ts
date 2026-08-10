/**
 * CompilerBridge.ts - REFACTORED
 * Pure orchestration bridge between CLI manifest and compiler
 * 
 * BEFORE: 516 lines with architecture violations
 * AFTER:  ~250 lines of clean orchestration
 * 
 * Changes:
 * - Removed dead code (resourceFieldToSemanticType)
 * - Extracted type factories to PrimitiveTypeFactory
 * - Using existing resource-flattening utility
 * - Imported naming utilities from core
 * - Split manifestToSemanticTypes into focused methods
 * - Added manifestToRequestTypes for form generation
 */

// Import types
import type { ParsedModel, ParsedResource, ParsedRoute } from '../../../core/src/types/route'
import type { RouteManifest } from '../../../core/src/types/route'
import type { SemanticType } from '../../../core/src/compiler/types/SemanticType'
import { TypeScriptGeneratorPass } from '../../../core/src/compiler/passes/TypeScriptGeneratorPass'
import type { SemanticTypesArtifact } from '../../../core/src/compiler/passes/TypeScriptGeneratorPass'
import type { GeneratedTypeScriptArtifact } from '../../../core/src/compiler/artifacts/GeneratedTypeScriptArtifact'
import { FormGeneratorPass } from '../../../core/src/compiler/passes/FormGeneratorPass'
import type { RequestTypesArtifact, RequestType, FormAction, RequestField } from '../../../core/src/compiler/artifacts/RequestTypesArtifact'
import type { GeneratedFormArtifact } from '../../../core/src/compiler/artifacts/GeneratedFormArtifact'
import { ContractGeneratorPass } from '../../../core/src/compiler/passes/ContractGeneratorPass'
import type { GeneratedContractArtifact } from '../../../core/src/compiler/artifacts/GeneratedContractArtifact'
import { ImmutableMap, ImmutableSet } from '../../../core/src/compiler/utils/ImmutableCollections'
import { ObjectType } from '../../../core/src/compiler/types/SemanticType'

// ✅ Import utilities (not defined here)
import { toCamelCase, toPascalCase } from '../../../core/src/utils/resource-naming'
import { flattenResourceFields } from './utils/resource-flattening'
import { PrimitiveTypeFactory } from './utils/PrimitiveTypeFactory'
import { FormFieldMapper } from '../../../core/src/compiler/generators/form-generation/FormFieldMapper'

/**
 * Output from compiler bridge
 * Result generation ready to write to files
 */
export interface CompilerOutput {
    readonly code: string
    readonly imports: readonly string[]
    readonly interfaces: readonly string[]
    readonly metadata: {
        readonly typeCount: number
        readonly interfaceCount: number
        readonly linesOfCode: number
        readonly warnings: readonly string[]
    }
}

/**
 * Form output from compiler bridge
 * Form type generation ready to write to forms/api-form.ts
 */
export interface FormOutput {
    readonly code: string
    readonly formTypes: readonly string[]
    readonly metadata: {
        readonly formTypeCount: number
        readonly totalActions: number
        readonly linesOfCode: number
        readonly warnings: readonly string[]
    }
}

/**
 * Contract output from compiler bridge
 * Contract generation ready to write to contracts/api-contract.ts
 */
export interface ContractOutput {
    readonly code: string
    readonly contracts: readonly string[]
    readonly metadata: {
        readonly contractCount: number
        readonly totalActions: number
        readonly zodSchemasCount: number
        readonly validatorsCount: number
        readonly linesOfCode: number
        readonly warnings: readonly string[]
    }
}

/**
 * CompilerBridge class
 * Main orchestrator for bridge manifest → compiler → output
 */
export class CompilerBridge {
    /**
     * Generate TypeScript from manifest
     * Pure orchestration - delegates to utilities and passes
     * 
     * @param manifest - RouteManifest from CLI scan
     * @returns CompilerOutput ready to write to files
     */
    static async generateTypeScript(manifest: RouteManifest): Promise<CompilerOutput> {
        console.log('[CompilerBridge] Starting generation...')

        // Step 1: Convert manifest to SemanticTypes
        const semanticTypesArtifact = this.manifestToSemanticTypes(manifest)
        console.log(`[CompilerBridge] Converted ${semanticTypesArtifact.types.length} types`)

        // Step 2: Execute TypeScriptGeneratorPass
        const pass = new TypeScriptGeneratorPass()

        try {
            const inputArtifact: SemanticTypesArtifact = {
                ...semanticTypesArtifact,
                types: Array.from(semanticTypesArtifact.types)
            }

            const [generatedArtifact]: readonly [GeneratedTypeScriptArtifact] = pass.run([inputArtifact])

            console.log(`[CompilerBridge] Generation complete:`)
            console.log(`  - Type count: ${generatedArtifact.generationMetadata.typeCount}`)
            console.log(`  - Interface count: ${generatedArtifact.generationMetadata.interfaceCount}`)
            console.log(`  - Lines of code: ${generatedArtifact.generationMetadata.linesOfCode}`)

            // Step 3: Format output for CLI
            return this.formatCompilerOutput(generatedArtifact, manifest)
        } catch (error) {
            console.error('[CompilerBridge] Error during execution:', error)
            throw new Error(
                `CompilerBridge generation failed: ${error instanceof Error ? error.message : String(error)}`
            )
        }
    }

    /**
     * Generate form types from manifest
     * Pure orchestration - delegates to FormGeneratorPass
     * 
     * @param manifest - RouteManifest from CLI scan (uses validation rules)
     * @returns FormOutput ready to write to forms/api-form.ts
     */
    static async generateFormTypes(manifest: RouteManifest): Promise<FormOutput> {
        console.log('[CompilerBridge] Starting form generation...')

        // Step 1: Convert manifest to RequestTypes
        const requestTypesArtifact = this.manifestToRequestTypes(manifest)
        console.log(`[CompilerBridge] Extracted ${requestTypesArtifact.requestTypes.length} request types`)

        // Step 2: Execute FormGeneratorPass
        const pass = new FormGeneratorPass()

        try {
            const [generatedArtifact]: readonly [GeneratedFormArtifact] = pass.run([requestTypesArtifact])

            console.log(`[CompilerBridge] Form generation complete:`)
            console.log(`  - Form type count: ${generatedArtifact.generationMetadata.formTypeCount}`)
            console.log(`  - Total actions: ${generatedArtifact.generationMetadata.totalActions}`)
            console.log(`  - Lines of code: ${generatedArtifact.generationMetadata.linesOfCode}`)

            // Step 3: Format output for CLI
            return this.formatFormOutput(generatedArtifact, manifest)
        } catch (error) {
            console.error('[CompilerBridge] Error during form generation:', error)
            throw new Error(
                `CompilerBridge form generation failed: ${error instanceof Error ? error.message : String(error)}`
            )
        }
    }

    /**
     * Generate contract types from manifest
     * Pure orchestration - delegates to ContractGeneratorPass
     * 
     * 🚨 IMPORTANT: Contracts need ORIGINAL manifest data (nested + snake_case)
     * - DO NOT use manifestToRequestTypes (that flattens for forms)
     * - Create contract-specific input that preserves backend structure
     * 
     * @param manifest - RouteManifest from CLI scan (uses validation rules)
     * @returns ContractOutput ready to write to contracts/api-contract.ts
     */
    static async generateContractTypes(manifest: RouteManifest): Promise<ContractOutput> {
        console.log('[CompilerBridge] Starting contract generation...')

        // Step 1: Convert manifest to ContractInput (preserves original structure)
        const requestTypesArtifact = this.manifestToContractInput(manifest)
        console.log(`[CompilerBridge] Extracted ${requestTypesArtifact.requestTypes.length} request types`)

        // Step 2: Execute ContractGeneratorPass
        const pass = new ContractGeneratorPass()

        try {
            const [generatedArtifact]: readonly [GeneratedContractArtifact] = pass.run([requestTypesArtifact])

            console.log(`[CompilerBridge] Contract generation complete:`)
            console.log(`  - Contract count: ${generatedArtifact.generationMetadata.contractCount}`)
            console.log(`  - Total actions: ${generatedArtifact.generationMetadata.totalActions}`)
            console.log(`  - Zod schemas: ${generatedArtifact.generationMetadata.zodSchemasCount}`)
            console.log(`  - Validators: ${generatedArtifact.generationMetadata.validatorsCount}`)
            console.log(`  - Lines of code: ${generatedArtifact.generationMetadata.linesOfCode}`)

            // Step 3: Format output for CLI
            return this.formatContractOutput(generatedArtifact, manifest)
        } catch (error) {
            console.error('[CompilerBridge] Error during contract generation:', error)
            throw new Error(
                `CompilerBridge contract generation failed: ${error instanceof Error ? error.message : String(error)}`
            )
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
    private static manifestToContractInput(manifest: RouteManifest): RequestTypesArtifact {
        const requestTypes: RequestType[] = []
        const fieldMapper = new FormFieldMapper()

        // Group routes by resource name (include ALL methods for response extraction)
        const routesByResource = new Map<string, typeof manifest.routes>()

        for (const route of manifest.routes || []) {
            // Extract resource name from path
            let resourceName = this.extractResourceName(route)
            if (!resourceName) {
                continue
            }

            // 🔧 FIX BUG 1: Sanitize resource name (kebab-case → camelCase)
            resourceName = this.sanitizeResourceName(resourceName)

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
                const action = this.determineAction(route.method)
                if (!action) continue

                // 🔧 FIX BUG 2: Parse validation rules WITHOUT flattening
                const fields = this.parseValidationRulesPreserveNested(
                    route.schema?.rules || ({} as Record<string, string>),
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
    private static sanitizeResourceName(resourceName: string): string {
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
    private static parseValidationRulesPreserveNested(
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
     * Convert RouteManifest to RequestTypesArtifact (for form generation)
     * Extract validation rules from routes and group by resource
     * FLATTENS nested objects and transforms to camelCase
     * 
     * @param manifest - Input manifest from CLI scan
     * @returns RequestTypesArtifact for FormGeneratorPass
     */
    private static manifestToRequestTypes(manifest: RouteManifest): RequestTypesArtifact {
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
            const resourceName = this.extractResourceName(route)
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
                const action = this.determineAction(route.method)
                if (!action) continue

                // Parse validation rules
                const fields = this.parseValidationRules(
                    route.schema?.rules || ({} as Record<string, string>),
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
     * Extract resource name from route path
     * Examples: /api/users/{id} → users, /api/cart/items → cart
     */
    private static extractResourceName(route: ParsedRoute): string | null {
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
    private static determineAction(method: string): 'create' | 'update' | null {
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

    /**
     * Parse validation rules to RequestField array
     */
    private static parseValidationRules(
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
     * Format GeneratedFormArtifact to FormOutput
     * Extracts data from artifact and formats for CLI consumption
     */
    private static formatFormOutput(
        artifact: GeneratedFormArtifact,
        manifest: RouteManifest
    ): FormOutput {
        // Extract form type names
        const formTypes = artifact.formTypes.map(ft => ft.name)

        // Collect warnings
        const warnings: string[] = [...artifact.generationMetadata.warnings]

        if (artifact.generationMetadata.formTypeCount === 0) {
            warnings.push('No validation rules found in manifest')
        }

        return {
            code: artifact.code,
            formTypes,
            metadata: {
                formTypeCount: artifact.generationMetadata.formTypeCount,
                totalActions: artifact.generationMetadata.totalActions,
                linesOfCode: artifact.generationMetadata.linesOfCode,
                warnings
            }
        }
    }

    /**
     * Format GeneratedContractArtifact to ContractOutput
     * Extracts data from artifact and formats for CLI consumption
     */
    private static formatContractOutput(
        artifact: GeneratedContractArtifact,
        manifest: RouteManifest
    ): ContractOutput {
        // Extract contract names
        const contracts = artifact.contracts.map(c => c.name)

        // Collect warnings
        const warnings: string[] = [...artifact.generationMetadata.warnings]

        if (artifact.generationMetadata.contractCount === 0) {
            warnings.push('No validation rules found in manifest')
        }

        return {
            code: artifact.code,
            contracts,
            metadata: {
                contractCount: artifact.generationMetadata.contractCount,
                totalActions: artifact.generationMetadata.totalActions,
                zodSchemasCount: artifact.generationMetadata.zodSchemasCount,
                validatorsCount: artifact.generationMetadata.validatorsCount,
                linesOfCode: artifact.generationMetadata.linesOfCode,
                warnings
            }
        }
    }

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
    private static manifestToSemanticTypes(manifest: RouteManifest): SemanticTypesArtifact {
        const typesArray: ObjectType[] = []

        // ❌ SKIP models - not needed for API types
        // Models are database tables, not API responses
        // const modelTypes = this.processModels(manifest.models || [])
        // typesArray.push(...modelTypes)

        // ✅ Convert resources ONLY
        const resourceTypes = this.processResources(manifest.resources || [])
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
     * Process models from manifest
     * Converts database models to ObjectType instances
     * 
     * @param models - Array of ParsedModel from manifest
     * @returns Array of ObjectType for semantic types
     */
    private static processModels(models: ParsedModel[]): ObjectType[] {
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
     * Process resources from manifest
     * Uses flattenResourceFields utility for nested objects
     * 
     * @param resources - Array of ParsedResource from manifest
     * @returns Array of ObjectType for semantic types
     */
    private static processResources(resources: ParsedResource[]): ObjectType[] {
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
     * Format GeneratedTypeScriptArtifact to CompilerOutput
     * Extracts data from artifact and formats for CLI consumption
     * 
     * @param artifact - Generated artifact from TypeScriptGeneratorPass
     * @param manifest - Original manifest for warnings
     * @returns CompilerOutput formatted for CLI
     */
    private static formatCompilerOutput(
        artifact: GeneratedTypeScriptArtifact,
        manifest: RouteManifest
    ): CompilerOutput {
        // Format imports as strings
        const imports = artifact.imports.map(imp =>
            `import { ${imp.names.join(', ')} } from '${imp.from}'`
        )

        // Extract interface names
        const interfaces = artifact.interfaces.map(iface => iface.name)

        // Collect warnings
        const warnings: string[] = [...artifact.generationMetadata.warnings]

        if (!manifest.models || manifest.models.length === 0) {
            warnings.push('No models found in manifest')
        }
        if (!manifest.resources || manifest.resources.length === 0) {
            warnings.push('No resources found in manifest')
        }

        return {
            code: artifact.code,
            imports,
            interfaces,
            metadata: {
                typeCount: artifact.generationMetadata.typeCount,
                interfaceCount: artifact.generationMetadata.interfaceCount,
                linesOfCode: artifact.generationMetadata.linesOfCode,
                warnings
            }
        }
    }
}
