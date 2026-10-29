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
export interface RouteSyncCliUpstreamCompositionResolutionHandlers<TResult> {
  readonly compositionAvailable: (composition: RouteSyncCliUpstreamCompositionInterface) => TResult;
  readonly semanticAssemblyRejected: (assembly: Extract<RequestTypeDerivationSemanticPipelineAssemblyResult, { readonly kind: 'rejected' }>) => TResult;
}

/** Closed CLI composition ADT; each outcome owns the domain continuation into CLI composition. */
export type RouteSyncCliUpstreamCompositionResolution =
  | Readonly<{
      readonly kind: 'routesync_cli_upstream_composition_available';
      readonly composition: RouteSyncCliUpstreamCompositionInterface;
      readonly continueForCliComposition: <TResult>(handlers: RouteSyncCliUpstreamCompositionResolutionHandlers<TResult>) => TResult;
    }>
  | Readonly<{
      readonly kind: 'routesync_cli_upstream_semantic_assembly_rejected';
      readonly assembly: Extract<RequestTypeDerivationSemanticPipelineAssemblyResult, { readonly kind: 'rejected' }>;
      readonly continueForCliComposition: <TResult>(handlers: RouteSyncCliUpstreamCompositionResolutionHandlers<TResult>) => TResult;
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
    return assembly.continueWith({
      rejected: rejectedAssembly => Object.freeze({
        kind: 'routesync_cli_upstream_semantic_assembly_rejected',
        assembly: rejectedAssembly,
        continueForCliComposition: <TResult>(handlers: RouteSyncCliUpstreamCompositionResolutionHandlers<TResult>): TResult => handlers.semanticAssemblyRejected(rejectedAssembly),
      }),
      assembled: pipeline => {
        const composition: RouteSyncCliUpstreamCompositionInterface = Object.freeze({
          kind: 'routesync_cli_upstream_composition',
          contractVersion: 1,
          manifestComposition,
          manifestScanOperation: routeSyncCliManifestScanOperationFactory.create(manifestComposition),
          requestTypeDerivationPipeline: pipeline,
        });
        return Object.freeze({
          kind: 'routesync_cli_upstream_composition_available',
          composition,
          continueForCliComposition: <TResult>(handlers: RouteSyncCliUpstreamCompositionResolutionHandlers<TResult>): TResult => handlers.compositionAvailable(composition),
        });
      },
    });
  },
});
