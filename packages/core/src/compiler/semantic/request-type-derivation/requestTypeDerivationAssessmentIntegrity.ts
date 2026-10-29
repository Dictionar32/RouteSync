/**
 * Upstream semantic authority integrity implementation.
 * Validates the closed proof's rule/judgment/verification/coverage correlation.
 * It does not infer or repair semantic meaning; the pipeline exposes this
 * capability so runtime executors do not duplicate semantic adjudication.
 */
import type {
  RequestTypeDerivationContract,
  RequestTypeDerivationSemanticAuthorityAssessment,
  RequestTypeDerivationSemanticAssessmentIntegrityResult,
  RequestTypeAuthorityDecisionProof,
  RequestTypeDerivationSemanticAuthorityAssessmentFor,
  RequestTypeDerivationSemanticInferenceFor,
} from '../../../types/upstream/requestTypeDerivationInterface';

const coverageContractMatches = (
  coverageContract: RequestTypeDerivationContract | null,
  contract: RequestTypeDerivationContract,
): boolean => coverageContract === contract;

const authorityReasonMatchesDecision = (
  decision: Extract<
    RequestTypeAuthorityDecisionProof,
    { readonly conclusion: 'authority_inconsistent' }
  >,
): boolean => {
  switch (decision.ruleId) {
    case 'judgment_verification_kind_conflict':
      return decision.reason === 'judgment_verification_kind_mismatch';
    case 'rejection_reason_conflict':
      return decision.reason === 'rejection_reason_mismatch';
    case 'rejection_evidence_conflict':
      return decision.reason === 'rejection_witness_mismatch';
    case 'contract_law_coverage_incomplete':
      return decision.reason === 'contract_law_coverage_incomplete';
    case 'verified_law_coverage_incomplete':
      return decision.reason === 'verified_law_coverage_incomplete';
    default: {
      const exhaustive: never = decision;
      return exhaustive;
    }
  }
};

/**
 * Runtime integrity check for the authority's correlated proof algebra.
 * This validates that the returned proof is internally coherent; it does not
 * derive request meaning or repair a malformed judgment.
 */
export interface RequestTypeDerivationSemanticAssessmentIntegrityOperationInterface {
  readonly validate: <
    TContract extends RequestTypeDerivationContract,
    TInference extends RequestTypeDerivationSemanticInferenceFor<TContract>,
  >(
    assessment: RequestTypeDerivationSemanticAuthorityAssessmentFor<TContract, TInference>,
    contract: TContract,
  ) => RequestTypeDerivationSemanticAssessmentIntegrityResult;
}

