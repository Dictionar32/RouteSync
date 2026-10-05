/**
 * incrementalTypes.ts
 *
 * Coordinating Active Consumer Barrel for Incremental RouteSync Scanner.
 * Level 7 Architecture: Nominal Branded Atoms, Catamorphisms, and Complete Contracts.
 * Conforms to Rule 14: Zero wildcard re-exports (0 `export * from`).
 *
 * @module cli/utils/incremental/incrementalTypes
 */

export {
  type RouteSemanticFlowMethod,
  type RouteSemanticFlowPath,
  type RouteSemanticFlowName,
  type ScannedStableHash,
  type SourceFilePath,
  type SourceLineNumber,
  NominalAtomFactory
} from './types/nominalAtoms';

export {
  type PrimitiveResponsePayloadContract,
  type ObjectResponsePayloadContract,
  type ArrayResponsePayloadContract,
  type ResourceResponsePayloadContract,
  type UnknownResponsePayloadContract,
  type RouteResponsePayloadContract,
  type RouteResponsePayloadVisitor,
  matchRouteResponsePayload
} from './types/responsePayloadTypes';

export type { RouteSemanticFlow } from '@routesync/core';

export {
  type ScannedResourceContract,
  type ScannedResourceOptions,
  type ScannedResourceLegacy
} from './types/scannedResourceTypes';

export {
  type ModelAccessorInfoContract,
  type ModelAccessorInfo,
  type ScannedModelContract,
  type ScannedModelLegacy
} from './types/scannedModelTypes';

export {
  type ScannedManifestContract,
  type ScannedManifestOptions,
  type ScannedManifestLegacy,
  type ResolutionTraceNode,
  type KernelResolutionResultContract,
  type KernelResolutionResult,
  type KernelResolver,
  type ResolveManifestResult
} from './types/scannedManifestTypes';

export { ScannedResourceDescriptor } from './descriptors/scannedResourceDescriptor';

// Legacy Type Aliases for 100% Backwards Compatibility
import type { ScannedResourceLegacy } from './types/scannedResourceTypes';
import type { ScannedModelLegacy } from './types/scannedModelTypes';
import type { ScannedManifestLegacy } from './types/scannedManifestTypes';
import type { ScannedResourceDescriptor } from './descriptors/scannedResourceDescriptor';

export type ScannedResource = ScannedResourceLegacy | ScannedResourceDescriptor;
export type ScannedModel = ScannedModelLegacy;
export type ScannedManifest = ScannedManifestLegacy;
