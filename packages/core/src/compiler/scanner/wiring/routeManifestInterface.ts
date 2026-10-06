import type { RequestType } from '../../artifacts/RequestTypesArtifact';
import type { ObjectType } from '../../../types/domain/semanticType';
import type { RouteManifestDomainSurface } from '../../../types/domain/base';

/**
 * Downstream RouteManifest contract.
 *
 * The domain surface carries only upstream/domain semantics; compiler-specific
 * RequestType/ObjectType materialization is attached here at the wiring edge.
 */
export interface RouteManifest extends RouteManifestDomainSurface {
  readonly requestTypes: readonly RequestType[];
  readonly semanticTypes: readonly ObjectType[];
}
