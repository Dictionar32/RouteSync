/**
 * bridgePipeline.ts
 *
 * Pure Functional Pipeline for manifest compilation and artifact emission.
 *
 * @module generators/bridge/bridgePipeline
 */

import type { RouteManifest } from '../../../../core/src/types/route'
import { manifestToSemanticTypes, manifestToContractInput } from '../utils/manifest-to-types'
import {
    lowerReadTypesOutput,
    lowerFormTypesOutput,
    lowerContractsOutput,
    lowerApiFieldsOutput,
    lowerMappersOutput
} from '../../../../core/src/compiler/passes/outputLowerers'
import { classifyDomainGraph } from '../route-classifier'
import type {
    CompiledContractsBundle,
    FullBundleEmittedArtifacts,
    CompilerBundleOptions,
    CompilerEmitter,
    CompilerEmitContext
} from './bridgeTypes'
import { CoreFilesEmitter } from './coreFilesEmitter'
import { DEFAULT_CLIENT_EMITTERS } from './clientEmitters'

/**
 * Pure Compilation Pipeline: RouteManifest → CompiledContractsBundle
 * 0 new, 0 class, 0 IIFE. Direct function composition.
 */
export function compileManifest(manifest: RouteManifest): CompiledContractsBundle {
    console.log('[CompilerBridge] Executing unified compiler pipeline...')

    const semanticArtifact = manifestToSemanticTypes(manifest)
    const requestArtifact = manifestToContractInput(manifest)

    const readTypes = lowerReadTypesOutput(semanticArtifact, manifest)
    const formTypes = lowerFormTypesOutput(requestArtifact, manifest)
    const contracts = lowerContractsOutput(requestArtifact, manifest)
    const apiFields = lowerApiFieldsOutput(requestArtifact)
    const mappers = lowerMappersOutput(requestArtifact)

    console.log('[CompilerBridge] Unified compilation complete:')
    console.log(`  - Read Types: ${readTypes.metadata.typeCount} types, ${readTypes.metadata.linesOfCode} LOC`)
    console.log(`  - Form Types: ${formTypes.metadata.formTypeCount} types, ${formTypes.metadata.linesOfCode} LOC`)
    console.log(`  - Contracts: ${contracts.metadata.contractCount} contracts, ${contracts.metadata.linesOfCode} LOC`)
    console.log(`  - Api Fields: ${apiFields.metadata.linesOfCode} LOC`)
    console.log(`  - Mappers: ${mappers.metadata.linesOfCode} LOC`)

    return Object.freeze({
        readTypes,
        formTypes,
        contracts,
        apiFields,
        mappers
    })
}

/**
 * Pure Dataflow Pipeline:
 * manifest → CompiledContractsBundle → { coreEmitter, clientEmitters } → { writtenPaths, clientArtifacts }
 */
export async function emitFullBundle(
    manifest: RouteManifest,
    outputDir: string,
    coreEmitter: CompilerEmitter = CoreFilesEmitter,
    clientEmitters: readonly CompilerEmitter[] = DEFAULT_CLIENT_EMITTERS,
    options: CompilerBundleOptions = {}
): Promise<FullBundleEmittedArtifacts> {
    console.log('[CompilerBridge] Emitting full CDA contract & client bundle...')

    const contractsBundle = compileManifest(manifest)
    const domainGraph = classifyDomainGraph(manifest)

    const context: CompilerEmitContext = Object.freeze({
        manifest,
        outputDir,
        domainGraph,
        contractsBundle,
        options
    })

    const writtenPaths = Object.freeze(await coreEmitter.emit(context))
    const clientArtifacts = Object.freeze(
        await Promise.all(clientEmitters.map(e => e.emit(context)))
    )
    const allWrittenPaths = Object.freeze([
        ...writtenPaths,
        ...clientArtifacts.flat()
    ])

    return Object.freeze({
        readTypes: contractsBundle.readTypes,
        formTypes: contractsBundle.formTypes,
        contracts: contractsBundle.contracts,
        apiFields: contractsBundle.apiFields,
        mappers: contractsBundle.mappers,
        writtenPaths,
        clientArtifacts,
        allWrittenPaths
    })
}

/**
 * Convenience alias: emitFullBundle with only CoreFilesEmitter, 0 client emitters.
 */
export function emitCoreArtifacts(
    manifest: RouteManifest,
    outputDir: string
): Promise<FullBundleEmittedArtifacts> {
    return emitFullBundle(manifest, outputDir, CoreFilesEmitter, [])
}
