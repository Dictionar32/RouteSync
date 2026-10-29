/**
 * RequestType semantic pipeline assembly.
 *
 * This operation connects the already-declared upstream capabilities into the
 * one consumer-facing pipeline. It does not implement source reasoning, proof
 * verification, decision rules, or authority adjudication; those remain injected
 * semantic capabilities and must share the exact canonical contract value.
 */
import type {
  RequestTypeDerivationContract,
  RequestTypeDerivationSemanticPipelineAssemblerInterface,
  RequestTypeDerivationSemanticPipelineCompositionInterface,
  RequestTypeDerivationSemanticPipelineAssemblyResult,
  RequestTypeDerivationSemanticPipelineInterface,
  RequestTypeDerivationSemanticPipelineDerivationResult,
  RequestTypeDerivationSemanticInferenceFor,
  RequestTypeDerivationSemanticAuthorityCandidateFor,
  RequestTypeDerivationSemanticPipelineContractMismatch,
} from '../../../types/upstream/requestTypeDerivationInterface';
import { createRequestTypeDerivationAuthorityCoverage } from './requestTypeDerivationCoverage';
import { createSourceOccurrenceGuardedRequestTypeDerivationProofVerifier } from './requestTypeDerivationSourceOccurrenceVerification';
import { requestTypeDerivationSemanticAssessmentValidatorFactory } from './requestTypeDerivationAssessmentIntegrity';
import { createRequestTypeDerivationAuthorityIntegrityGate } from './requestTypeDerivationAuthorityIntegrityGate';

const mismatch = (
  capability: RequestTypeDerivationSemanticPipelineContractMismatch['capability'],
  expected: RequestTypeDerivationContract,
  actual: RequestTypeDerivationContract,
): RequestTypeDerivationSemanticPipelineContractMismatch => Object.freeze({
  kind: 'contract_mismatch',
  capability,
  expected,
  actual,
});

const contractMismatches = <
  TContract extends RequestTypeDerivationContract,
  TInference extends RequestTypeDerivationSemanticInferenceFor<TContract>,
>(
  composition: RequestTypeDerivationSemanticPipelineCompositionInterface<TContract, TInference>,
): readonly [RequestTypeDerivationSemanticPipelineContractMismatch, ...RequestTypeDerivationSemanticPipelineContractMismatch[]] | undefined => {
  const mismatches = [
    composition.reasoning.contract === composition.contract ? undefined : mismatch('reasoning', composition.contract, composition.reasoning.contract),
    composition.verifier.contract === composition.contract ? undefined : mismatch('verifier', composition.contract, composition.verifier.contract),
    composition.decision.contract === composition.contract ? undefined : mismatch('decision', composition.contract, composition.decision.contract),
    composition.authority.contract === composition.contract ? undefined : mismatch('authority', composition.contract, composition.authority.contract),
    composition.integrity.contract === composition.contract ? undefined : mismatch('integrity', composition.contract, composition.integrity.contract),
  ].filter((candidate): candidate is RequestTypeDerivationSemanticPipelineContractMismatch => candidate !== undefined);
  const first = mismatches[0];
  return first === undefined ? undefined : Object.freeze([first, ...mismatches.slice(1)]);
};

const assemblePipeline = <
  TContract extends RequestTypeDerivationContract,
  TInference extends RequestTypeDerivationSemanticInferenceFor<TContract>,
>(
  composition: RequestTypeDerivationSemanticPipelineCompositionInterface<TContract, TInference>,
): RequestTypeDerivationSemanticPipelineInterface<TContract, TInference> => {
  const coverage = createRequestTypeDerivationAuthorityCoverage(composition.contract);
  const verifier = createSourceOccurrenceGuardedRequestTypeDerivationProofVerifier(composition.verifier);
  const authorityIntegrityGate = createRequestTypeDerivationAuthorityIntegrityGate(composition.authority, composition.integrity);
  const validateAssessment = requestTypeDerivationSemanticAssessmentValidatorFactory.create(composition.contract);

  return Object.freeze({
    contract: composition.contract,
    derive: (input: TInference['input']): RequestTypeDerivationSemanticPipelineDerivationResult<TContract, TInference> => {
      const preparedInput = composition.preparation.prepare(input);
      const inference = composition.reasoning.infer(preparedInput);
      const verification = verifier.verify(inference);
      const coverageEvidence = coverage.assess(verification.result);
      const candidate: RequestTypeDerivationSemanticAuthorityCandidateFor<TContract, TInference> = composition.decision.decide({
        contract: composition.contract,
        inference,
        verification,
        coverage: coverageEvidence,
      });
      const authorityResult = authorityIntegrityGate.evaluate(input, candidate, verification);
      switch (authorityResult.kind) {
        case 'integrity_rejected':
          return authorityResult;
        case 'authority_evaluated':
          return authorityResult.assessment;
        default: {
          const exhaustive: never = authorityResult;
          return exhaustive;
        }
      }
    },
    validateAssessment,
  });
};

/**
 * Assembles a consumer pipeline only when all capabilities share the canonical
 * contract instance. A mismatch is returned as typed data; no partial pipeline
 * or fallback implementation is exposed.
 */
export const createRequestTypeDerivationSemanticPipelineAssembler =
  <
    TContract extends RequestTypeDerivationContract = RequestTypeDerivationContract,
    TInference extends RequestTypeDerivationSemanticInferenceFor<TContract> =
      RequestTypeDerivationSemanticInferenceFor<TContract>,
  >(): RequestTypeDerivationSemanticPipelineAssemblerInterface<TContract, TInference> => Object.freeze({
    assemble: (
      composition: RequestTypeDerivationSemanticPipelineCompositionInterface<TContract, TInference>,
    ): RequestTypeDerivationSemanticPipelineAssemblyResult<TContract, TInference> => {
      const mismatches = contractMismatches(composition);
      if (mismatches !== undefined) {
        const result: Extract<RequestTypeDerivationSemanticPipelineAssemblyResult<TContract, TInference>, { readonly kind: 'rejected' }> = Object.freeze({
          kind: 'rejected' as const,
          mismatches,
          continueWith: <TResult>(handlers: import('../../../types/upstream/requestTypeDerivationInterface').RequestTypeDerivationSemanticPipelineAssemblyHandlers<TResult, TContract, TInference>): TResult => handlers.rejected(result),
        });
        return result;
      }
      const pipeline = assemblePipeline(composition);
      const result: Extract<RequestTypeDerivationSemanticPipelineAssemblyResult<TContract, TInference>, { readonly kind: 'assembled' }> = Object.freeze({
        kind: 'assembled' as const,
        pipeline,
        continueWith: <TResult>(handlers: import('../../../types/upstream/requestTypeDerivationInterface').RequestTypeDerivationSemanticPipelineAssemblyHandlers<TResult, TContract, TInference>): TResult => handlers.assembled(pipeline),
      });
      return result;
    },
  });
