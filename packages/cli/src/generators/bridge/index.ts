/**
 * Explicit, source-backed exports for the compiler bridge.
 * The barrel exports only symbols that are actually defined by their owners.
 */
export type {
  CompilerOutput,
  FormOutput,
  ContractOutput,
  ApiFieldOutput,
  MapperOutput,
} from '@routesync/core';

export type {
  CompiledContractsBundle,
  EmittedCompilerArtifacts,
  FullBundleEmittedArtifacts,
  CompilerBundleOptions,
  CompilerEmitContext,
  CompilerEmitter,
} from './bridgeTypes';

export { CoreFilesEmitter } from './coreFilesEmitter';

export {
  TypeBarrelEmitter,
  SdkClientEmitter,
  ConstantsEmitter,
  QueryKeyEmitter,
  HookEmitter,
  NextActionEmitter,
  MswEmitter,
  EchoEmitter,
  ModelEmitter,
  RoutesEmitter,
  IndexEmitter,
  DEFAULT_CLIENT_EMITTERS,
} from './clientEmitters';

export { compileManifest, emitFullBundle, emitCoreArtifacts } from './bridgePipeline';
