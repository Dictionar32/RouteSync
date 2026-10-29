/** Invocation runtime executor: wiring only; semantic reasoning stays in upstream algebra. */
import type {
  InvocationSemanticAuthorityInterface,
  InvocationSemanticInput,
  InvocationSemanticJudgment,
  InvocationSemanticRuntimeExecutorFactoryInterface,
  InvocationSemanticRuntimeExecutorInterface,
  SemanticInterproceduralDataFlowAuthorityInterface,
} from './invocationSemanticJudgmentInterface';
import type { SemanticKnowledgeDataFlow } from './semanticDataflowKnowledge';
import { invocationSemanticAuthority, semanticInterproceduralDataFlowAuthority } from './invocationSemanticJudgmentAuthority';

/** Explicit construction operation; it preserves the exact authority instances supplied by the composition root. */
export const invocationSemanticRuntimeExecutorFactory: InvocationSemanticRuntimeExecutorFactoryInterface = Object.freeze({
  kind: 'invocation_semantic_runtime_executor_factory',
  create: (
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
  }),
});

/** Production singleton assembled through the same explicit domain factory used by tests and injected runtimes. */
export const invocationSemanticRuntimeExecutor: InvocationSemanticRuntimeExecutorInterface =
  invocationSemanticRuntimeExecutorFactory.create(invocationSemanticAuthority, semanticInterproceduralDataFlowAuthority);
