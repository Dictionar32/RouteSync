/**
 * CompilerBridge.ts - pure orchestration: manifest → adapter → pass → format.
 * Lowering logic lives in utils/manifest-to-types.ts (was 853 lines inline).
 */

// Import types
import type { RouteManifest } from '../../../core/src/types/route'
import type { SemanticTypesArtifact } from '../../../core/src/compiler/passes/TypeScriptGeneratorPass'
import type { GeneratedTypeScriptArtifact } from '../../../core/src/compiler/artifacts/GeneratedTypeScriptArtifact'
import type { RequestTypesArtifact } from '../../../core/src/compiler/artifacts/RequestTypesArtifact'
import type { GeneratedFormArtifact } from '../../../core/src/compiler/artifacts/GeneratedFormArtifact'
import type { GeneratedContractArtifact } from '../../../core/src/compiler/artifacts/GeneratedContractArtifact'
import { TypeScriptGeneratorPass } from '../../../core/src/compiler/passes/TypeScriptGeneratorPass'
import { FormGeneratorPass } from '../../../core/src/compiler/passes/FormGeneratorPass'
import { ContractGeneratorPass } from '../../../core/src/compiler/passes/ContractGeneratorPass'

// ✅ Import lowering utilities (business logic lives here, not in the bridge)
import { manifestToSemanticTypes, manifestToRequestTypes, manifestToContractInput } from './utils/manifest-to-types'

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

        // Step 1: Convert manifest to SemanticTypes (lowering in utils)
        const semanticTypesArtifact = manifestToSemanticTypes(manifest)
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

        // Step 1: Convert manifest to RequestTypes (lowering in utils)
        const requestTypesArtifact = manifestToRequestTypes(manifest)
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
     * - manifestToContractInput preserves backend structure
     *
     * @param manifest - RouteManifest from CLI scan (uses validation rules)
     * @returns ContractOutput ready to write to contracts/api-contract.ts
     */
    static async generateContractTypes(manifest: RouteManifest): Promise<ContractOutput> {
        console.log('[CompilerBridge] Starting contract generation...')

        // Step 1: Convert manifest to ContractInput (preserves original structure)
        const requestTypesArtifact = manifestToContractInput(manifest)
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
}
