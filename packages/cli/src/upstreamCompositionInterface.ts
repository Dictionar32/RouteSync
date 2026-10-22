import type { RequestTypeDerivationSemanticPipelineInterface } from '@routesync/core';
import type { ControllerInvocationManifestCompositionAuthorityInterface } from './parsers/php/controllerInvocationManifestCompositionInterface';
import type { RouteSyncCliManifestScanOperationInterface } from './manifestScanOperationInterface';

/**
 * Closed CLI composition boundary: source-manifest production and request-type
 * semantic judgment are supplied together by the host that owns upstream wiring.
 * Commands consume these authorities; they do not construct semantic producers.
 */
export interface RouteSyncCliUpstreamCompositionInterface {
  readonly kind: 'routesync_cli_upstream_composition';
  readonly contractVersion: 1;
  readonly manifestComposition: ControllerInvocationManifestCompositionAuthorityInterface;
  /** Canonical interface-backed operation used by actual CLI scan/sync commands. */
  readonly manifestScanOperation: RouteSyncCliManifestScanOperationInterface;
  readonly requestTypeDerivationPipeline: RequestTypeDerivationSemanticPipelineInterface;
}
