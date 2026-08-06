/**
 * CompilerBridge.ts
 * Bridge antara CLI manifest dan compiler pass system
 * 
 * File ini menghubungkan:
 * - RouteManifest (dari CLI scanning) → SemanticTypes (untuk compiler)
 * - TypeScriptGeneratorPass (dari compiler) → Generated files (untuk CLI output)
 */

// Import types yang dibutuhkan
import type { RouteManifest } from '../../../core/src/types/route'
import { TypeScriptGeneratorPass } from '../../../core/src/compiler/passes/TypeScriptGeneratorPass'
import type { SemanticTypesArtifact } from '../../../core/src/compiler/passes/TypeScriptGeneratorPass'
import { ImmutableMap, ImmutableSet } from '../../../core/src/compiler/utils/ImmutableCollections'
import { PrimitiveType, PrimitiveKind, ObjectType } from '../../../core/src/compiler/types/SemanticType'

/**
 * Output dari compiler bridge
 * Hasil generation yang siap ditulis ke file
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
 * Context for nested object flattening (Phase 2)
 * Tracks state during recursive traversal of ResourceFieldKind
 */
interface FlatteningContext {
    /** Current property path prefix (e.g., 'shipping', 'shippingAddress') */
    readonly prefix: string

    /** Visited fields for circular reference detection */
    readonly visited: WeakSet<object>

    /** Used property names for collision detection */
    readonly usedNames: Set<string>

    /** Maximum nesting depth to prevent stack overflow */
    readonly maxDepth: number

    /** Current depth in recursion */
    readonly currentDepth: number
}

/**
 * Result of flattening one ResourceFieldKind
 * Represents a single flattened property with its type
 */
interface FlattenedProperty {
    /** Final camelCase property name (e.g., 'shippingAddress') */
    readonly name: string

    /** Semantic type for this property */
    readonly type: PrimitiveType

    /** Original path for debugging (e.g., 'shipping.address') */
    readonly originalPath: string

    /** Whether this property can be null */
    readonly nullable: boolean
}

/**
 * CompilerBridge class
 * Main orchestrator untuk bridge manifest → compiler → output
 */
export class CompilerBridge {
    /**
     * Convert snake_case to camelCase
     * Examples: user_id → userId, total_harga → totalHarga
     * 
     * @param str - Snake case string
     * @returns Camel case string
     */
    private static toCamelCase(str: string): string {
        return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
    }

    /**
     * Capitalize first letter of string
     * Used for building nested property paths (e.g., 'address' → 'Address')
     * 
     * @param str - Input string
     * @returns String with first letter capitalized
     */
    private static capitalize(str: string): string {
        if (!str) return str
        return str.charAt(0).toUpperCase() + str.slice(1)
    }

    /**
     * Convert primitive type string to SemanticType (PrimitiveType)
     * Handles various type string formats from manifest resolved.type
     * 
     * @param typeStr - Type string from manifest (e.g., 'number', 'string', 'boolean')
     * @returns Corresponding PrimitiveType
     */
    private static primitiveStringToSemanticType(typeStr: string): PrimitiveType {
        const normalized = typeStr.toLowerCase()

        if (normalized === 'number' || normalized === 'int' || normalized === 'float' || normalized === 'double') {
            return new PrimitiveType(PrimitiveKind.NUMBER)
        }
        if (normalized === 'boolean' || normalized === 'bool') {
            return new PrimitiveType(PrimitiveKind.BOOLEAN)
        }
        if (normalized === 'datetime' || normalized === 'date' || normalized === 'timestamp') {
            return new PrimitiveType(PrimitiveKind.DATETIME)
        }

        // Default to string for text, varchar, char, etc.
        return new PrimitiveType(PrimitiveKind.STRING)
    }

