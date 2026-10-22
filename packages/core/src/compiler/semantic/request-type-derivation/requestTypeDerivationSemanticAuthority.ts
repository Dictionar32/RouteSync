/**
 * Source-bound authority adjudicator for closed semantic decision proofs.
 * It accepts no loose judgment/verification tuple and never re-runs reasoning.
 */
import {
  REQUEST_TYPE_AUTHORITY_DECISION_RULE_IDS,
  type RequestTypeDerivationContract,
  type RequestTypeDerivationSemanticAuthorityInterface,
  type RequestTypeDerivationSemanticAuthorityCandidateFor,
  type RequestTypeDerivationSemanticAuthorityAssessmentFor,
  type RequestTypeDerivationSemanticInferenceFor,
  type RequestTypeAuthorityDecisionRuleCoverage,
} from '../../../types/upstream/requestTypeDerivationInterface';
import { validateRequestTypeDerivationSemanticAssessment } from './requestTypeDerivationAssessmentIntegrity';

const decisionRules = Object.freeze(Object.fromEntries(
  REQUEST_TYPE_AUTHORITY_DECISION_RULE_IDS.map(ruleId => [ruleId, 'required']),
)) as RequestTypeAuthorityDecisionRuleCoverage;

export const createRequestTypeDerivationSemanticAuthority = <
  TContract extends RequestTypeDerivationContract,
  TInference extends RequestTypeDerivationSemanticInferenceFor<TContract>,
>(contract: TContract): RequestTypeDerivationSemanticAuthorityInterface<TContract, TInference> => Object.freeze({
  contract,
  decisionRules,
  evaluate: (
    input: TInference['input'],
    candidate: RequestTypeDerivationSemanticAuthorityCandidateFor<TContract, TInference>,
  ): RequestTypeDerivationSemanticAuthorityAssessmentFor<TContract, TInference> => {
    const { proof } = candidate;
    if (candidate.contract !== contract || proof.verificationBinding.contract !== contract
      || proof.premises.input !== input || proof.verificationBinding.inference.input !== input
      || proof.premises.judgment !== proof.verificationBinding.inference.judgment) {
      // Candidate input/contract/judgment violations cannot be authorized.
      throw new TypeError('Authority rejected a decision proof detached from its source invocation.');
    }

    const assessment = Object.freeze({ kind: proof.conclusion, decision: proof }) as RequestTypeDerivationSemanticAuthorityAssessmentFor<TContract, TInference>;
    const coherence = validateRequestTypeDerivationSemanticAssessment(
      assessment as never,
      contract,
    );
    if (coherence.kind !== 'assessment_integrity_valid') {
      throw new TypeError('Authority rejected an internally inconsistent decision proof.');
    }
    return assessment;
  },
});
