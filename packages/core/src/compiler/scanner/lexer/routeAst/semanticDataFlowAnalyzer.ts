/**
 * @deprecated Compatibility facade.
 *
 * Semantic dataflow authority now lives in types/upstream. This module adapts
 * the historical scanner vocabulary for old tests/consumers only; it owns no
 * closure, path solver, or guard semantics.
 */
import { relationEqual } from '../../../../semantic/foundation/semanticRelations';
import { semanticPresenceFold, type KnowledgeId, type SemanticDataFlowFact, type SemanticFlowGuard, type SemanticKnowledgeDataFlow, type SemanticPredicatePolarity, knowledgeIdKey } from './semanticKnowledgeDataFlowRelations';
import { createSemanticDataflowInput } from '../../wiring/semanticDataflowInputAdapter';
import { createSemanticDataflowJudgment } from '../../../../types/upstream/semanticDataflowAuthority';
import type { SemanticDataflowPath as CanonicalPath } from '../../../../types/upstream/semanticDataflow';
import { astSemanticTextTerm } from '../../../../types/upstream/astSemanticInterface';
import { createAnalysisPort, analysisFact, type AstSemanticStagePort } from '../../../../types/upstream/astSemanticStageInterface';

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
export type SemanticDataFlowJudgment = Readonly<{
  readonly kind: 'semantic_data_flow_judgment';
  readonly input: 'semantic_knowledge_data_flow';
  readonly analysis: SemanticDataFlowAnalysis;
  readonly closure: 'least_fixed_point';
  readonly reasoning: 'declarative_relation_rewrite_fixed_point';
  readonly derivation: 'relation_closure_saturation';
  readonly closed: true;
}>;
const canonicalKey = (identity: CanonicalPath['source']): string =>
  `${identity.source.file.value.value}:${identity.source.start.value}:${identity.source.end.value}:${identity.role}:${identity.slot.value}`;

const knowledgeIndex = (model: SemanticKnowledgeDataFlow): ReadonlyMap<string, KnowledgeId> => new Map(
  model.dataFlow.flatMap(fact => [fact.source, fact.target]).map(id => [knowledgeIdKey(id), id] as const),
);

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

export const analyzeSemanticDataFlowJudgment = (model: SemanticKnowledgeDataFlow): SemanticDataFlowJudgment => {
  const first = model.dataFlow[0]?.source;
  if (!first) {
    return Object.freeze({ kind: 'semantic_data_flow_judgment', input: 'semantic_knowledge_data_flow', analysis: Object.freeze({ paths: Object.freeze([]), reachable: Object.freeze([]) }), closure: 'least_fixed_point', reasoning: 'declarative_relation_rewrite_fixed_point', derivation: 'relation_closure_saturation', closed: true });
  }
  const input = createSemanticDataflowInput(
    Object.freeze({
      kind: 'semantic_dataflow_identity',
      source: Object.freeze({ kind: 'source_span', file: Object.freeze({ kind: 'source_file', value: Object.freeze({ kind: 'string_value', value: first.identity.source.filePath.value }) }), start: Object.freeze({ kind: 'number_value', value: first.identity.source.span.start.value }), end: Object.freeze({ kind: 'number_value', value: first.identity.source.span.end.value }) }),
      role: 'scope',
      slot: Object.freeze({ kind: 'string_value', value: 'semantic-knowledge' }),
    }),
    Object.freeze({ kind: 'source_span', file: Object.freeze({ kind: 'source_file', value: Object.freeze({ kind: 'string_value', value: first.identity.source.filePath.value }) }), start: Object.freeze({ kind: 'number_value', value: first.identity.source.span.start.value }), end: Object.freeze({ kind: 'number_value', value: first.identity.source.span.end.value }) }),
    model,
    'route',
  );
  const canonical = createSemanticDataflowJudgment(input);
  const index = knowledgeIndex(model);
  const paths = canonical.paths.flatMap(path => {
    const converted = toLegacyPath(path, model, index);
    return converted ? [converted] : [];
  });
  const reachable = [...new Map(paths.map(path => [knowledgeIdKey(path.target), path.target])).values()];
  return Object.freeze({ kind: 'semantic_data_flow_judgment', input: 'semantic_knowledge_data_flow', analysis: Object.freeze({ paths: Object.freeze(paths), reachable: Object.freeze(reachable) }), closure: 'least_fixed_point', reasoning: 'declarative_relation_rewrite_fixed_point', derivation: 'relation_closure_saturation', closed: true });
};

export const analyzeSemanticDataFlow = (model: SemanticKnowledgeDataFlow): SemanticDataFlowAnalysis => analyzeSemanticDataFlowJudgment(model).analysis;
export const pathSatisfiesGuard = (path: SemanticDataFlowPath, predicate: KnowledgeId, polarity: SemanticPredicatePolarity): boolean => path.guards.some(guard => relationEqual(knowledgeIdKey(guard.predicate), knowledgeIdKey(predicate)) && relationEqual(guard.polarity, polarity));
export const semanticDataFlowAnalysisPort = (analysis: SemanticDataFlowAnalysis): AstSemanticStagePort => createAnalysisPort(analysis.paths.map(path => analysisFact('analysis_reaches', astSemanticTextTerm(knowledgeIdKey(path.source)), astSemanticTextTerm(knowledgeIdKey(path.target)))));