    /**
     * Flatten nested ResourceFieldKind into flat properties (Phase 2)
     * Recursively traverses nested objects and builds flat camelCase property names
     * 
     * Evidence-based implementation using ACTUAL ResourceFieldKind type
     * from packages/core/src/types/route.ts
     * 
     * Example:
     *   Input: { kind: 'object', fields: { address: { kind: 'primitive', type: 'string' } } }
     *   Context: { prefix: 'shipping', ... }
     *   Output: [{ name: 'shippingAddress', type: PrimitiveType(STRING), ... }]
     * 
     * @param field - ResourceFieldKind from manifest
     * @param context - Flattening context with prefix, visited set, etc.
     * @returns Array of flattened properties
     */
    private static flattenResourceField(
        field: any, // ResourceFieldKind from route.ts
        context: FlatteningContext
    ): readonly FlattenedProperty[] {
        const results: FlattenedProperty[] = []

        // Depth limit protection
        if (context.currentDepth > context.maxDepth) {
            console.warn(`[CompilerBridge] Max depth ${context.maxDepth} reached at "${context.prefix}"`)
            return results
        }

        // Circular reference check
        if (typeof field === 'object' && field !== null && context.visited.has(field)) {
            console.warn(`[CompilerBridge] Circular reference detected at "${context.prefix}"`)
            return results
        }

        const newVisited = new WeakSet(context.visited)
        if (typeof field === 'object' && field !== null) {
            newVisited.add(field)
        }

        // Type-safe discriminated union handling based on ResourceFieldKind
        const kind = field?.kind

        switch (kind) {
            case 'primitive': {
                // Base case: primitive type
                const propName = context.prefix || 'unknownProp'
                const nullable = field.nullable ?? false
                const typeStr = field.type || 'string'

                results.push({
                    name: propName,
                    type: this.primitiveStringToSemanticType(typeStr),
                    originalPath: context.prefix,
                    nullable
                })
                break
            }

            case 'property_access': {
                // Handle property_access kind (most common in real manifests!)
                // Extract type from resolved.type
                const resolvedType = field.resolved?.type || 'string'
                const propName = context.prefix || 'unknownProp'
                const nullable = field.nullable ?? false

                results.push({
                    name: propName,
                    type: this.primitiveStringToSemanticType(resolvedType),
                    originalPath: context.prefix,
                    nullable
                })
                break
            }

            case 'variable': {
                // Handle variable kind - extract from resolved
                const resolvedType = field.resolved?.type || 'string'
                const propName = context.prefix || 'unknownVar'
                const nullable = field.nullable ?? false

                results.push({
                    name: propName,
                    type: this.primitiveStringToSemanticType(resolvedType),
                    originalPath: context.prefix,
                    nullable
                })
                break
            }

            case 'object': {
                // Recursive case: nested object
                if (!field.fields || typeof field.fields !== 'object') {
                    console.warn(`[CompilerBridge] Object has no fields at "${context.prefix}"`)
                    break
                }

                for (const [key, nestedField] of Object.entries(field.fields)) {
                    const camelKey = this.toCamelCase(key)

                    // Build path: 'shipping' + 'Address' = 'shippingAddress'
                    const fullPrefix = context.prefix
                        ? `${context.prefix}${this.capitalize(camelKey)}`
                        : camelKey

                    const nestedContext: FlatteningContext = {
                        prefix: fullPrefix,
                        visited: newVisited,
                        usedNames: context.usedNames,
                        maxDepth: context.maxDepth,
                        currentDepth: context.currentDepth + 1
                    }

                    // Recurse into nested field
                    const nestedResults = this.flattenResourceField(nestedField, nestedContext)
                    results.push(...nestedResults)
                }
                break
            }

            case 'model':
            case 'resource': {
                // Model/Resource reference - treat as string for Phase 2
                // Phase 3 could expand this to follow references
                const propName = context.prefix || 'unknownModel'
                const nullable = field.nullable ?? false

                results.push({
                    name: propName,
                    type: new PrimitiveType(PrimitiveKind.STRING),
                    originalPath: context.prefix,
                    nullable
                })
                break
            }

            case 'unknown':
            default: {
                // Unknown type - fallback to string
                const propName = context.prefix || 'unknownProp'

                results.push({
                    name: propName,
                    type: new PrimitiveType(PrimitiveKind.STRING),
                    originalPath: context.prefix,
                    nullable: true
                })
                break
            }
        }

        return results
    }