export const requestTypeDerivationSemanticAssessmentIntegrityOperation:
  RequestTypeDerivationSemanticAssessmentIntegrityOperationInterface = Object.freeze({
  validate: <
    TContract extends RequestTypeDerivationContract,
    TInference extends RequestTypeDerivationSemanticInferenceFor<TContract>,
  >(
    assessment: RequestTypeDerivationSemanticAuthorityAssessmentFor<TContract, TInference>,
    contract: TContract,
  ): RequestTypeDerivationSemanticAssessmentIntegrityResult => {
  const decision = assessment.decision;
  if (decision.conclusion !== assessment.kind) return { kind: 'assessment_integrity_invalid', reason: 'assessment_conclusion_mismatch' };

  switch (assessment.kind) {
    case 'derivation_verified':
      if (decision.ruleId !== 'closed_derivation_with_complete_verification') return { kind: 'assessment_integrity_invalid', reason: 'decision_rule_mismatch' };
      if (decision.premises.judgment.kind !== 'derived') return { kind: 'assessment_integrity_invalid', reason: 'judgment_kind_mismatch' };
      if (decision.premises.verification.kind !== 'valid') return { kind: 'assessment_integrity_invalid', reason: 'verification_kind_mismatch' };
      if (decision.premises.coverage.kind !== 'complete') return { kind: 'assessment_integrity_invalid', reason: 'coverage_not_complete' };
      if (!coverageContractMatches(decision.premises.coverage.contract, contract)) return { kind: 'assessment_integrity_invalid', reason: 'coverage_contract_mismatch' };
      return { kind: 'assessment_integrity_valid' };
    case 'incompleteness_verified':
      if (decision.ruleId !== 'incomplete_derivation_with_complete_verification') return { kind: 'assessment_integrity_invalid', reason: 'decision_rule_mismatch' };
      if (decision.premises.judgment.kind !== 'incomplete') return { kind: 'assessment_integrity_invalid', reason: 'judgment_kind_mismatch' };
      if (decision.premises.verification.kind !== 'valid') return { kind: 'assessment_integrity_invalid', reason: 'verification_kind_mismatch' };
      if (decision.premises.coverage.kind !== 'complete') return { kind: 'assessment_integrity_invalid', reason: 'coverage_not_complete' };
      if (!coverageContractMatches(decision.premises.coverage.contract, contract)) return { kind: 'assessment_integrity_invalid', reason: 'coverage_contract_mismatch' };
      return { kind: 'assessment_integrity_valid' };
    case 'conflict_verified':
      if (decision.ruleId !== 'conflicted_derivation_with_complete_verification') return { kind: 'assessment_integrity_invalid', reason: 'decision_rule_mismatch' };
      if (decision.premises.judgment.kind !== 'conflict') return { kind: 'assessment_integrity_invalid', reason: 'judgment_kind_mismatch' };
      if (decision.premises.verification.kind !== 'valid') return { kind: 'assessment_integrity_invalid', reason: 'verification_kind_mismatch' };
      if (decision.premises.coverage.kind !== 'complete') return { kind: 'assessment_integrity_invalid', reason: 'coverage_not_complete' };
      if (!coverageContractMatches(decision.premises.coverage.contract, contract)) return { kind: 'assessment_integrity_invalid', reason: 'coverage_contract_mismatch' };
      return { kind: 'assessment_integrity_valid' };
    case 'input_rejected':
      if (decision.ruleId !== 'invalid_input_with_matching_rejection_witness') return { kind: 'assessment_integrity_invalid', reason: 'decision_rule_mismatch' };
      if (decision.premises.judgment.kind !== 'invalid_input') return { kind: 'assessment_integrity_invalid', reason: 'judgment_kind_mismatch' };
      if (decision.premises.verification.kind !== 'rejection_confirmed') return { kind: 'assessment_integrity_invalid', reason: 'verification_kind_mismatch' };
      return { kind: 'assessment_integrity_valid' };
    case 'verification_failed':
      if (decision.ruleId !== 'non_invalid_judgment_with_counterexample') return { kind: 'assessment_integrity_invalid', reason: 'decision_rule_mismatch' };
      if (decision.premises.verification.kind !== 'invalid') return { kind: 'assessment_integrity_invalid', reason: 'verification_kind_mismatch' };
      return { kind: 'assessment_integrity_valid' };
    case 'rejection_verification_failed':
      if (decision.ruleId !== 'invalid_input_with_rejection_counterexample') return { kind: 'assessment_integrity_invalid', reason: 'decision_rule_mismatch' };
      if (decision.premises.judgment.kind !== 'invalid_input') return { kind: 'assessment_integrity_invalid', reason: 'judgment_kind_mismatch' };
      if (decision.premises.verification.kind !== 'invalid') return { kind: 'assessment_integrity_invalid', reason: 'verification_kind_mismatch' };
      return { kind: 'assessment_integrity_valid' };
    case 'authority_inconsistent':
      return authorityReasonMatchesDecision(assessment.decision)
        ? { kind: 'assessment_integrity_valid' }
        : { kind: 'assessment_integrity_invalid', reason: 'authority_reason_mismatch' };
    default: {
      const exhaustive: never = assessment;
      return exhaustive;
    }
  }
  },
});

export interface RequestTypeDerivationSemanticAssessmentValidatorFactoryInterface {
  readonly create: (
    contract: RequestTypeDerivationContract,
  ) => (assessment: RequestTypeDerivationSemanticAuthorityAssessment) => RequestTypeDerivationSemanticAssessmentIntegrityResult;
}

/** Bind the validator to the exact policy value exposed by a semantic pipeline. */
export const requestTypeDerivationSemanticAssessmentValidatorFactory:
  RequestTypeDerivationSemanticAssessmentValidatorFactoryInterface = Object.freeze({
  create: (
    contract: RequestTypeDerivationContract,
  ): ((assessment: RequestTypeDerivationSemanticAuthorityAssessment) => RequestTypeDerivationSemanticAssessmentIntegrityResult) => (
    assessment: RequestTypeDerivationSemanticAuthorityAssessment,
  ): RequestTypeDerivationSemanticAssessmentIntegrityResult =>
    requestTypeDerivationSemanticAssessmentIntegrityOperation.validate(assessment, contract),
});
