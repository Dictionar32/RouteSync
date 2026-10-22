/**
 * Closed decision-proof constructor for the semantic pipeline.
 * This layer correlates already-produced inference, verification and coverage;
 * it never derives or repairs a judgment and never upgrades partial verification.
 */
import type {
  RequestTypeDerivationContract,
  RequestTypeDerivationSemanticDecisionInterface,
  RequestTypeDerivationSemanticDecisionPremises,
  RequestTypeDerivationSemanticInferenceFor,
  RequestTypeDerivationSemanticAuthorityCandidateFor,
  RequestTypeDerivationSemanticAuthorityProofFor,
  RequestTypeAuthorityDecisionProof,
} from '../../../types/upstream/requestTypeDerivationInterface';

export const createRequestTypeDerivationSemanticDecision = <
  TContract extends RequestTypeDerivationContract,
  TInference extends RequestTypeDerivationSemanticInferenceFor<TContract>,
>(contract: TContract): RequestTypeDerivationSemanticDecisionInterface<TContract, TInference> => Object.freeze({
  contract,
  decide: (premises: RequestTypeDerivationSemanticDecisionPremises<TContract, TInference>): RequestTypeDerivationSemanticAuthorityCandidateFor<TContract, TInference> => {
    // Identity checks belong to the integrity gate; reject a detached packet here
    // as defense in depth rather than constructing a proof over mixed invocations.
    if (premises.contract !== contract || premises.inference.contract !== contract
      || premises.verification.contract !== contract
      || premises.verification.inference !== premises.inference) {
      throw new TypeError('Semantic decision premises do not share the canonical contract and inference packet.');
    }

    const { input, judgment } = premises.inference;
    const verification = premises.verification.result;
    const coverage = premises.coverage;
    let proof: RequestTypeAuthorityDecisionProof;

    if (coverage.kind === 'contract_incomplete') {
      proof = Object.freeze({ ruleId: 'contract_law_coverage_incomplete', premises: Object.freeze({ input, judgment, verification, coverage }), conclusion: 'authority_inconsistent', reason: 'contract_law_coverage_incomplete' });
    } else if (coverage.kind === 'verification_incomplete') {
      proof = Object.freeze({ ruleId: 'verified_law_coverage_incomplete', premises: Object.freeze({ input, judgment, verification, coverage }), conclusion: 'authority_inconsistent', reason: 'verified_law_coverage_incomplete' });
    } else if (judgment.kind === 'invalid_input') {
      if (verification.kind === 'rejection_confirmed') {
        if (verification.reason !== judgment.reason) {
          proof = Object.freeze({ ruleId: 'rejection_reason_conflict', premises: Object.freeze({ input, judgment, verification, coverage, expectedReason: judgment.reason, actualReason: verification.reason }), conclusion: 'authority_inconsistent', reason: 'rejection_reason_mismatch' });
        } else if (!equivalentEvidenceValues(verification.evidence, judgment.evidence)) {
          proof = Object.freeze({ ruleId: 'rejection_evidence_conflict', premises: Object.freeze({ input, judgment, verification, coverage, evidenceRelation: 'not_equivalent' }), conclusion: 'authority_inconsistent', reason: 'rejection_witness_mismatch' });
        } else {
          proof = Object.freeze({ ruleId: 'invalid_input_with_matching_rejection_witness', premises: Object.freeze({ input, judgment, verification, coverage }), conclusion: 'input_rejected' });
        }
      } else if (verification.kind === 'invalid') {
        proof = Object.freeze({ ruleId: 'invalid_input_with_rejection_counterexample', premises: Object.freeze({ input, judgment, verification, coverage }), conclusion: 'rejection_verification_failed' });
      } else {
        proof = Object.freeze({ ruleId: 'judgment_verification_kind_conflict', premises: Object.freeze({ input, judgment, verification, coverage, mismatch: 'judgment_verification_kind_mismatch' }), conclusion: 'authority_inconsistent', reason: 'judgment_verification_kind_mismatch' });
      }
    } else if (verification.kind === 'valid') {
      switch (judgment.kind) {
        case 'derived': proof = Object.freeze({ ruleId: 'closed_derivation_with_complete_verification', premises: Object.freeze({ input, judgment, verification, coverage }), conclusion: 'derivation_verified' }); break;
        case 'incomplete': proof = Object.freeze({ ruleId: 'incomplete_derivation_with_complete_verification', premises: Object.freeze({ input, judgment, verification, coverage }), conclusion: 'incompleteness_verified' }); break;
        case 'conflict': proof = Object.freeze({ ruleId: 'conflicted_derivation_with_complete_verification', premises: Object.freeze({ input, judgment, verification, coverage }), conclusion: 'conflict_verified' }); break;
        case 'invalid_input': { const exhaustive: never = judgment; throw new TypeError(`Unreachable judgment variant: ${String(exhaustive)}`); }
        default: { const exhaustive: never = judgment; throw new TypeError(`Unknown judgment variant: ${String(exhaustive)}`); }
      }
    } else if (verification.kind === 'invalid') {
      proof = Object.freeze({ ruleId: 'non_invalid_judgment_with_counterexample', premises: Object.freeze({ input, judgment, verification, coverage }), conclusion: 'verification_failed' });
    } else {
      proof = Object.freeze({ ruleId: 'judgment_verification_kind_conflict', premises: Object.freeze({ input, judgment, verification, coverage, mismatch: 'judgment_verification_kind_mismatch' }), conclusion: 'authority_inconsistent', reason: 'judgment_verification_kind_mismatch' });
    }

    const boundProof = Object.freeze({
      ...proof,
      verificationBinding: Object.freeze({ contract, inference: premises.inference }),
    }) as RequestTypeDerivationSemanticAuthorityProofFor<TContract, TInference>;
    return Object.freeze({ contract, proof: boundProof });
  },
});

const equivalentEvidenceValues = (left: unknown, right: unknown): boolean => {
  if (Object.is(left, right)) return true;
  if (Array.isArray(left) || Array.isArray(right)) return Array.isArray(left) && Array.isArray(right)
    && left.length === right.length && left.every((item, index) => equivalentEvidenceValues(item, right[index]));
  if (typeof left !== 'object' || left === null || typeof right !== 'object' || right === null) return false;
  const leftKeys = Object.keys(left); const rightKeys = Object.keys(right);
  return leftKeys.length === rightKeys.length && leftKeys.every(key => Object.hasOwn(right, key)
    && equivalentEvidenceValues(Reflect.get(left, key), Reflect.get(right, key)));
};
