/** Compatibility facade. Scanner callers delegate to the canonical upstream invocation judgment. */
export type {
  InvocationSemanticAnalysis,
  InvocationSemanticAuthorityInterface,
  InvocationSemanticInput,
  InvocationSemanticContract,
  InvocationSemanticDerivationModel,
  InvocationSemanticExecutionRule,
  InvocationSemanticMeaningModel,
  InvocationSemanticModel,
  InvocationSemanticJudgment,
  InvocationSemanticProof,
  InvocationSemanticRule,
  InvocationSemanticRuleId,
  InvocationSemanticRuleTraceEntry,
  InvocationSemanticDerivationWitness,
  InvocationSemanticDerivationWitnesses,
  SemanticInvocationSemanticContract,
  SemanticArgumentParameterFlow,
  SemanticCallEmissionFlow,
  SemanticCallTarget,
  SemanticInvocationObligation,
} from '../../../../types/upstream/invocationSemanticJudgmentInterface';
export {
  INVOCATION_SEMANTIC_CONTRACT,
  INVOCATION_SEMANTIC_MEANING,
  INVOCATION_SEMANTIC_MODEL,
  INVOCATION_SEMANTIC_RULES,
  INVOCATION_EVIDENCE_PRESENCE_RULE,
  INVOCATION_TARGET_RESOLUTION_RULE,
  INVOCATION_TARGET_AMBIGUITY_RULE,
  INVOCATION_ARGUMENT_BINDING_RULE,
  INVOCATION_RESULT_EMISSION_RULE,
  INVOCATION_EXCEPTION_EMISSION_RULE,
  INVOCATION_UNRESOLVED_TARGET_RULE,
  INVOCATION_JUDGMENT_CLOSURE_RULE,
} from '../../../../types/upstream/invocationSemanticJudgmentInterface';
export {
  analyzeInvocationSemantics,
  analyzeAllInvocationSemantics,
  invocationSemanticAuthority,
  analyzeSemanticInterproceduralDataFlow,
  callTargetFor,
  parameterFlowsFor,
  semanticInterproceduralDataFlowAuthority,
} from '../../../../types/upstream/invocationSemanticJudgmentAuthority';

/** Scanner-facing runtime boundary; delegates one invocation to upstream semantic authority. */
export { invocationSemanticRuntimeExecutor } from '../../../../types/upstream/invocationSemanticRuntimeExecutor';
export type { InvocationSemanticRuntimeExecutorInterface } from '../../../../types/upstream/invocationSemanticJudgmentInterface';
