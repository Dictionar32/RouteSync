/**
 * Upstream preparation of a closed RequestType derivation outcome.
 *
 * RequestType derivation is compiler-time semantic work, not a runtime action.
 * This boundary owns input binding, authority assessment, integrity validation,
 * and judgment projection. It returns the closed outcome directly instead of
 * wrapping it in an executor that accepts an operation only to return its result.
 */
import type {
  RequestTypeDerivationJudgmentConsumerInterface,
  RequestTypeDerivationOperationPreparationInterface,
  RequestTypeDerivationRuntimeExecutionResult,
  RequestTypeDerivationSemanticPipelineInterface,
  RequestTypeDerivationSemanticInputPreparation,
} from '../../../types/upstream/requestTypeDerivationInterface';

/**
 * Bind one source input to the semantic authority and return its closed outcome.
 * Contract construction, source-bound reasoning, integrity checks, and projection
 * all remain upstream of any downstream artifact generation.
 */
export const createRequestTypeDerivationOperationPreparation = (
  pipeline: RequestTypeDerivationSemanticPipelineInterface,
  consumer: RequestTypeDerivationJudgmentConsumerInterface,
): RequestTypeDerivationOperationPreparationInterface => Object.freeze({
  prepare: (input: RequestTypeDerivationSemanticInputPreparation): RequestTypeDerivationRuntimeExecutionResult => {
    const derivation = pipeline.derive(input);
    if (derivation.kind === 'integrity_rejected') {
      return Object.freeze({ kind: 'authority_integrity_failed', integrity: derivation.integrity });
    }
    const assessment = derivation;
    const integrity = pipeline.validateAssessment(assessment);

    if (integrity.kind === 'assessment_integrity_invalid') {
      return Object.freeze({
        kind: 'assessment_integrity_failed',
        reason: integrity.reason,
        assessment,
      });
    }

    switch (assessment.kind) {
      case 'derivation_verified': {
        const judgment = assessment.decision.premises.judgment;
        if (judgment.kind !== 'derived') {
          return Object.freeze({
            kind: 'assessment_integrity_failed',
            reason: 'judgment_kind_mismatch',
            assessment,
          });
        }
        return Object.freeze({
          kind: 'projected',
          assessment,
          projection: consumer.project(judgment),
        });
      }
      case 'incompleteness_verified':
        return Object.freeze({ kind: 'incomplete', assessment });
      case 'conflict_verified':
        return Object.freeze({ kind: 'conflict', assessment });
      case 'input_rejected':
        return Object.freeze({ kind: 'input_rejected', assessment });
      case 'verification_failed':
        return Object.freeze({ kind: 'verification_failed', assessment });
      case 'rejection_verification_failed':
        return Object.freeze({ kind: 'rejection_verification_failed', assessment });
      case 'authority_inconsistent':
        return Object.freeze({ kind: 'authority_inconsistent', assessment });
      default: {
        const exhaustive: never = assessment;
        return exhaustive;
      }
    }
  },
});
