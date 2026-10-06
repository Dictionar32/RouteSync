import type { RouteSyncManifest } from '../../../types/upstream/manifest';
import type { RouteManifestProjection, RouteManifestProjectionInterface } from './routeManifestProjectionInterface';
import { routeManifestTypeLowering } from './routeManifestTypeLowering';

const project = (manifest: RouteSyncManifest): RouteManifestProjection => {
  const lowering = routeManifestTypeLowering.project(manifest);
  return Object.freeze({
    kind: 'route_manifest_projection',
    requestTypes: lowering.requestTypes,
    semanticTypes: lowering.semanticTypes,
  });
};

/** Canonical wiring implementation for downstream RouteManifest materialization. */
export const routeManifestProjection: RouteManifestProjectionInterface = Object.freeze({ project });

export const projectRouteSyncManifestForRouteManifest = (manifest: RouteSyncManifest): RouteManifestProjection =>
  routeManifestProjection.project(manifest);
