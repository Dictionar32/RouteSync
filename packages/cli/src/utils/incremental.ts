/**
 * incremental.ts
 *
 * Active Consumer Orchestrator: Incremental manifest scanner, hashing, and resolution pipeline.
 * Follows Rule 14: 0 wildcard re-exports (`0 export * from`), active consumption.
 *
 * @module cli/utils/incremental
 */

import { buildSemanticIRNode, IRNodeRegistry, SemanticNode, SourceRef } from '@routesync/core';
import {
  ScannedRoute, ScannedModel, ScannedResource, ScannedManifest,
  KernelResolver, ResolveManifestResult,
  NominalAtomFactory, matchRouteResponsePayload,
  ScannedRouteDescriptor, ScannedResourceDescriptor, ScannedManifestDescriptor,
  type ScannedRouteMethod, type ScannedRoutePath, type ScannedRouteName,
  type ScannedStableHash, type SourceFilePath, type SourceLineNumber,
  type ScannedRouteContract, type ScannedResourceContract, type ScannedModelContract,
  type ScannedManifestContract, type RouteResponsePayloadContract, type RouteResponsePayloadVisitor
} from './incremental/incrementalTypes';
import { calculateRouteHash } from './incremental/routeHasher';
import { canonicalizeCollectionDescriptor } from './incremental/collectionCanonicalizer';
import { createFieldResolver } from './incremental/fieldResolver';
import { resolveModelAccessors } from './incremental/modelAccessorResolver';
import { resolveResources } from './incremental/resourceResolver';
import { resolveRoutes } from './incremental/routeResolver';
import { loadPreviousIncrementalState } from './incremental/cacheLoader';

export function resolveManifestIncrementally(
  newManifest: ScannedManifest,
  prevManifestPath: string,
  kernel: KernelResolver,
  models: ScannedModel[] | undefined
): ResolveManifestResult {
  const { prevManifest, prevIRNodes } = loadPreviousIncrementalState(prevManifestPath);
  const resolvedManifest = {
    ...newManifest,
    routes: newManifest.routes.map(route => ({ ...route })),
    resources: newManifest.resources.map(resource => ({ ...resource })),
    models: newManifest.models.map(model => ({ ...model }))
  } as ScannedManifest;
  const irRegistry = new IRNodeRegistry();

  const prevRouteMap = new Map<string, ScannedRoute>();
  if (prevManifest && prevManifest.routes) {
    prevManifest.routes.forEach((r: ScannedRoute) => prevRouteMap.set(`${r.method}:${r.path}`, r));
  }

  const registerIRNode = (id: string, source: SourceRef, rawCode: string, resolved: Record<string, unknown>, lineage: string[]) => {
    irRegistry.add(buildSemanticIRNode({ id, source, rawCode, semantic: resolved as unknown as SemanticNode, lineage }));
  };

  const resolveField = createFieldResolver(kernel, registerIRNode);
  resolveModelAccessors(resolvedManifest, kernel, registerIRNode);
  resolveResources(resolvedManifest, models, kernel, resolveField);
  resolveRoutes({
    manifest: resolvedManifest, prevRouteMap, prevIRNodes, models, kernel, irRegistry, resolveField
  });

  return { manifest: resolvedManifest, irRegistry };
}

export {
  ScannedRoute, ScannedModel, ScannedResource, ScannedManifest,
  KernelResolver, ResolveManifestResult, calculateRouteHash, canonicalizeCollectionDescriptor,
  NominalAtomFactory, matchRouteResponsePayload,
  ScannedRouteDescriptor, ScannedResourceDescriptor, ScannedManifestDescriptor,
  type ScannedRouteMethod, type ScannedRoutePath, type ScannedRouteName,
  type ScannedStableHash, type SourceFilePath, type SourceLineNumber,
  type ScannedRouteContract, type ScannedResourceContract, type ScannedModelContract,
  type ScannedManifestContract, type RouteResponsePayloadContract, type RouteResponsePayloadVisitor
};
