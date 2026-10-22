import {
  requestTypeDerivationProductionPipelineAssembler,
  type RequestTypeDerivationSemanticPipelineAssemblyResult,
  type RequestTypeDerivationSemanticPipelineCompositionInterface,
} from '@routesync/core/upstream';
import type { ControllerInvocationManifestCompositionAuthorityInterface } from './parsers/php/controllerInvocationManifestCompositionInterface';
import type { RouteSyncCliUpstreamCompositionInterface } from './upstreamCompositionInterface';
import { routeSyncCliManifestScanOperationFactory } from './manifestScanOperationInterface';

/**
 * The one CLI composition operation. It combines the already-owned manifest
 * authority with a fully supplied semantic capability bundle. It deliberately
 * does not manufacture reasoning, verification, decisions, or authority.
 */
export type RouteSyncCliUpstreamCompositionResolution =
  | Readonly<{
      readonly kind: 'routesync_cli_upstream_composition_available';
      readonly composition: RouteSyncCliUpstreamCompositionInterface;
    }>
  | Readonly<{
      readonly kind: 'routesync_cli_upstream_semantic_assembly_rejected';
      readonly assembly: Extract<RequestTypeDerivationSemanticPipelineAssemblyResult, { readonly kind: 'rejected' }>;
    }>;

export interface RouteSyncCliUpstreamCompositionFactoryInterface {
  readonly compose: (
    manifestComposition: ControllerInvocationManifestCompositionAuthorityInterface,
    semanticComposition: RequestTypeDerivationSemanticPipelineCompositionInterface,
  ) => RouteSyncCliUpstreamCompositionResolution;
}

export const routeSyncCliUpstreamCompositionFactory: RouteSyncCliUpstreamCompositionFactoryInterface = Object.freeze({
  compose: (
    manifestComposition: ControllerInvocationManifestCompositionAuthorityInterface,
    semanticComposition: RequestTypeDerivationSemanticPipelineCompositionInterface,
  ): RouteSyncCliUpstreamCompositionResolution => {
  const assembly = requestTypeDerivationProductionPipelineAssembler.assemble(semanticComposition);
  switch (assembly.kind) {
    case 'rejected':
      return Object.freeze({
        kind: 'routesync_cli_upstream_semantic_assembly_rejected',
        assembly,
      });
    case 'assembled':
      return Object.freeze({
        kind: 'routesync_cli_upstream_composition_available',
        composition: Object.freeze({
          kind: 'routesync_cli_upstream_composition',
          contractVersion: 1,
          manifestComposition,
          manifestScanOperation: routeSyncCliManifestScanOperationFactory.create(manifestComposition),
          requestTypeDerivationPipeline: assembly.pipeline,
        }),
      });
    default: {
      const exhaustive: never = assembly;
      return exhaustive;
    }
  }
  },
});
