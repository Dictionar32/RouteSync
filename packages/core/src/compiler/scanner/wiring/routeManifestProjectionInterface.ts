import type { InterfaceDependencyBoundary } from '../../../types/interfaces/interfaceDependencyBoundary';
import type { RouteSyncManifest } from '../../../types/upstream/manifest';
import type { RequestType } from '../../artifacts/RequestTypesArtifact';
import type { ObjectType } from '../../../types/domain/semanticType';

/**
 * Downstream materialization input produced from the completed upstream
 * manifest. This is wiring data, not a new semantic authority.
 */
export interface RouteManifestProjection {
  readonly kind: 'route_manifest_projection';
  readonly requestTypes: readonly RequestType[];
  readonly semanticTypes: readonly ObjectType[];
}

/** Downstream-owned boundary: upstream manifest -> RouteManifest projection data. */
export interface RouteManifestProjectionInterface
  extends InterfaceDependencyBoundary<RouteSyncManifest, RouteManifestProjection> {}
