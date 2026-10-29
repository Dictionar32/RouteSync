/**
 * Upstream preparation of a closed RequestType derivation outcome.
 *
 * RequestType derivation is compiler-time semantic work, not a runtime action.
 * This boundary owns input binding, authority assessment, integrity validation,
 * and judgment projection. The returned outcome also owns a concrete operation
 * for continuing toward manifest projection; consumers do not reclassify every
 * semantic authority variant themselves.
 */
import type {
  RequestTypeDerivationBlockedRuntimeExecutionData,
  RequestTypeDerivationJudgmentConsumerInterface,
  RequestTypeDerivationOperationPreparationInterface,
  RequestTypeDerivationProjectableRuntimeExecutionData,
  RequestTypeDerivationRuntimeExecutionResult,
  RequestTypeDerivationSemanticPipelineInterface,
  RequestTypeDerivationSemanticInputPreparation,
} from '../../../types/upstream/requestTypeDerivationInterface';

/**
 * The upstream result variants install their own continuation. This factory is
 * deliberately concrete: it has no generic return parameter and does not add a
 * cross-domain visitor or reasoning primitive.
 */
const requestTypeDerivationRuntimeExecutionResultOperations = Object.freeze({
  projected: (
    assessment: RequestTypeDerivationProjectableRuntimeExecutionData['assessment'],
    projection: RequestTypeDerivationProjectableRuntimeExecutionData['projection'],
  ): RequestTypeDerivationRuntimeExecutionResult => {
    const outcome: RequestTypeDerivationProjectableRuntimeExecutionData = Object.freeze({
      kind: 'projected',
      assessment,
      projection,
    });
    return Object.freeze({
      ...outcome,
      toManifestProjectionDisposition: () => Object.freeze({
        kind: 'request_type_derivation_projectable' as const,
        derivation: outcome,
      }),
    });
  },
  notProjectable: (
    outcome: RequestTypeDerivationBlockedRuntimeExecutionData,
  ): RequestTypeDerivationRuntimeExecutionResult => Object.freeze({
    ...outcome,
    toManifestProjectionDisposition: () => Object.freeze({
      kind: 'request_type_derivation_not_projectable' as const,
      derivation: outcome,
    }),
  }),
});

/**
 * Bind one source input to the semantic authority and return its closed outcome.
 * Contract construction, source-bound reasoning, integrity checks, and
 * projection remain upstream of downstream artifact generation.
 */
export interface RequestTypeDerivationOperationPreparationFactoryInterface {
  readonly create: (
    pipeline: RequestTypeDerivationSemanticPipelineInterface,
    consumer: RequestTypeDerivationJudgmentConsumerInterface,
  ) => RequestTypeDerivationOperationPreparationInterface;
}

export const requestTypeDerivationOperationPreparationFactory: RequestTypeDerivationOperationPreparationFactoryInterface = Object.freeze({
  create: (
    pipeline: RequestTypeDerivationSemanticPipelineInterface,
    consumer: RequestTypeDerivationJudgmentConsumerInterface,
  ): RequestTypeDerivationOperationPreparationInterface => Object.freeze({
    prepare: (input: RequestTypeDerivationSemanticInputPreparation): RequestTypeDerivationRuntimeExecutionResult => {
      const derivation = pipeline.derive(input);
      if (derivation.kind === 'integrity_rejected') {
        return requestTypeDerivationRuntimeExecutionResultOperations.notProjectable({
          kind: 'authority_integrity_failed',
          integrity: derivation.integrity,
        });
      }
      const assessment = derivation;
      const integrity = pipeline.validateAssessment(assessment);

      if (integrity.kind === 'assessment_integrity_invalid') {
        return requestTypeDerivationRuntimeExecutionResultOperations.notProjectable({
          kind: 'assessment_integrity_failed',
          reason: integrity.reason,
          assessment,
        });
      }

      switch (assessment.kind) {
        case 'derivation_verified': {
          const judgment = assessment.decision.premises.judgment;
          if (judgment.kind !== 'derived') {
            return requestTypeDerivationRuntimeExecutionResultOperations.notProjectable({
              kind: 'assessment_integrity_failed',
              reason: 'judgment_kind_mismatch',
              assessment,
            });
          }
          return requestTypeDerivationRuntimeExecutionResultOperations.projected(
            assessment,
            consumer.project(judgment),
          );
        }
        case 'incompleteness_verified':
          return requestTypeDerivationRuntimeExecutionResultOperations.notProjectable({ kind: 'incomplete', assessment });
        case 'conflict_verified':
          return requestTypeDerivationRuntimeExecutionResultOperations.notProjectable({ kind: 'conflict', assessment });
        case 'input_rejected':
          return requestTypeDerivationRuntimeExecutionResultOperations.notProjectable({ kind: 'input_rejected', assessment });
        case 'verification_failed':
          return requestTypeDerivationRuntimeExecutionResultOperations.notProjectable({ kind: 'verification_failed', assessment });
        case 'rejection_verification_failed':
          return requestTypeDerivationRuntimeExecutionResultOperations.notProjectable({ kind: 'rejection_verification_failed', assessment });
        case 'authority_inconsistent':
          return requestTypeDerivationRuntimeExecutionResultOperations.notProjectable({ kind: 'authority_inconsistent', assessment });
        default: {
          const exhaustive: never = assessment;
          return exhaustive;
        }
      }
    },
  }),
});
