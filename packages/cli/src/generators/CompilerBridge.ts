/**
 * CompilerBridge.ts - pure orchestration: manifest → adapter → pass → format.
 * Lowering logic lives in utils/manifest-to-types.ts.
 */

import path from 'path'
import fs from 'fs-extra'
import type { RouteManifest } from '../../../core/src/types/route'
import type { SemanticTypesArtifact } from '../../../core/src/compiler/artifacts/SemanticTypesArtifact'
import type { GeneratedTypeScriptArtifact } from '../../../core/src/compiler/artifacts/GeneratedTypeScriptArtifact'
import type { RequestTypesArtifact } from '../../../core/src/compiler/artifacts/RequestTypesArtifact'
import type { GeneratedFormArtifact } from '../../../core/src/compiler/artifacts/GeneratedFormArtifact'
import type { GeneratedContractArtifact } from '../../../core/src/compiler/artifacts/GeneratedContractArtifact'
import type { GeneratedApiFieldArtifact } from '../../../core/src/compiler/artifacts/GeneratedApiFieldArtifact'
import type { GeneratedMapperArtifact } from '../../../core/src/compiler/artifacts/GeneratedMapperArtifact'
import { TypeScriptGeneratorPass } from '../../../core/src/compiler/passes/TypeScriptGeneratorPass'
import { FormGeneratorPass } from '../../../core/src/compiler/passes/FormGeneratorPass'
import { ContractGeneratorPass } from '../../../core/src/compiler/passes/ContractGeneratorPass'
import { ApiFieldGeneratorPass } from '../../../core/src/compiler/passes/ApiFieldGeneratorPass'
import { MapperGeneratorPass } from '../../../core/src/compiler/passes/MapperGeneratorPass'

import { manifestToSemanticTypes, manifestToRequestTypes, manifestToContractInput } from './utils/manifest-to-types'

export interface CompiledContractsBundle {
    readonly readTypes: CompilerOutput
    readonly formTypes: FormOutput
    readonly contracts: ContractOutput
    readonly apiFields: ApiFieldOutput
    readonly mappers: MapperOutput
}

export interface EmittedCompilerArtifacts extends CompiledContractsBundle {
    readonly writtenPaths: readonly string[]
}

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

export interface ApiFieldOutput {
    readonly code: string
    readonly metadata: {
        readonly linesOfCode: number
        readonly warnings: readonly string[]
    }
}

export interface MapperOutput {
    readonly code: string
    readonly metadata: {
        readonly linesOfCode: number
        readonly warnings: readonly string[]
    }
}

export class CompilerBridge {
    /**
     * Unified compiler pipeline: executes all 5 compiler passes in a single pass
     * and returns the complete compiled contracts bundle.
     */
    static async compileAll(manifest: RouteManifest): Promise<CompiledContractsBundle> {
        console.log('[CompilerBridge] Executing unified compiler pipeline...')

        // 1. Semantic types pass (api-read.ts)
        const semanticTypesArtifact = manifestToSemanticTypes(manifest)
        const inputArtifact: SemanticTypesArtifact = {
            ...semanticTypesArtifact,
            types: Array.from(semanticTypesArtifact.types)
        }
        const tsPass = new TypeScriptGeneratorPass()
        const [tsArtifact] = tsPass.run([inputArtifact])
        const readTypes = this.formatCompilerOutput(tsArtifact, manifest)

        // 2. Extract request types once for all contract/form/field/mapper passes
        const requestTypesArtifact = manifestToContractInput(manifest)

        // 3. Form types pass (api-form.ts)
        const formPass = new FormGeneratorPass()
        const [formArtifact] = formPass.run([requestTypesArtifact])
        const formTypes = this.formatFormOutput(formArtifact, manifest)

        // 4. Contract pass (api-contract.ts)
        const contractPass = new ContractGeneratorPass()
        const [contractArtifact] = contractPass.run([requestTypesArtifact])
        const contracts = this.formatContractOutput(contractArtifact, manifest)

        // 5. ApiField pass (api-field.ts)
        const apiFieldPass = new ApiFieldGeneratorPass()
        const [apiFieldArtifact] = apiFieldPass.run([requestTypesArtifact])
        const apiFields: ApiFieldOutput = {
            code: apiFieldArtifact.code,
            metadata: {
                linesOfCode: apiFieldArtifact.code.split('\n').length,
                warnings: []
            }
        }

        // 6. Mapper pass (api-mapper.ts)
        const mapperPass = new MapperGeneratorPass()
        const [mapperArtifact] = mapperPass.run([requestTypesArtifact])
        const mappers: MapperOutput = {
            code: mapperArtifact.code,
            metadata: {
                linesOfCode: mapperArtifact.code.split('\n').length,
                warnings: []
            }
        }

        console.log('[CompilerBridge] Unified compilation complete:')
        console.log(`  - Read Types: ${readTypes.metadata.typeCount} types, ${readTypes.metadata.linesOfCode} LOC`)
        console.log(`  - Form Types: ${formTypes.metadata.formTypeCount} types, ${formTypes.metadata.linesOfCode} LOC`)
        console.log(`  - Contracts: ${contracts.metadata.contractCount} contracts, ${contracts.metadata.linesOfCode} LOC`)
        console.log(`  - Api Fields: ${apiFields.metadata.linesOfCode} LOC`)
        console.log(`  - Mappers: ${mappers.metadata.linesOfCode} LOC`)

        return {
            readTypes,
            formTypes,
            contracts,
            apiFields,
            mappers
        }
    }

