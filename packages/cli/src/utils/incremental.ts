/**
 * incremental.ts
 *
 * Active Consumer Orchestrator: Incremental manifest scanner, hashing, and resolution pipeline.
 *
 * Follows Rule 14: 0 wildcard re-exports (`0 export * from`), active consumption,
 * and pure flow declaration.
 *
 * @module cli/utils/incremental
 */

import fs from 'fs-extra';
import path from 'path';
import {
  buildSemanticIRNode,
  IRNodeRegistry,
  SemanticIRNode,
  SemanticNode,
  SourceRef
} from '@routesync/core';

import {
  ScannedRoute,
  ScannedModel,
  ScannedResource,
  ScannedManifest,
  KernelResolver,
  ResolveManifestResult
} from './incremental/incrementalTypes';

import { calculateRouteHash } from './incremental/routeHasher';
import { canonicalizeCollectionDescriptor } from './incremental/collectionCanonicalizer';
import { createFieldResolver } from './incremental/fieldResolver';
import { resolveModelAccessors } from './incremental/modelAccessorResolver';
import { resolveResources } from './incremental/resourceResolver';
import { resolveRoutes } from './incremental/routeResolver';

// ============================================================================
// Active Consumer: Incremental Resolution Orchestrator
// ============================================================================

export function resolveManifestIncrementally(
  newManifest: ScannedManifest,
  prevManifestPath: string,
  kernel: KernelResolver,
  models: ScannedModel[] | undefined
): ResolveManifestResult {
  let prevManifest: ScannedManifest | null = null;
  if (fs.existsSync(prevManifestPath)) {
    try {
      prevManifest = fs.readJsonSync(prevManifestPath);
    } catch {
      // ignore JSON parsing errors
    }
  }

  const resolvedManifest = JSON.parse(JSON.stringify(newManifest)) as ScannedManifest;
  const irRegistry = new IRNodeRegistry();

  let prevIRNodes: Record<string, SemanticIRNode> = {};
  const prevIRPath = path.resolve(path.dirname(prevManifestPath), 'routesync.ir.json');
  if (fs.existsSync(prevIRPath)) {
    try {
      const prevIR = fs.readJsonSync(prevIRPath);
      prevIRNodes = prevIR?.nodes || {};
    } catch {
      // ignore JSON parsing errors
    }
  }

  const prevRouteMap = new Map<string, ScannedRoute>();
  if (prevManifest && prevManifest.routes) {
    prevManifest.routes.forEach((r: ScannedRoute) => {
      prevRouteMap.set(`${r.method}:${r.path}`, r);
    });
  }

  const registerIRNode = (
    id: string,
    source: SourceRef,
    rawCode: string,
    resolved: Record<string, unknown>,
    lineage: string[]
  ) => {
    irRegistry.add(
      buildSemanticIRNode({
        id,
        source,
        rawCode,
        semantic: resolved as unknown as SemanticNode,
        lineage,
      })
    );
  };

  const resolveField = createFieldResolver(kernel, registerIRNode);

  resolveModelAccessors(resolvedManifest, kernel, registerIRNode);
  resolveResources(resolvedManifest, models, kernel, resolveField);
  resolveRoutes({
    manifest: resolvedManifest,
    prevRouteMap,
    prevIRNodes,
    models,
    kernel,
    irRegistry,
    resolveField
  });

  return { manifest: resolvedManifest, irRegistry };
}

// ============================================================================
// Explicit Named Exports (Rule 14: Zero Wildcard Re-export)
// ============================================================================

export {
  ScannedRoute,
  ScannedModel,
  ScannedResource,
  ScannedManifest,
  KernelResolver,
  ResolveManifestResult,
  calculateRouteHash,
  canonicalizeCollectionDescriptor
};
