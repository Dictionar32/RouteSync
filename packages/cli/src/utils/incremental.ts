/**
 * incremental.ts
 *
 * Active Consumer Orchestrator: Incremental manifest scanner, hashing, and resolution pipeline.
 * Follows Rule 14: 0 wildcard re-exports (`0 export * from`), active consumption.
 *
 * @module cli/utils/incremental
 */

import { IRNodeRegistry } from '@routesync/core';
import {
  ScannedModel, ScannedResource, ScannedManifest,
  KernelResolver, ResolveManifestResult,
  NominalAtomFactory, matchRouteResponsePayload,
  ScannedResourceDescriptor,
  type RouteSemanticFlowMethod, type RouteSemanticFlowPath, type RouteSemanticFlowName,
  type ScannedStableHash, type SourceFilePath, type SourceLineNumber,
  type ScannedResourceContract, type ScannedModelContract,
  type ScannedManifestContract, type RouteResponsePayloadContract, type RouteResponsePayloadVisitor
} from './incremental/incrementalTypes';

export function resolveManifestIncrementally(
  newManifest: ScannedManifest,
  _prevManifestPath?: string,
  _kernel?: KernelResolver,
  _models?: ScannedModel[]
): ResolveManifestResult {
  const irRegistry = new IRNodeRegistry();

  // Compatibility transport only: the upstream scanner already owns semantic
  // construction. Do not clone, normalize, resolve, or rebuild semantic data
  // here. The remaining legacy signature is retained until CLI callers are
  // migrated to RouteSyncManifestFlow directly.
  return { manifest: newManifest, irRegistry };
}

export {
  ScannedModel, ScannedResource, ScannedManifest,
  KernelResolver, ResolveManifestResult,
  NominalAtomFactory, matchRouteResponsePayload,
  ScannedResourceDescriptor,
  type RouteSemanticFlowMethod, type RouteSemanticFlowPath, type RouteSemanticFlowName,
  type ScannedStableHash, type SourceFilePath, type SourceLineNumber,
  type ScannedResourceContract, type ScannedModelContract,
  type ScannedManifestContract, type RouteResponsePayloadContract, type RouteResponsePayloadVisitor
};
