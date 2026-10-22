import type {
  RequestTypeDerivationContract,
  RequestTypeDerivationSemanticAuthorityCandidateFor,
  RequestTypeDerivationSemanticAuthorityIntegrityInterface,
  RequestTypeDerivationSemanticAuthorityIntegrityResult,
  RequestTypeDerivationSemanticInferenceFor,
  RequestTypeDerivationSemanticVerificationFor,
} from '../../../types/upstream/requestTypeDerivationInterface';

/**
 * Builds the runtime witness-integrity capability for one authority contract.
 * This executor only correlates existing evidence; it never derives or repairs
 * semantic judgments. Source input, inference, judgment and verification result
 * are identity-bound, while contract values use the supplied explicit policy.
 */
export const createRequestTypeDerivationSemanticAuthorityIntegrity = <
  TContract extends RequestTypeDerivationContract,
  TInference extends RequestTypeDerivationSemanticInferenceFor<TContract>,
>(
  capability: Pick<
    RequestTypeDerivationSemanticAuthorityIntegrityInterface<TContract, TInference>,
    'contract' | 'contractEquivalence'
  >,
): RequestTypeDerivationSemanticAuthorityIntegrityInterface<TContract, TInference> => ({
  contract: capability.contract,
  contractEquivalence: capability.contractEquivalence,
  validate: (expectedInput, candidate, verification): RequestTypeDerivationSemanticAuthorityIntegrityResult<TContract, TInference> => {
    const violations: Array<
      | 'authority_contract_mismatch'
      | 'verification_contract_mismatch'
      | 'inference_packet_mismatch'
      | 'source_input_mismatch'
      | 'judgment_mismatch'
      | 'verification_result_mismatch'
    > = [];
    const equivalent = capability.contractEquivalence.equivalent;
    const proof = candidate.proof;
    const inference = verification.inference;
    const coverageContract = proof.premises.coverage.contract;

    if (!equivalent(capability.contract, candidate.contract)
      || !equivalent(capability.contract, proof.verificationBinding.contract)
      || !equivalent(capability.contract, inference.contract)
      || !equivalent(capability.contract, coverageContract)) {
      violations.push('authority_contract_mismatch');
    }

    if (!equivalent(capability.contract, verification.contract)) {
      violations.push('verification_contract_mismatch');
    }

    if (proof.verificationBinding.inference !== inference) {
      violations.push('inference_packet_mismatch');
    }

    if (proof.premises.input !== expectedInput || inference.input !== expectedInput) {
      violations.push('source_input_mismatch');
    }

    if (proof.premises.judgment !== inference.judgment) {
      violations.push('judgment_mismatch');
    }

    if (proof.premises.verification !== verification.result) {
      violations.push('verification_result_mismatch');
    }

    if (violations.length === 0) {
      return { kind: 'integrity_valid', candidate };
    }

    const firstViolation = violations[0];
    if (firstViolation === undefined) {
      return { kind: 'integrity_valid', candidate };
    }
    return {
      kind: 'integrity_invalid',
      violations: [firstViolation, ...violations.slice(1)],
    };
  },
});
