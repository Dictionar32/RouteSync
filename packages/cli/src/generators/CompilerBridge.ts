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

            // Convert each column to property
            for (const column of model.columns || []) {
                const columnType = this.sqlToSemanticType(column.type)
                properties.set(column.name, columnType)
            }

            // Create ObjectType for model
            const objectType = new ObjectType(
                new ImmutableMap(properties),
                new ImmutableSet(new Set(model.columns?.map(c => c.name) || [])),
                undefined, // no base
                [], // no interfaces
                new ImmutableMap(new Map()) // no annotations
            )

            typesMap.set(model.name, objectType)
        }

        // Convert resources to ObjectTypes
        for (const resource of manifest.resources || []) {
            const properties = new Map<string, PrimitiveType>()

            // Convert each field to property
            for (const [fieldName, fieldKind] of Object.entries(resource.fields || {})) {
                const fieldType = this.resourceFieldToSemanticType(fieldKind)
                properties.set(fieldName, fieldType)
            }

            // Create ObjectType for resource
            const objectType = new ObjectType(
                new ImmutableMap(properties),
                new ImmutableSet(new Set(Object.keys(resource.fields || {}))),
                undefined, // no base
                [], // no interfaces
                new ImmutableMap(new Map()) // no annotations
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
