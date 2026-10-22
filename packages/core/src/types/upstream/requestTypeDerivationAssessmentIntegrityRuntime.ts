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
} from './requestTypeDerivationInterface';

const equivalentEvidence = (left: unknown, right: unknown): boolean => {
  if (Object.is(left, right)) return true;
  if (Array.isArray(left) || Array.isArray(right)) {
    return Array.isArray(left) && Array.isArray(right)
      && left.length === right.length
      && left.every((item, index) => equivalentEvidence(item, right[index]));
  }
  if (typeof left !== 'object' || left === null || typeof right !== 'object' || right === null) return false;
  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);
  return leftKeys.length === rightKeys.length && leftKeys.every((key) => (
    Object.hasOwn(right, key) && equivalentEvidence(Reflect.get(left, key), Reflect.get(right, key))
  ));
};

/**
 * Runtime integrity check for the authority's correlated proof algebra.
 * This validates that the returned proof is internally coherent; it does not
 * derive request meaning or repair a malformed judgment.
 */
export const validateRequestTypeDerivationSemanticAssessment = (
  assessment: RequestTypeDerivationSemanticAuthorityAssessment,
  contract: RequestTypeDerivationContract,
): RequestTypeDerivationSemanticAssessmentIntegrityResult => {
  const decision = assessment.decision;
  if (decision.conclusion !== assessment.kind) return { kind: 'assessment_integrity_invalid', reason: 'assessment_conclusion_mismatch' };

  switch (assessment.kind) {
    case 'derivation_verified':
      if (decision.ruleId !== 'closed_derivation_with_complete_verification') return { kind: 'assessment_integrity_invalid', reason: 'decision_rule_mismatch' };
      if (decision.premises.judgment.kind !== 'derived') return { kind: 'assessment_integrity_invalid', reason: 'judgment_kind_mismatch' };
      if (decision.premises.verification.kind !== 'valid') return { kind: 'assessment_integrity_invalid', reason: 'verification_kind_mismatch' };
      if (decision.premises.coverage.kind !== 'complete') return { kind: 'assessment_integrity_invalid', reason: 'coverage_not_complete' };
      if (!equivalentEvidence(decision.premises.coverage.contract, contract)) return { kind: 'assessment_integrity_invalid', reason: 'coverage_contract_mismatch' };
      return { kind: 'assessment_integrity_valid' };
    case 'incompleteness_verified':
      if (decision.ruleId !== 'incomplete_derivation_with_complete_verification') return { kind: 'assessment_integrity_invalid', reason: 'decision_rule_mismatch' };
      if (decision.premises.judgment.kind !== 'incomplete') return { kind: 'assessment_integrity_invalid', reason: 'judgment_kind_mismatch' };
      if (decision.premises.verification.kind !== 'valid') return { kind: 'assessment_integrity_invalid', reason: 'verification_kind_mismatch' };
      if (decision.premises.coverage.kind !== 'complete') return { kind: 'assessment_integrity_invalid', reason: 'coverage_not_complete' };
      if (!equivalentEvidence(decision.premises.coverage.contract, contract)) return { kind: 'assessment_integrity_invalid', reason: 'coverage_contract_mismatch' };
      return { kind: 'assessment_integrity_valid' };
    case 'conflict_verified':
      if (decision.ruleId !== 'conflicted_derivation_with_complete_verification') return { kind: 'assessment_integrity_invalid', reason: 'decision_rule_mismatch' };
      if (decision.premises.judgment.kind !== 'conflict') return { kind: 'assessment_integrity_invalid', reason: 'judgment_kind_mismatch' };
      if (decision.premises.verification.kind !== 'valid') return { kind: 'assessment_integrity_invalid', reason: 'verification_kind_mismatch' };
      if (decision.premises.coverage.kind !== 'complete') return { kind: 'assessment_integrity_invalid', reason: 'coverage_not_complete' };
      if (!equivalentEvidence(decision.premises.coverage.contract, contract)) return { kind: 'assessment_integrity_invalid', reason: 'coverage_contract_mismatch' };
      return { kind: 'assessment_integrity_valid' };
    case 'input_rejected':
      if (decision.ruleId !== 'invalid_input_with_matching_rejection_witness') return { kind: 'assessment_integrity_invalid', reason: 'decision_rule_mismatch' };
      if (decision.premises.judgment.kind !== 'invalid_input') return { kind: 'assessment_integrity_invalid', reason: 'judgment_kind_mismatch' };
      if (decision.premises.verification.kind !== 'rejection_confirmed') return { kind: 'assessment_integrity_invalid', reason: 'verification_kind_mismatch' };
      return { kind: 'assessment_integrity_valid' };
    case 'verification_failed':
      if (decision.ruleId !== 'non_invalid_judgment_with_counterexample') return { kind: 'assessment_integrity_invalid', reason: 'decision_rule_mismatch' };
      if (decision.premises.judgment.kind === 'invalid_input') return { kind: 'assessment_integrity_invalid', reason: 'judgment_kind_mismatch' };
      if (decision.premises.verification.kind !== 'invalid') return { kind: 'assessment_integrity_invalid', reason: 'verification_kind_mismatch' };
      return { kind: 'assessment_integrity_valid' };
    case 'rejection_verification_failed':
      if (decision.ruleId !== 'invalid_input_with_rejection_counterexample') return { kind: 'assessment_integrity_invalid', reason: 'decision_rule_mismatch' };
      if (decision.premises.judgment.kind !== 'invalid_input') return { kind: 'assessment_integrity_invalid', reason: 'judgment_kind_mismatch' };
      if (decision.premises.verification.kind !== 'invalid') return { kind: 'assessment_integrity_invalid', reason: 'verification_kind_mismatch' };
      return { kind: 'assessment_integrity_valid' };
    case 'authority_inconsistent': {
      const ruleReason: Readonly<Record<string, string>> = {
        judgment_verification_kind_conflict: 'judgment_verification_kind_mismatch',
        rejection_reason_conflict: 'rejection_reason_mismatch',
        rejection_evidence_conflict: 'rejection_witness_mismatch',
        contract_law_coverage_incomplete: 'contract_law_coverage_incomplete',
        verified_law_coverage_incomplete: 'verified_law_coverage_incomplete',
      };
      if (Reflect.get(ruleReason, decision.ruleId) !== decision.reason) return { kind: 'assessment_integrity_invalid', reason: 'authority_reason_mismatch' };
      return { kind: 'assessment_integrity_valid' };
    }
    default: {
      const exhaustive: never = assessment;
      return exhaustive;
    }
  }
};


/** Bind the validator to the exact policy value exposed by a semantic pipeline. */
export const createRequestTypeDerivationSemanticAssessmentValidator = (
  contract: RequestTypeDerivationContract,
): ((assessment: RequestTypeDerivationSemanticAuthorityAssessment) => RequestTypeDerivationSemanticAssessmentIntegrityResult) => (
  assessment: RequestTypeDerivationSemanticAuthorityAssessment,
): RequestTypeDerivationSemanticAssessmentIntegrityResult => validateRequestTypeDerivationSemanticAssessment(assessment, contract);
