import type { LaravelControllerInvocationSemanticJudgmentInventoryClosureReceipt } from '../../../types/upstream/laravelControllerInvocationSemanticJudgmentInventoryInterface';
import type { LaravelRouteSourceSelectionIntent } from '../../../types/upstream/laravelRouteSourceSelection';
import type { RouteSyncManifestFlow } from '../../../types/upstream/manifest';
import type { ManifestBuilderBlockedJudgment, ManifestBuilderJudgment, ManifestBuilderOperationPreparationInterface } from '../../../types/upstream/manifestBuilderInterface';

/** Every runtime scan carries its route-selection intent explicitly; omission is not a semantic default. */
export interface RouteSyncManifestScanOperationInput {
  readonly kind: 'route_sync_manifest_scan_operation_input';
  readonly invocationInventoryReceipt: LaravelControllerInvocationSemanticJudgmentInventoryClosureReceipt;
  readonly routeSelection: LaravelRouteSourceSelectionIntent;
}

/** Concrete successful result of the scanner's flow-projection operation. */
export interface RouteSyncManifestFlowCompleteJudgment {
  readonly kind: 'route_sync_manifest_flow_complete';
  readonly flow: RouteSyncManifestFlow;
}

/** Explicit discriminated result; blocked builder judgments are never normalized into success. */
export type RouteSyncManifestFlowScanJudgment =
  | ManifestBuilderBlockedJudgment
  | RouteSyncManifestFlowCompleteJudgment;

/** Runtime contract for scanner operations over an explicit, closed inventory receipt and route intent. */
export interface RouteSyncManifestScanOperationInterface {
  readonly kind: 'routesync_manifest_scan_operation';
  readonly contractVersion: 2;
  readonly scanFlow: (input: RouteSyncManifestScanOperationInput) => Promise<RouteSyncManifestFlowScanJudgment>;
  readonly scanManifest: (input: RouteSyncManifestScanOperationInput) => Promise<ManifestBuilderJudgment>;
}

/** Factory contract makes the builder-preparation authority an explicit dependency. */
export interface RouteSyncManifestScanOperationFactoryInterface {
  readonly create: (preparation: ManifestBuilderOperationPreparationInterface) => RouteSyncManifestScanOperationInterface;
}
