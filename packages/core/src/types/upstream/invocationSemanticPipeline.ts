/**
 * Canonical interface-first invocation semantic pipeline.
 * This module is wiring only: derivation and validation remain owned by the
 * upstream invocation authorities.
 */
import type {
  InvocationSemanticInput,
  InvocationSemanticJudgment,
  InvocationSemanticAnalysis,
  InvocationSemanticAuthorityInterface,
  SemanticInterproceduralDataFlowAuthorityInterface,
} from './invocationSemanticJudgmentInterface';
import type {
  InvocationPhpSourceIntegratedResponse,
  InvocationSemanticPipelineBatch,
  InvocationSemanticPipelineInterface,
  InvocationSemanticIntegratedResponseCompositionDependencies,
  InvocationSemanticIntegratedResponseCompositionInterface,
  InvocationSemanticIntegratedResponseCompositionInput,
  InvocationSemanticIntegratedResponseCompositionResult,
  InvocationSemanticIntegratedResponse,
} from './invocationSemanticPipelineInterface';
import {
  INVOCATION_SEMANTIC_PIPELINE_CONTRACT,
  INVOCATION_SEMANTIC_INTEGRATED_RESPONSE_COMPOSITION_CONTRACT,
} from './invocationSemanticPipelineInterface';
import { invocationSemanticAuthority, semanticInterproceduralDataFlowAuthority } from './invocationSemanticJudgmentAuthority';
import { invocationSemanticSubjectCoverageInventory } from './invocationSemanticCoverageInventory';
import { invocationSemanticCoveragePublicationAuthority } from './invocationSemanticCoveragePublicationAuthority';

/**
 * Bind pipeline operations directly to the existing upstream authorities.
 * This factory owns wiring only; it introduces no runtime forwarding layer.
 */
export const createInvocationSemanticPipeline = (
  invocationAuthority: InvocationSemanticAuthorityInterface,
  batchAuthority: SemanticInterproceduralDataFlowAuthorityInterface,
): InvocationSemanticPipelineInterface => {
  const analyzeInvocation = (input: InvocationSemanticInput): InvocationSemanticJudgment =>
    invocationAuthority.analyze(input);

  const analyzeBatch = (inputs: readonly InvocationSemanticInput[]): InvocationSemanticPipelineBatch =>
    Object.freeze({
      kind: 'invocation_semantic_pipeline_batch',
      entries: Object.freeze(inputs.map(input => Object.freeze({
        invocation: input.invocation,
        judgment: analyzeInvocation(input),
      }))),
    });

  const analyzeKnowledge = (knowledge: InvocationSemanticInput['knowledge']): InvocationSemanticAnalysis =>
    batchAuthority.analyze(knowledge);

  return Object.freeze({
    kind: 'invocation_semantic_pipeline',
    contract: INVOCATION_SEMANTIC_PIPELINE_CONTRACT,
    invocationAuthority,
    batchAuthority,
    analyzeInvocation,
    analyzeBatch,
    analyzeKnowledge,
  });
};

/** Production composition binds the existing upstream authorities directly. */
export const invocationSemanticPipeline: InvocationSemanticPipelineInterface =
  createInvocationSemanticPipeline(invocationSemanticAuthority, semanticInterproceduralDataFlowAuthority);

export const createInvocationSemanticIntegratedResponseComposition = (
  dependencies: InvocationSemanticIntegratedResponseCompositionDependencies,
): InvocationSemanticIntegratedResponseCompositionInterface => {
  const integrate = (
    input: InvocationSemanticIntegratedResponseCompositionInput,
  ): InvocationSemanticIntegratedResponseCompositionResult => {
    const knowledge = input.semanticKnowledgeProjection.knowledge;
    const inventory = dependencies.inventory.inspectKnowledge(knowledge);
    const analysis = dependencies.pipeline.analyzeKnowledge(knowledge);
    const publication = dependencies.publicationAuthority.publish({ inventory, analysis });
    const response: InvocationSemanticIntegratedResponse = Object.freeze({
      kind: 'invocation_semantic_integrated_response',
      publication,
      phpFunctionInvocations: input.phpSourceInvocationPipeline,
    });
    return Object.freeze({
      kind: 'invocation_semantic_integrated_response_composition_result',
      response,
    });
  };

  const composition: InvocationSemanticIntegratedResponseCompositionInterface = Object.freeze({
    kind: 'invocation_semantic_integrated_response_composition',
    contract: INVOCATION_SEMANTIC_INTEGRATED_RESPONSE_COMPOSITION_CONTRACT,
    integrate,
  });
  return composition;
};

/** Production composition used by the Laravel scanner; all authorities are upstream-owned. */
export const invocationSemanticIntegratedResponseComposition = createInvocationSemanticIntegratedResponseComposition(Object.freeze({
  inventory: invocationSemanticSubjectCoverageInventory,
  pipeline: invocationSemanticPipeline,
  publicationAuthority: invocationSemanticCoveragePublicationAuthority,
}));