    /**
     * Unified emitter: compiles and writes all 5 contract artifacts to the target output directory.
     */
    static async emitAll(manifest: RouteManifest, outputDir: string): Promise<EmittedCompilerArtifacts> {
        const bundle = await this.compileAll(manifest)
        const writtenPaths: string[] = []

        const readTypesPath = path.join(outputDir, 'types', 'api-read.ts')
        await fs.ensureDir(path.dirname(readTypesPath))
        await fs.writeFile(readTypesPath, bundle.readTypes.code)
        writtenPaths.push(readTypesPath)

        const formTypesPath = path.join(outputDir, 'forms', 'api-form.ts')
        await fs.ensureDir(path.dirname(formTypesPath))
        await fs.writeFile(formTypesPath, bundle.formTypes.code)
        writtenPaths.push(formTypesPath)

        const contractPath = path.join(outputDir, 'contracts', 'api-contract.ts')
        await fs.ensureDir(path.dirname(contractPath))
        await fs.writeFile(contractPath, bundle.contracts.code)
        writtenPaths.push(contractPath)

        const apiFieldPath = path.join(outputDir, 'contracts', 'api-field.ts')
        await fs.ensureDir(path.dirname(apiFieldPath))
        await fs.writeFile(apiFieldPath, bundle.apiFields.code)
        writtenPaths.push(apiFieldPath)

        const mapperPath = path.join(outputDir, 'mappers', 'api-mapper.ts')
        await fs.ensureDir(path.dirname(mapperPath))
        await fs.writeFile(mapperPath, bundle.mappers.code)
        writtenPaths.push(mapperPath)

        return {
            ...bundle,
            writtenPaths
        }
    }

