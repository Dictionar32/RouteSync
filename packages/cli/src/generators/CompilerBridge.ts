/**
 * CompilerBridge.ts - REFACTORED
 * Pure orchestration bridge between CLI manifest and compiler
 * 
 * BEFORE: 516 lines with architecture violations
 * AFTER:  ~200 lines of clean orchestration
 * 
 * Changes:
 * - Removed dead code (resourceFieldToSemanticType)
 * - Extracted type factories to PrimitiveTypeFactory
 * - Using existing resource-flattening utility
 * - Imported naming utilities from core
 * - Split manifestToSemanticTypes into focused methods
 */

// Import types
import type { RouteManifest, ParsedModel, ParsedResource } from '../../../core/src/types/route'
import { TypeScriptGeneratorPass } from '../../../core/src/compiler/passes/TypeScriptGeneratorPass'
import type { SemanticTypesArtifact } from '../../../core/src/compiler/passes/TypeScriptGeneratorPass'
import type { GeneratedTypeScriptArtifact } from '../../../core/src/compiler/artifacts/GeneratedTypeScriptArtifact'
import { ImmutableMap, ImmutableSet } from '../../../core/src/compiler/utils/ImmutableCollections'
import { ObjectType } from '../../../core/src/compiler/types/SemanticType'

// ✅ Import utilities (not defined here)
import { toCamelCase } from '../../../core/src/utils/resource-naming'
import { flattenResourceFields } from './utils/resource-flattening'
import { PrimitiveTypeFactory } from './utils/PrimitiveTypeFactory'

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

            const [generatedArtifact] = pass.run([inputArtifact])

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
                new ImmutableMap(new Map([
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
                new ImmutableMap(new Map([
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
