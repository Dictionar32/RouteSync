import type {
  RequestTypeDerivationSemanticPipelineAssemblyResult,
  RequestTypeDerivationSemanticPipelineCompositionInterface,
  RequestTypeDerivationSemanticPipelineInterface,
  RequestTypeDerivationSemanticPipelineResolutionInterface,
  RequestTypeDerivationSemanticPipelineResolutionInput,
  RequestTypeDerivationSemanticInferenceFor,
  RequestTypeDerivationContract,
} from '../../../types/upstream/requestTypeDerivationInterface';
import { requestTypeDerivationContract } from '../../../types/upstream/requestTypeDerivationInterface';
import { createRequestTypeDerivationSemanticPipelineAssembler } from './requestTypeDerivationSemanticPipelineAssembler';

/**
 * Production composition boundary for the CLI.
 *
 * This factory connects the four upstream semantic capabilities through the
 * canonical assembler. Contract mismatches remain a typed rejection; no partial
 * pipeline or legacy RequestType[] fallback is exposed.
 *
 * This assembler validates and wires capabilities; it is not itself semantic
 * evidence. The repository has a concrete composition in
 * requestTypeDerivationSemanticComposition.ts, but its verifier currently returns
 * verification_incomplete for the supported slices because all canonical laws
 * are not independently checked. Assembly must never be mistaken for proof
 * completeness, and downstream authority therefore remains fail-closed.
 */
export interface RequestTypeDerivationProductionPipelineAssemblerInterface {
  readonly assemble: <
    TContract extends RequestTypeDerivationContract,
    TInference extends RequestTypeDerivationSemanticInferenceFor<TContract>,
  >(
    composition: RequestTypeDerivationSemanticPipelineCompositionInterface<TContract, TInference>,
  ) => RequestTypeDerivationSemanticPipelineAssemblyResult<TContract, TInference>;
}

export const requestTypeDerivationProductionPipelineAssembler: RequestTypeDerivationProductionPipelineAssemblerInterface = Object.freeze({
  assemble: <
    TContract extends RequestTypeDerivationContract,
    TInference extends RequestTypeDerivationSemanticInferenceFor<TContract>,
  >(
    composition: RequestTypeDerivationSemanticPipelineCompositionInterface<TContract, TInference>,
  ): RequestTypeDerivationSemanticPipelineAssemblyResult<TContract, TInference> =>
    createRequestTypeDerivationSemanticPipelineAssembler<TContract, TInference>().assemble(composition),
});

/**
 * Resolve the consumer contract before CLI source acquisition. Missing production
 * semantic capabilities are a closed composition outcome, not an exception and
 * not permission to synthesize judgments from the legacy RequestType[] solver.
 */
export const requestTypeDerivationSemanticPipelineResolution: RequestTypeDerivationSemanticPipelineResolutionInterface = Object.freeze({
  kind: 'request_type_semantic_pipeline_resolution',
  contractVersion: 2,
  resolve: (input: RequestTypeDerivationSemanticPipelineResolutionInput) => {
    switch (input.kind) {
      case 'request_type_semantic_pipeline_supplied':
        return input.pipeline.contract === requestTypeDerivationContract
          ? Object.freeze({ kind: 'request_type_semantic_pipeline_available' as const, pipeline: input.pipeline })
          : Object.freeze({
              kind: 'request_type_semantic_pipeline_unavailable' as const,
              reason: 'semantic_contract_identity_mismatch' as const,
              expectedContract: requestTypeDerivationContract,
              suppliedContract: input.pipeline.contract,
            });
      case 'cli_upstream_composition_missing':
        return Object.freeze({
          kind: 'request_type_semantic_pipeline_unavailable' as const,
          reason: 'cli_upstream_composition_missing' as const,
          requiredComposition: Object.freeze(['manifest_composition', 'request_type_semantic_pipeline'] as const),
        });
      default: {
        const exhaustive: never = input;
        return exhaustive;
      }
    }
  },
});

/** Compatibility guard for existing callers; CLI commands consume the closed ADT above. */
export interface RequestTypeDerivationSemanticPipelineRequirementInterface {
  readonly require: (pipeline?: RequestTypeDerivationSemanticPipelineInterface) => RequestTypeDerivationSemanticPipelineInterface;
}

export const requestTypeDerivationSemanticPipelineRequirement: RequestTypeDerivationSemanticPipelineRequirementInterface = Object.freeze({
  require: (pipeline?: RequestTypeDerivationSemanticPipelineInterface): RequestTypeDerivationSemanticPipelineInterface => {
    const resolution = requestTypeDerivationSemanticPipelineResolution.resolve(pipeline === undefined
      ? Object.freeze({ kind: 'cli_upstream_composition_missing' as const })
      : Object.freeze({ kind: 'request_type_semantic_pipeline_supplied' as const, pipeline }));
    switch (resolution.kind) {
      case 'request_type_semantic_pipeline_available':
        return resolution.pipeline;
      case 'request_type_semantic_pipeline_unavailable':
        throw new Error(
          'RequestType semantic pipeline is not composed: supply upstream reasoning, the complete canonical-law proof verifier, decision, and authority through requestTypeDerivationProductionPipelineAssembler. Legacy RequestType[] fallback is disabled.',
        );
      default: {
        const exhaustive: never = resolution;
        return exhaustive;
      }
    }
  },
});
