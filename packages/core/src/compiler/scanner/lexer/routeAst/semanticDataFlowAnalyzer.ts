/**
 * Scanner-side projection over the upstream runtime contract. This module has
 * no dependency on the concrete runtime executor; production wiring supplies
 * an implementation of the upstream interface.
 */
import type { SemanticDataflowRuntimeExecutorInterface } from '../../../../types/upstream/semanticDataflowInterface';
import type { SemanticDataFlowFact, SemanticKnowledgeDataFlow, SemanticFlowGuard } from './semanticKnowledgeDataFlowRelations';
import type { SemanticDataflowPath as CanonicalPath } from '../../../../types/upstream/semanticDataflow';
import type { SemanticPredicatePolarity } from '../../../../types/upstream/semanticDataflowKnowledge';
import { knowledgeIdKey, type KnowledgeId } from '../../../../types/upstream/semanticDataflowKnowledge';
import { relationEqual } from '../../../../semantic/relations/semanticRelations';
import {
  semanticDataflowRuntimeRequestFromKnowledge,
} from '../../wiring/semanticDataflowInputAdapter';
import { astSemanticTextTerm } from '../../../../types/upstream/astSemanticInterface';
import { createAnalysisPort, analysisFact } from '../../../../types/upstream/astSemanticStageAuthority';
import type { AstSemanticStagePort } from '../../../../types/upstream/astSemanticStageInterface';

export type SemanticDataFlowPath = Readonly<{
  readonly source: KnowledgeId;
  readonly target: KnowledgeId;
  readonly steps: readonly SemanticDataFlowFact[];
  readonly guards: readonly SemanticFlowGuard[];
}>;
export type SemanticDataFlowAnalysis = Readonly<{
  readonly paths: readonly SemanticDataFlowPath[];
  readonly reachable: readonly KnowledgeId[];
}>;
export type SemanticDataFlowJudgment =
  | Readonly<{
      readonly kind: 'semantic_data_flow_judgment';
      readonly input: 'semantic_knowledge_data_flow';
      readonly evidenceStatus: 'dataflow_facts_present' | 'semantic_knowledge_present_without_dataflow_edges';
      readonly analysis: SemanticDataFlowAnalysis;
      readonly closure: 'least_fixed_point';
      readonly reasoning: 'declarative_relation_rewrite_fixed_point';
      readonly derivation: 'relation_closure_saturation';
      readonly closed: true;
    }>
  | Readonly<{
      /** Compatibility-facing absence result; this is deliberately not a judgment. */
      readonly kind: 'semantic_data_flow_no_evidence';
      readonly input: 'semantic_knowledge_data_flow';
      readonly evidenceStatus: 'no_dataflow_facts';
      readonly analysis: SemanticDataFlowAnalysis;
      readonly semanticStatus: 'not_evaluated';
      readonly protocolClosed: true;
    }>;
const canonicalKey = (identity: CanonicalPath['source']): string =>
  `${identity.source.file.value.value}:${identity.source.start.value}:${identity.source.end.value}:${identity.role}:${identity.slot.value}`;

const knowledgeIndex = (model: SemanticKnowledgeDataFlow): ReadonlyMap<string, KnowledgeId> => new Map(
  model.dataFlow.flatMap(fact => [fact.source, fact.target]).map(id => [knowledgeIdKey(id), id] as const),
);

/** Legacy compatibility projection only; it does not own semantic authority. */
const toLegacyPath = (
  path: CanonicalPath,
  model: SemanticKnowledgeDataFlow,
  index: ReadonlyMap<string, KnowledgeId>,
): SemanticDataFlowPath | undefined => {
  const source = index.get(canonicalKey(path.source));
  const target = index.get(canonicalKey(path.target));
  if (!source || !target) return undefined;
  const steps: SemanticDataFlowFact[] = path.steps.flatMap(step => {
    if (step.kind !== 'dependency' && step.kind !== 'value_flow') return [];
    const stepSource = index.get(canonicalKey(step.source));
    const stepTarget = index.get(canonicalKey(step.target));
    if (!stepSource || !stepTarget) return [];
    const original = model.dataFlow.find(candidate =>
      knowledgeIdKey(candidate.source) === knowledgeIdKey(stepSource)
      && knowledgeIdKey(candidate.target) === knowledgeIdKey(stepTarget)
      && candidate.role.code === step.role,
    );
    return original ? [original] : [];
  });
  const guards = path.guards.flatMap(guard => {
    const predicate = index.get(canonicalKey(guard.predicate));
    return predicate ? [{ predicate, polarity: guard.polarity }] : [];
  });
  return Object.freeze({ source, target, steps: Object.freeze(steps), guards: Object.freeze(guards) });
};

