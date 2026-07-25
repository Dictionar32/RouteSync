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
import { RouteManifest } from '@routesync/core'
import { ContractEmitter } from './layers/ContractEmitter'
import { SchemaEmitter } from './layers/SchemaEmitter'
import { FieldEmitter } from './layers/FieldEmitter'
import { ReadEmitter } from './layers/ReadEmitter'
import { MapperEmitter } from './layers/MapperEmitter'
import { LayerContext } from './layers/types'

export class ZodTierGeneratorRefactored {
    /**
     * Main entry point
     * 
     * Called from sync.ts dengan manifest
     * Orchestrates 6 emitters dalam correct order
     */
    static async generate(manifest: RouteManifest, outputDir: string): Promise<void> {
        // Setup context yang akan di-pass ke semua emitters
        const context: LayerContext = {
            manifest,
            knownModels: new Set(),
            knownResources: new Set(),
            knownSchemas: new Set(),
            kernel: undefined,
        }

        // Create subdirectories
        const contractDir = path.join(outputDir, 'contract')
        const typesDir = path.join(outputDir, 'types')
        const mappersDir = path.join(outputDir, 'mappers')

        console.log(`[ZodTierGeneratorRefactored] Starting generation to ${outputDir}`)

        try {
            // Phase 1: Contract (generates routeResponseMap IR)
            console.log(`[ZodTierGeneratorRefactored] Generating contract layer...`)
            const { routeResponseMap } = await ContractEmitter.generate(contractDir, context)

            // Phase 2: Schema (form validation)
            console.log(`[ZodTierGeneratorRefactored] Generating schema layer...`)
            await SchemaEmitter.generate(contractDir, context)

            // Phase 3: Field (per-field metadata)
            console.log(`[ZodTierGeneratorRefactored] Generating field layer...`)
            await FieldEmitter.generate(contractDir, context)

            // Phase 4: Read & Mapper (use routeResponseMap)
            console.log(`[ZodTierGeneratorRefactored] Generating read types...`)
            await ReadEmitter.generate(typesDir, context, routeResponseMap)

            console.log(`[ZodTierGeneratorRefactored] Generating mappers...`)
            await MapperEmitter.generate(mappersDir, context, routeResponseMap)

            console.log(`[ZodTierGeneratorRefactored] Generation complete!`)
        } catch (error) {
            console.error(`[ZodTierGeneratorRefactored] Generation failed:`, error)
            throw error
        }
    }
}

