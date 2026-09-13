/**
 * CompilerBridge.ts — Pure Functional Pipeline Orchestrator
 *
 * Active Consumer Orchestrator for RouteSync Compiler & Code Generation Bridge.
 * Coordinates compilation of RouteManifest into contracts, core files, and client artifacts.
 *
 * @module generators
 */

import type { RouteManifest } from '../../../core/src/types/route'
import {
    type CompilerOutput,
    type FormOutput,
    type ContractOutput,
    type ApiFieldOutput,
    type MapperOutput,
    type CompiledContractsBundle,
    type EmittedCompilerArtifacts,
    type FullBundleEmittedArtifacts,
    type CompilerBundleOptions,
    type CompilerEmitContext,
    type CompilerEmitter,
    CoreFilesEmitter,
    DEFAULT_CLIENT_EMITTERS,
    compileManifest,
    emitFullBundle,
    emitCoreArtifacts
} from './bridge'

// Explicit named re-exports (Rule 14: 0 wildcard re-exports)
export type {
    CompilerOutput,
    FormOutput,
    ContractOutput,
    ApiFieldOutput,
    MapperOutput,
    CompiledContractsBundle,
    EmittedCompilerArtifacts,
    FullBundleEmittedArtifacts,
    CompilerBundleOptions,
    CompilerEmitContext,
    CompilerEmitter
}

export {
    CoreFilesEmitter,
    DEFAULT_CLIENT_EMITTERS,
    compileManifest,
    emitFullBundle,
    emitCoreArtifacts
}

/**
 * CompilerBridge const namespace — 100% backward-compatible with existing tests
 * that call CompilerBridge.compileAll(), CompilerBridge.emitAll(), etc.
 */
export const CompilerBridge = Object.freeze({
    compileAll: compileManifest,
    emitAll: emitCoreArtifacts,
    emitFullBundle: async (
        manifest: RouteManifest,
        outputDir: string,
        arg3?: CompilerEmitter | CompilerBundleOptions,
        clientEmitters?: readonly CompilerEmitter[],
        options?: CompilerBundleOptions
    ): Promise<FullBundleEmittedArtifacts> => {
        if (arg3 && typeof (arg3 as any).emit !== 'function') {
            return emitFullBundle(manifest, outputDir, CoreFilesEmitter, DEFAULT_CLIENT_EMITTERS, arg3 as CompilerBundleOptions);
        }
        return emitFullBundle(manifest, outputDir, arg3 as CompilerEmitter, clientEmitters, options);
    },
    generateTypeScript: async (manifest: RouteManifest): Promise<CompilerOutput> => {
        return compileManifest(manifest).readTypes
    },
    generateFormTypes: async (manifest: RouteManifest): Promise<FormOutput> => {
        return compileManifest(manifest).formTypes
    },
    generateContractTypes: async (manifest: RouteManifest): Promise<ContractOutput> => {
        return compileManifest(manifest).contracts
    },
    generateApiFieldTypes: async (manifest: RouteManifest): Promise<ApiFieldOutput> => {
        return compileManifest(manifest).apiFields
    },
    generateMapperTypes: async (manifest: RouteManifest): Promise<MapperOutput> => {
        return compileManifest(manifest).mappers
    }
})