    /**
     * Generate TypeScript from manifest
     * 
     * @param manifest - RouteManifest dari CLI scan
     * @returns CompilerOutput yang siap ditulis ke file
     */
    static async generateTypeScript(manifest: RouteManifest): Promise<CompilerOutput> {
        console.log('[CompilerBridge] Starting generation...')

        // Step 1: Convert manifest to SemanticTypes
        const semanticTypesArtifact = this.manifestToSemanticTypes(manifest)
        const typeCount = Array.from(semanticTypesArtifact.types.values()).length
        console.log(`[CompilerBridge] Converted ${typeCount} types from manifest`)

        // Step 2: Execute TypeScriptGeneratorPass directly (like E2E tests)
        const pass = new TypeScriptGeneratorPass()

        try {
            // Step 3: Run pass dengan artifact array (sesuai interface CompilerPass)
            const types = Array.from(semanticTypesArtifact.types.values())
            const inputArtifact: SemanticTypesArtifact = {
                ...semanticTypesArtifact,
                types // Pass expects readonly SemanticType[]
            }

            const [generatedArtifact] = pass.run([inputArtifact])
            console.log(`[CompilerBridge] Generation complete:`)
            console.log(`  - Type count: ${generatedArtifact.generationMetadata.typeCount}`)
            console.log(`  - Interface count: ${generatedArtifact.generationMetadata.interfaceCount}`)
            console.log(`  - Lines of code: ${generatedArtifact.generationMetadata.linesOfCode}`)

            // Step 4: Extract data from artifact dan format untuk CLI
            const imports = generatedArtifact.imports.map(imp =>
                `import { ${imp.names.join(', ')} } from '${imp.from}'`
            )

            const interfaces = generatedArtifact.interfaces.map(iface => iface.name)

            // Collect warnings
            const warnings: string[] = [...generatedArtifact.generationMetadata.warnings]
            if (!manifest.models || manifest.models.length === 0) {
                warnings.push('No models found in manifest')
            }
            if (!manifest.resources || manifest.resources.length === 0) {
                warnings.push('No resources found in manifest')
            }

            return {
                code: generatedArtifact.code,
                imports,
                interfaces,
                metadata: {
                    typeCount: generatedArtifact.generationMetadata.typeCount,
                    interfaceCount: generatedArtifact.generationMetadata.interfaceCount,
                    linesOfCode: generatedArtifact.generationMetadata.linesOfCode,
                    warnings
                }
            }
        } catch (error) {
            console.error('[CompilerBridge] Error during execution:', error)
            throw new Error(`CompilerBridge generation failed: ${error instanceof Error ? error.message : String(error)}`)
        }
    }

