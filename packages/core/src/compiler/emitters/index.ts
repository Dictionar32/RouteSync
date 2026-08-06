/**
 * @file emitters/index.ts
 * @description Code emitter exports untuk different target backends
 */

// Artifact types
export type { GeneratedArtifact } from './GeneratedArtifact';

// Capability types
export type { BackendCapability } from './BackendCapability';

// Base emitter interface
export type { ContractEmitter } from './ContractEmitter';

// Concrete emitter implementations
export { TypeScriptEmitter } from './TypeScriptEmitter';
