import type { InterfaceDependencyBoundary } from '../../../types/interfaces/interfaceDependencyBoundary';
import type { RouteSyncManifest } from '../../../types/upstream/manifest';
import type { RequestType } from '../../artifacts/RequestTypesArtifact';
import type { ObjectType } from '../../../types/domain/semanticType';

/**
 * Downstream-owned type lowering boundary.
 *
 * Upstream owns the semantic facts carried by RouteSyncManifest. Wiring owns
 * the one explicit lowering step into compiler-facing RequestType/ObjectType
 * representations. The downstream representation is never imported by the
 * upstream semantic contracts themselves.
 */
export interface RouteManifestTypeLowering {
  readonly kind: 'route_manifest_type_lowering';
  readonly requestTypes: readonly RequestType[];
  readonly semanticTypes: readonly ObjectType[];
}

export interface RouteManifestTypeLoweringInterface
  extends InterfaceDependencyBoundary<RouteSyncManifest, RouteManifestTypeLowering> {}