    /**
     * Convert RouteManifest to SemanticTypesArtifact
     * DATA FLOW: Manifest → SemanticTypes
     * 
     * @param manifest - Input manifest dari CLI scan
     * @returns SemanticTypesArtifact untuk compiler passes
     */
    private static manifestToSemanticTypes(manifest: RouteManifest): SemanticTypesArtifact {
        const typesMap = new Map<string, ObjectType>()

        // Convert models to ObjectTypes
        for (const model of manifest.models || []) {
            const properties = new Map<string, PrimitiveType>()

            // Convert each column to property dengan camelCase
            for (const column of model.columns || []) {
                const camelName = this.toCamelCase(column.name)  // ✅ snake → camel
                const columnType = this.sqlToSemanticType(column.type)
                properties.set(camelName, columnType)  // ✅ camelCase property
            }

            // Create ObjectType for model dengan annotations
            const objectType = new ObjectType(
                new ImmutableMap(properties),
                new ImmutableSet(new Set(model.columns?.map(c => this.toCamelCase(c.name)) || [])),
                undefined, // no base
                [], // no interfaces
                new ImmutableMap(new Map([
                    ['name', model.name],    // ✅ Name: "Order", "User", etc
                    ['kind', 'model']        // ✅ Kind: DB model (no Show/Index)
                ]))
            )

            typesMap.set(model.name, objectType)
        }

        // Convert resources to ObjectTypes
        for (const resource of manifest.resources || []) {
            const properties = new Map<string, PrimitiveType>()

            // Convert each field to property dengan camelCase
            for (const [fieldName, fieldKind] of Object.entries(resource.fields || {})) {
                const camelName = this.toCamelCase(fieldName)  // ✅ snake → camel
                const fieldType = this.resourceFieldToSemanticType(fieldKind)
                properties.set(camelName, fieldType)  // ✅ camelCase property
            }

            // Create ObjectType for resource dengan annotations
            const objectType = new ObjectType(
                new ImmutableMap(properties),
                new ImmutableSet(new Set(Object.keys(resource.fields || {}).map(k => this.toCamelCase(k)))),
                undefined, // no base
                [], // no interfaces
                new ImmutableMap(new Map([
                    ['name', resource.name],     // ✅ Name: "OrderResource"
                    ['kind', 'resource']         // ✅ Kind: Resource (has Show/Index)
                ]))
            )

            typesMap.set(resource.name, objectType)
        }

        // Convert Map to array untuk pass interface
        const typesArray = Array.from(typesMap.values())

        return {
            typeId: 'SemanticTypes',
            types: typesArray, // Array, bukan ImmutableMap
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
     * Convert SQL type to PrimitiveType
     * 
     * @param sqlType - SQL type string (e.g. 'varchar', 'int', 'timestamp')
     * @returns PrimitiveType yang sesuai
     */
    private static sqlToSemanticType(sqlType: string): PrimitiveType {
        const t = sqlType.toLowerCase()

        // Number types
        if (t.includes('int') || t.includes('decimal') || t.includes('float') || t.includes('double')) {
            return new PrimitiveType(PrimitiveKind.NUMBER)
        }

        // Boolean types
        if (t.includes('bool') || t.includes('tinyint(1)')) {
            return new PrimitiveType(PrimitiveKind.BOOLEAN)
        }

        // DateTime types
        if (t.includes('timestamp') || t.includes('datetime') || t.includes('date')) {
            return new PrimitiveType(PrimitiveKind.DATETIME)
        }

        // Default to string for varchar, text, char, etc.
        return new PrimitiveType(PrimitiveKind.STRING)
    }

    /**
     * Convert resource field kind to PrimitiveType
     * 
     * @param fieldKind - ResourceFieldKind dari manifest
     * @returns PrimitiveType yang sesuai
     */
    private static resourceFieldToSemanticType(fieldKind: any): PrimitiveType {
        // Handle primitive kinds
        if (fieldKind.kind === 'primitive') {
            const t = fieldKind.type?.toLowerCase() || 'string'

            if (t === 'number' || t === 'int' || t === 'float') {
                return new PrimitiveType(PrimitiveKind.NUMBER)
            }
            if (t === 'boolean' || t === 'bool') {
                return new PrimitiveType(PrimitiveKind.BOOLEAN)
            }
            if (t === 'datetime' || t === 'date') {
                return new PrimitiveType(PrimitiveKind.DATETIME)
            }

            return new PrimitiveType(PrimitiveKind.STRING)
        }

        // Handle model/resource references (treat as string for now)
        if (fieldKind.kind === 'model' || fieldKind.kind === 'resource') {
            return new PrimitiveType(PrimitiveKind.STRING)
        }

        // Handle objects (treat as string for now)
        if (fieldKind.kind === 'object') {
            return new PrimitiveType(PrimitiveKind.STRING)
        }

        // Default unknown to string
        return new PrimitiveType(PrimitiveKind.STRING)
    }
}