export type SemanticDataFlowAnalyzer = Readonly<{
  readonly analyzeSemanticDataFlowJudgment: (model: SemanticKnowledgeDataFlow) => SemanticDataFlowJudgment;
  readonly analyzeSemanticDataFlow: (model: SemanticKnowledgeDataFlow) => SemanticDataFlowAnalysis;
}>;

/** Interface-first analyzer factory: all execution authority is injected. */
export const createSemanticDataFlowAnalyzer = (
  executor: SemanticDataflowRuntimeExecutorInterface,
): SemanticDataFlowAnalyzer => {
  const analyzeSemanticDataFlowJudgment = (model: SemanticKnowledgeDataFlow): SemanticDataFlowJudgment => {
    const request = semanticDataflowRuntimeRequestFromKnowledge(model);
    const outcome = executor.execute(request);
    if (outcome.kind === 'semantic_dataflow_no_evidence') {
      if (outcome.semanticStatus !== 'not_evaluated' || outcome.protocolClosed !== true) {
        throw new Error('semantic dataflow runtime returned an invalid no-evidence outcome');
      }
      return Object.freeze({
        kind: 'semantic_data_flow_no_evidence',
        input: 'semantic_knowledge_data_flow',
        evidenceStatus: outcome.reason,
        analysis: Object.freeze({ paths: Object.freeze([]), reachable: Object.freeze([]) }),
        semanticStatus: outcome.semanticStatus,
        protocolClosed: true,
      });
    }
    if (outcome.kind !== 'semantic_dataflow_boundary_acceptance') {
      throw new Error(`semantic dataflow boundary rejected judgment: ${outcome.reason}`);
    }
    const canonical = outcome.judgment;
    const index = knowledgeIndex(model);
    const paths = canonical.paths.flatMap(path => {
      const converted = toLegacyPath(path, model, index);
      return converted ? [converted] : [];
    });
    const reachable = [...new Map(paths.map(path => [knowledgeIdKey(path.target), path.target])).values()];
    return Object.freeze({
      kind: 'semantic_data_flow_judgment',
      input: 'semantic_knowledge_data_flow',
      evidenceStatus: model.dataFlow.length > 0 ? 'dataflow_facts_present' : 'semantic_knowledge_present_without_dataflow_edges',
      analysis: Object.freeze({ paths: Object.freeze(paths), reachable: Object.freeze(reachable) }),
      closure: 'least_fixed_point',
      reasoning: 'declarative_relation_rewrite_fixed_point',
      derivation: 'relation_closure_saturation',
      closed: true,
    });
  };
  const analyzeSemanticDataFlow = (model: SemanticKnowledgeDataFlow): SemanticDataFlowAnalysis => analyzeSemanticDataFlowJudgment(model).analysis;
  return Object.freeze({ analyzeSemanticDataFlowJudgment, analyzeSemanticDataFlow });
};

export const pathSatisfiesGuard = (path: SemanticDataFlowPath, predicate: KnowledgeId, polarity: SemanticPredicatePolarity): boolean => path.guards.some(guard => relationEqual(knowledgeIdKey(guard.predicate), knowledgeIdKey(predicate)) && relationEqual(guard.polarity, polarity));
export const semanticDataFlowAnalysisPort = (analysis: SemanticDataFlowAnalysis): AstSemanticStagePort => createAnalysisPort(analysis.paths.map(path => analysisFact('analysis_reaches', astSemanticTextTerm(knowledgeIdKey(path.source)), astSemanticTextTerm(knowledgeIdKey(path.target)))));
