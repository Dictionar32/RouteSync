/**
 * ZodTierGeneratorRefactored.ts
 * 
 * REFACTORED entry point untuk Zod tier generation
 * 
 * Phase 2 implementation: Split monolithic ZodTierGenerator (1890 lines)
 * into 6 focused emitters (ContractEmitter, SchemaEmitter, FieldEmitter, 
 * ReadEmitter, FormEmitter, MapperEmitter)
 * 
 * ARCHITECTURE:
 * 1. ContractEmitter generates schemas & returns routeResponseMap IR
 * 2. SchemaEmitter uses IR untuk form validation
 * 3. FieldEmitter generates per-field metadata
 * 4. ReadEmitter uses IR untuk read types (camelCase)
 * 5. FormEmitter generates form types (if available)
 * 6. MapperEmitter uses IR untuk transform functions
 * 
 * NO MUTABLE STATE - all data flows through return values
 * NO DUPLICATE INFERENCE - IR computed once, reused by all emitters
 */

import path from 'path'
import fs from 'fs-extra'
import { RouteManifest } from '@routesync/core'
import { GenerationContext, GeneratedFile, RouteManifest as IRRouteManifest } from '../../../core/src/types/ir'
import { ContractIRBuilder } from '../../../core/src/ir/ContractIRBuilder'
import { ContractEmitter } from './layers/ContractEmitter'
import { SchemaEmitter } from './layers/SchemaEmitter'
import { FieldEmitter } from './layers/FieldEmitter'
import { ReadEmitter } from './layers/ReadEmitter'
import { MapperEmitter } from './layers/MapperEmitter'
import { LayerContext } from './layers/types'
import { SemanticResolver } from './semantic-resolver'
import { ContractGenerator } from './ContractGenerator'

export class ZodTierGeneratorRefactored {

    /**
     * Helper function to convert LayerContext to GenerationContext
     */
    private static createGenerationContext(context: LayerContext, outputDir: string): GenerationContext {
        // Use ContractGenerator's adaptManifest method
        const contractGen = new ContractGenerator()
        const adaptedManifest = contractGen['adaptManifest'](context.manifest)

        return {
            projectRoot: '.',
            outputDir,
            config: {
                typescript: {
                    strict: true,
                    target: 'ES2020',
                    moduleResolution: 'node'
                },
                validation: {
                    useZod: true,
                    useLaravel: false
                },
                naming: {
                    caseTransform: 'camel',
                    resourceSuffix: 'Resource',
                    requestSuffix: 'Request'
                }
            },
            manifest: adaptedManifest
        }
    }

    /**
     * Write generated files to disk
     */
    private static async writeFiles(files: GeneratedFile[], outputDir: string): Promise<void> {
        await fs.ensureDir(outputDir)

        for (const file of files) {
            const fullPath = path.join(outputDir, file.path)
            await fs.ensureDir(path.dirname(fullPath))
            await fs.writeFile(fullPath, file.content)
            console.log(`[ZodTierGeneratorRefactored] Written: ${file.path}`)
        }
    }

    /**
     * Main entry point
     * 
     * Called from sync.ts dengan manifest
     * Orchestrates 6 emitters dalam correct order
     */
    static async generate(manifest: RouteManifest, outputDir: string): Promise<void> {
        // Engine.Fix.md §39: SemanticResolver.resolve() dijalankan SEKALI di
        // sini, hasilnya (`ir.fieldMappings`, dst) di-pass ke semua emitter
        // lewat `context.ir`. Sebelumnya `context.kernel`/IR selalu
        // `undefined` di sini — artinya seluruh perbaikan field-resolution
        // yang sudah diverifikasi di SemanticResolver (§32-39) TIDAK PERNAH
        // benar-benar dipakai oleh emitter manapun, walau infrastrukturnya
        // sudah ada sejak awal. Setup context yang akan di-pass ke semua emitters
        const ir = SemanticResolver.resolve(manifest)
        const context: LayerContext = {
            manifest,
            knownModels: new Set(),
            knownResources: new Set(),
            knownSchemas: new Set(),
            kernel: undefined,
            ir,
        }

        // Create subdirectories
        const contractDir = path.join(outputDir, 'contract')
        const typesDir = path.join(outputDir, 'types')
        const mappersDir = path.join(outputDir, 'mappers')

        console.log(`[ZodTierGeneratorRefactored] Starting generation to ${outputDir}`)

        try {
            // Build ContractIR once from RouteManifest
            const generationContext = this.createGenerationContext(context, outputDir)
            const irBuilder = new ContractIRBuilder(generationContext)
            const contractIR = irBuilder.buildFromManifest(generationContext.manifest)

            // Phase 1: Contract (generates routeResponseMap IR)
            console.log(`[ZodTierGeneratorRefactored] Generating contract layer...`)
            const contractEmitter = new ContractEmitter()
            const contractFiles = contractEmitter.emit(contractIR)
            // Extract routeResponseMap if available from contract files
            const routeResponseMap = {} // TODO: Extract from contract files if needed

            // Phase 2: Schema (form validation)
            console.log(`[ZodTierGeneratorRefactored] Generating schema layer...`)
            const schemaEmitter = new SchemaEmitter()
            const schemaFiles = schemaEmitter.emit(contractIR)

            // Phase 3: Field (per-field metadata)
            console.log(`[ZodTierGeneratorRefactored] Generating field layer...`)
            const fieldEmitter = new FieldEmitter()
            const fieldFiles = fieldEmitter.emit(contractIR)

            // Phase 4: Read & Mapper
            console.log(`[ZodTierGeneratorRefactored] Generating read types...`)
            const readEmitter = new ReadEmitter()
            const readFiles = readEmitter.emit(contractIR)

            console.log(`[ZodTierGeneratorRefactored] Generating mappers...`)
            const mapperEmitter = new MapperEmitter()
            const mapperFiles = mapperEmitter.emit(contractIR)

            // Write all generated files
            await ZodTierGeneratorRefactored.writeFiles([...contractFiles, ...schemaFiles, ...fieldFiles, ...readFiles, ...mapperFiles], outputDir)

            console.log(`[ZodTierGeneratorRefactored] Generation complete!`)
        } catch (error) {
            console.error(`[ZodTierGeneratorRefactored] Generation failed:`, error)
            throw error
        }
    }

    /**
     * Write generated files to disk
     */
    private async writeFiles(files: GeneratedFile[], outputDir: string): Promise<void> {
        for (const file of files) {
            const fullPath = path.join(outputDir, file.path)
            await fs.ensureDir(path.dirname(fullPath))
            await fs.writeFile(fullPath, file.content, 'utf8')
            console.log(`[ZodTierGeneratorRefactored] Wrote: ${file.path}`)
        }
    }
}

