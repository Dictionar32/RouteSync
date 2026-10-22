import type {
  RequestTypeDerivationContract,
  RequestTypeDerivationSemanticAuthorityAssessmentFor,
  RequestTypeDerivationSemanticAuthorityCandidateFor,
  RequestTypeDerivationSemanticAuthorityIntegrityInterface,
  RequestTypeDerivationSemanticAuthorityIntegrityResult,
  RequestTypeDerivationSemanticAuthorityInterface,
  RequestTypeDerivationSemanticInferenceFor,
  RequestTypeDerivationSemanticVerificationFor,
  RequestTypeDerivationInput,
  RequestTypeDerivationAuthorityIntegrityGateInterface,
  RequestTypeDerivationAuthorityIntegrityGateResult,
} from '../../../types/upstream/requestTypeDerivationInterface';

/**
 * Wires the integrity validator directly in front of authority evaluation.
 * Invalid witness correlation short-circuits before authority.evaluate; this
 * gate never infers semantics, changes a judgment, or reclassifies a candidate.
 */
export const createRequestTypeDerivationAuthorityIntegrityGate = <
  TContract extends RequestTypeDerivationContract,
  TInference extends RequestTypeDerivationSemanticInferenceFor<TContract>,
>(
  authority: RequestTypeDerivationSemanticAuthorityInterface<TContract, TInference>,
  integrity: RequestTypeDerivationSemanticAuthorityIntegrityInterface<TContract, TInference>,
): RequestTypeDerivationAuthorityIntegrityGateInterface<TContract, TInference> => Object.freeze({
  evaluate: (
    input: RequestTypeDerivationInput,
    candidate: RequestTypeDerivationSemanticAuthorityCandidateFor<TContract, TInference>,
    verification: RequestTypeDerivationSemanticVerificationFor<TContract, TInference>,
  ) => {
    const result = integrity.validate(input, candidate, verification);
    if (result.kind === 'integrity_invalid') {
      return Object.freeze({ kind: 'integrity_rejected', integrity: result });
    }
    return Object.freeze({
      kind: 'authority_evaluated',
      assessment: authority.evaluate(input, result.candidate),
    });
  },
});
