/**
 * bridge/index.ts
 *
 * Explicit Sub-Domain Exports for Compiler Bridge.
 * Conforms to Rule 14: Zero wildcard re-exports (0 `export * from`).
 *
 * @module generators/bridge
 */

export {
    type BridgeMetadata,
    type CompiledContractBundle,
    type BridgeEmitPipelineDeps,
    CompilerBridgePipeline
} from './bridgeTypes';

export {
    type CoreFilesEmitterDeps,
    CoreFilesEmitter
} from './coreFilesEmitter';

export {
    type ClientEmittersDeps,
    ClientEmitters,
    DEFAULT_CLIENT_EMITTERS
} from './clientEmitters';

export {
    compileManifest,
    emitFullBundle,
    emitCoreArtifacts
} from './bridgePipeline';
