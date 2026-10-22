import type {
  ControllerInvocationManifest,
  ControllerInvocationManifestCompositionAuthorityInterface,
  ControllerInvocationManifestCompositionInput,
} from './parsers/php/controllerInvocationManifestCompositionInterface';

/** Runtime contract used by CLI scan/sync to request the canonical upstream manifest. */
export interface RouteSyncCliManifestScanOperationInterface {
  readonly kind: 'routesync_cli_manifest_scan_operation';
  readonly contractVersion: 1;
  readonly scan: (input: ControllerInvocationManifestCompositionInput) => Promise<ControllerInvocationManifest>;
}

/** Factory contract keeps composition authority explicit at the CLI runtime boundary. */
export interface RouteSyncCliManifestScanOperationFactoryInterface {
  readonly create: (
    authority: ControllerInvocationManifestCompositionAuthorityInterface,
  ) => RouteSyncCliManifestScanOperationInterface;
}

/** Fully typed runtime factory object; no exported function or untyped factory alias. */
export const routeSyncCliManifestScanOperationFactory: RouteSyncCliManifestScanOperationFactoryInterface = Object.freeze({
  create: (authority: ControllerInvocationManifestCompositionAuthorityInterface): RouteSyncCliManifestScanOperationInterface =>
    Object.freeze({
      kind: 'routesync_cli_manifest_scan_operation',
      contractVersion: 1,
      scan: (input: ControllerInvocationManifestCompositionInput): Promise<ControllerInvocationManifest> =>
        authority.compose(input),
    }),
});
