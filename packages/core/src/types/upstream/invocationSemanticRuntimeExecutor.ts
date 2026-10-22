/** Invocation runtime executor: wiring only; semantic reasoning stays in upstream algebra. */
import type {
  InvocationSemanticAuthorityInterface,
  InvocationSemanticInput,
  InvocationSemanticJudgment,
  InvocationSemanticRuntimeExecutorInterface,
  SemanticInterproceduralDataFlowAuthorityInterface,
} from './invocationSemanticJudgmentInterface';
import type { SemanticKnowledgeDataFlow } from './semanticDataflowKnowledge';
import { invocationSemanticAuthority, semanticInterproceduralDataFlowAuthority } from './invocationSemanticJudgmentAuthority';

export const createInvocationSemanticRuntimeExecutor = (
  authority: InvocationSemanticAuthorityInterface,
  batchAuthority: SemanticInterproceduralDataFlowAuthorityInterface,
): InvocationSemanticRuntimeExecutorInterface => Object.freeze({
  kind: 'invocation_semantic_runtime_executor',
  authority: 'upstream',
  invocationAuthority: authority,
  contract: authority.contract,
  batchAuthority,
  batchContract: batchAuthority.contract,
  delegation: 'execute-to-InvocationSemanticAuthorityInterface.analyze;executeAll-to-SemanticInterproceduralDataFlowAuthorityInterface.analyze',
  execute: (input: InvocationSemanticInput): InvocationSemanticJudgment => authority.analyze(input),
  executeAll: (knowledge: SemanticKnowledgeDataFlow) => batchAuthority.analyze(knowledge),
});

export const invocationSemanticRuntimeExecutor: InvocationSemanticRuntimeExecutorInterface =
  createInvocationSemanticRuntimeExecutor(invocationSemanticAuthority, semanticInterproceduralDataFlowAuthority);
