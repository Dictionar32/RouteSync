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
} from './requestTypeDerivationInterface';

/**
 * Result of the integrity gate. Invalid witnesses are terminal at this boundary:
 * the authority is not invoked and no replacement judgment or synthetic authority
 * assessment is manufactured.
 */
export type RequestTypeDerivationAuthorityIntegrityGateResult<
  TContract extends RequestTypeDerivationContract,
  TInference extends RequestTypeDerivationSemanticInferenceFor<TContract>,
> =
  | Readonly<{
      readonly kind: 'integrity_rejected';
      readonly integrity: Extract<
        RequestTypeDerivationSemanticAuthorityIntegrityResult<TContract, TInference>,
        { readonly kind: 'integrity_invalid' }
      >;
    }>
  | Readonly<{
      readonly kind: 'authority_evaluated';
      readonly assessment: RequestTypeDerivationSemanticAuthorityAssessmentFor<TContract, TInference>;
    }>;

/**
 * Invocation boundary for authority evaluation. The caller must pass the original
 * verification envelope produced for this inference packet. Passing the envelope
 * separately is deliberate: rebuilding it from candidate fields would make the
 * correlation checks tautological and would fail to detect detached/replayed
 * verifier output.
 */
export interface RequestTypeDerivationAuthorityIntegrityGateInterface<
  TContract extends RequestTypeDerivationContract,
  TInference extends RequestTypeDerivationSemanticInferenceFor<TContract>,
> {
  readonly evaluate: (
    input: RequestTypeDerivationInput,
    candidate: RequestTypeDerivationSemanticAuthorityCandidateFor<TContract, TInference>,
    verification: RequestTypeDerivationSemanticVerificationFor<TContract, TInference>,
  ) => RequestTypeDerivationAuthorityIntegrityGateResult<TContract, TInference>;
}

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