    static async generateTypeScript(manifest: RouteManifest): Promise<CompilerOutput> {
        console.log('[CompilerBridge] Starting compilation...')

        const semanticTypesArtifact = manifestToSemanticTypes(manifest)
        console.log(`[CompilerBridge] Extracted ${semanticTypesArtifact.types.length} semantic types`)

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

            return this.formatCompilerOutput(generatedArtifact, manifest)
        } catch (error) {
            console.error('[CompilerBridge] Error during execution:', error)
            throw new Error(
                `CompilerBridge generation failed: ${error instanceof Error ? error.message : String(error)}`
            )
        }
    }

    static async generateFormTypes(manifest: RouteManifest): Promise<FormOutput> {
        console.log('[CompilerBridge] Starting form generation...')

        const requestTypesArtifact = manifestToContractInput(manifest)
        console.log(`[CompilerBridge] Extracted ${requestTypesArtifact.requestTypes.length} request types`)

        const pass = new FormGeneratorPass()

        try {
            const [generatedArtifact]: readonly [GeneratedFormArtifact] = pass.run([requestTypesArtifact])

            console.log(`[CompilerBridge] Form generation complete:`)
            console.log(`  - Form type count: ${generatedArtifact.generationMetadata.formTypeCount}`)
            console.log(`  - Total actions: ${generatedArtifact.generationMetadata.totalActions}`)
            console.log(`  - Lines of code: ${generatedArtifact.generationMetadata.linesOfCode}`)

            return this.formatFormOutput(generatedArtifact, manifest)
        } catch (error) {
            console.error('[CompilerBridge] Error during form generation:', error)
            throw new Error(
                `CompilerBridge form generation failed: ${error instanceof Error ? error.message : String(error)}`
            )
        }
    }

    static async generateContractTypes(manifest: RouteManifest): Promise<ContractOutput> {
        console.log('[CompilerBridge] Starting contract generation...')

        const requestTypesArtifact = manifestToContractInput(manifest)
        console.log(`[CompilerBridge] Extracted ${requestTypesArtifact.requestTypes.length} request types`)

        const pass = new ContractGeneratorPass()

        try {
            const [generatedArtifact]: readonly [GeneratedContractArtifact] = pass.run([requestTypesArtifact])

            console.log(`[CompilerBridge] Contract generation complete:`)
            console.log(`  - Contract count: ${generatedArtifact.generationMetadata.contractCount}`)
            console.log(`  - Total actions: ${generatedArtifact.generationMetadata.totalActions}`)
            console.log(`  - Zod schemas: ${generatedArtifact.generationMetadata.zodSchemasCount}`)
            console.log(`  - Validators: ${generatedArtifact.generationMetadata.validatorsCount}`)
            console.log(`  - Lines of code: ${generatedArtifact.generationMetadata.linesOfCode}`)

            return this.formatContractOutput(generatedArtifact, manifest)
        } catch (error) {
            console.error('[CompilerBridge] Error during contract generation:', error)
            throw new Error(
                `CompilerBridge contract generation failed: ${error instanceof Error ? error.message : String(error)}`
            )
        }
    }

    static async generateApiFieldTypes(manifest: RouteManifest): Promise<ApiFieldOutput> {
        console.log('[CompilerBridge] Starting api-field generation...')

        const requestTypesArtifact = manifestToContractInput(manifest)
        const pass = new ApiFieldGeneratorPass()

        try {
            const [generatedArtifact]: readonly [GeneratedApiFieldArtifact] = pass.run([requestTypesArtifact])
            const linesOfCode = generatedArtifact.code.split('\n').length

            console.log(`[CompilerBridge] ApiField generation complete: LOC ${linesOfCode}`)

            return {
                code: generatedArtifact.code,
                metadata: {
                    linesOfCode,
                    warnings: []
                }
            }
        } catch (error) {
            console.error('[CompilerBridge] Error during api-field generation:', error)
            throw new Error(
                `CompilerBridge api-field generation failed: ${error instanceof Error ? error.message : String(error)}`
            )
        }
    }

    static async generateMapperTypes(manifest: RouteManifest): Promise<MapperOutput> {
        console.log('[CompilerBridge] Starting mapper generation...')

        const requestTypesArtifact = manifestToContractInput(manifest)
        const pass = new MapperGeneratorPass()

        try {
            const [generatedArtifact]: readonly [GeneratedMapperArtifact] = pass.run([requestTypesArtifact])
            const linesOfCode = generatedArtifact.code.split('\n').length

            console.log(`[CompilerBridge] Mapper generation complete: LOC ${linesOfCode}`)

            return {
                code: generatedArtifact.code,
                metadata: {
                    linesOfCode,
                    warnings: []
                }
            }
        } catch (error) {
            console.error('[CompilerBridge] Error during mapper generation:', error)
            throw new Error(
                `CompilerBridge mapper generation failed: ${error instanceof Error ? error.message : String(error)}`
            )
        }
    }

    private static formatCompilerOutput(
        artifact: GeneratedTypeScriptArtifact,
        manifest: RouteManifest
    ): CompilerOutput {
        const imports = artifact.imports.map(imp =>
            `import { ${imp.names.join(', ')} } from '${imp.from}'`
        )
        const interfaces = artifact.interfaces.map(iface => iface.name)
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

    private static formatFormOutput(
        artifact: GeneratedFormArtifact,
        manifest: RouteManifest
    ): FormOutput {
        const formTypes = artifact.formTypes.map(ft => ft.name)
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

    private static formatContractOutput(
        artifact: GeneratedContractArtifact,
        manifest: RouteManifest
    ): ContractOutput {
        const contracts = artifact.contracts.map(c => c.name)
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
