/**
 * Interface-first runtime executor for RequestType semantic derivation.
 *
 * The executor consumes the upstream closed assessment. It does not inspect
 * routes, resolve request identities, merge actions, or decide resource groups.
 * ADT dispatch here only preserves the authority's already-established result.
 */
import type {
  RequestTypeDerivationContract,
  RequestTypeDerivationJudgmentConsumerInterface,
  RequestTypeDerivationSemanticInferenceFor,
  RequestTypeDerivationSemanticPipelineInterface,
  RequestTypeDerivationSemanticAuthorityAssessment,
  RequestTypeDerivationRuntimeExecutionResult,
  RequestTypeDerivationRuntimeExecutorInterface,
} from '../../../types/upstream/requestTypeDerivationInterface';
import { REQUEST_TYPE_DERIVATION_LAW_IDS } from '../../../types/upstream/requestTypeDerivationInterface';

/** Structural equality is used only to bind the proof to the exact input evidence;
 * it does not classify request semantics or derive a replacement judgment. */
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

const contractFailure = <
  TContract extends RequestTypeDerivationContract,
  TInference extends RequestTypeDerivationSemanticInferenceFor<TContract>,
>(
  pipeline: RequestTypeDerivationSemanticPipelineInterface<TContract, TInference>,
): 'contract_not_closed' | 'contract_law_coverage_incomplete' | undefined => {
  const contract = pipeline.contract;
  if (contract.kind !== 'request_type_derivation_contract'
    || contract.authority !== 'upstream'
    || contract.closed !== true
    || contract.reasoning !== 'declarative_source_relation_closure') return 'contract_not_closed';
  const laws: unknown = contract.laws;
  if (typeof laws !== 'object' || laws === null) return 'contract_law_coverage_incomplete';
  const keys = Object.keys(laws);
  if (keys.length !== REQUEST_TYPE_DERIVATION_LAW_IDS.length
    || !REQUEST_TYPE_DERIVATION_LAW_IDS.every((law) => Object.hasOwn(laws, law) && Reflect.get(laws, law) === 'required')) {
    return 'contract_law_coverage_incomplete';
  }
  return undefined;
};



/**
 * Validate the untrusted runtime envelope before dereferencing nested proof fields.
 * Static TypeScript types do not validate objects crossing plugin, package, or
 * serialized boundaries. This guard checks shape only; semantic coherence remains
 * the responsibility of the pipeline's validateAssessment authority capability.
 */
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isAssessmentEnvelope = (value: unknown): value is RequestTypeDerivationSemanticAuthorityAssessment => {
  if (!isRecord(value) || !isRecord(value.decision)) return false;
  const premises = value.decision.premises;
  if (!isRecord(premises) || !isRecord(premises.input)
    || !Array.isArray(premises.input.routes)
    || !Array.isArray(premises.input.resources)
    || !Array.isArray(premises.input.requests)
    || !isRecord(premises.judgment)
    || !isRecord(premises.verification)
    || !isRecord(premises.coverage)) return false;
  const allowedKinds = [
    'derivation_verified',
    'incompleteness_verified',
    'conflict_verified',
    'input_rejected',
    'verification_failed',
    'rejection_verification_failed',
    'authority_inconsistent',
  ];
  return typeof value.kind === 'string'
    && allowedKinds.includes(value.kind)
    && value.decision.conclusion === value.kind
    && typeof value.decision.ruleId === 'string';
};


export const createRequestTypeDerivationRuntimeExecutor = <
  TProjection,
  TContract extends RequestTypeDerivationContract,
  TInference extends RequestTypeDerivationSemanticInferenceFor<TContract>,
>(
  pipeline: RequestTypeDerivationSemanticPipelineInterface<TContract, TInference>,
  consumer: RequestTypeDerivationJudgmentConsumerInterface<TProjection>,
): RequestTypeDerivationRuntimeExecutorInterface<TProjection, TInference['input']> => Object.freeze({
  authority: 'upstream_request_type_derivation',
  execute: (input: TInference['input']): RequestTypeDerivationRuntimeExecutionResult<TProjection, TInference['input']> => {
    const rawAssessment: unknown = pipeline.derive(input);
    if (!isAssessmentEnvelope(rawAssessment)) {
      return Object.freeze({ kind: 'assessment_shape_invalid', assessment: rawAssessment });
    }
    const assessment = rawAssessment;
    const invalidContract = contractFailure(pipeline);
    if (invalidContract) return Object.freeze({ kind: 'contract_rejected', reason: invalidContract, assessment });
    const proofInput = assessment.decision.premises.input;
    if (!equivalentEvidence(input, proofInput)) {
      return Object.freeze({ kind: 'input_binding_failed', expectedInput: input, proofInput, assessment });
    }
    const integrity = pipeline.validateAssessment(assessment);
    if (integrity.kind === 'assessment_integrity_invalid') {
      return Object.freeze({ kind: 'assessment_integrity_failed', reason: integrity.reason, assessment });
    }
    switch (assessment.kind) {
      case 'derivation_verified':
        return Object.freeze({
          kind: 'projected',
          assessment,
          projection: consumer.project(assessment.decision.premises.judgment),
        });
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
