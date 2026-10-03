import { relationResolve } from '../../../relational/sequence';
import { astSemanticStageInterfaceOf, type AstSemanticStageInterface } from '../../../../types/upstream/astSemanticStageInterfaceAlgebra';
import { relationAll, relationAny, relationEqual } from '../../../../semantic/kernel/semanticRelations';
import { relationFold } from '../../../../semantic/kernel/relationalSequence';
import type { KnowledgeId, SemanticDataFlowFact, SemanticFlowGuard, SemanticKnowledgeDataFlow, SemanticPredicatePolarity, } from './semanticKnowledgeDataFlowRelations';
import { knowledgeIdKey } from './semanticKnowledgeDataFlowRelations';
import { relationContains, relationInsert, type RelationMembership } from '../../../../semantic/kernel/relationMembership';
import { typedDistinct, typedExpand, typedProject, typedRelation, typedSelect } from './semanticTypedRelation';
import { astSemanticTextTerm } from '../../../../types/upstream/astSemanticInterface';
import { createAnalysisPort, analysisFact, type AstSemanticStagePort } from '../../../../types/upstream/astSemanticStageInterface';
/** A derived path through canonical semantic value/dependency facts. */
export interface SemanticDataFlowPath {
    readonly source: KnowledgeId;
    readonly target: KnowledgeId;
    readonly steps: readonly SemanticDataFlowFact[];
    readonly guards: readonly SemanticFlowGuard[];
}
export interface SemanticDataFlowAnalysis {
    readonly paths: readonly SemanticDataFlowPath[];
    readonly reachable: readonly KnowledgeId[];
}

export interface SemanticDataFlowJudgment {
    readonly kind: 'semantic_data_flow_judgment';
    readonly input: 'semantic_knowledge_data_flow';
    readonly analysis: SemanticDataFlowAnalysis;
    readonly closure: 'least_fixed_point';
    readonly reasoning: 'declarative_relation_rewrite_fixed_point';
    readonly derivation: 'relation_closure_saturation';
    readonly closed: true;
}
const sameId = (left: KnowledgeId, right: KnowledgeId): boolean => relationEqual(knowledgeIdKey(left), knowledgeIdKey(right));
const appendGuard = (guards: readonly SemanticFlowGuard[], guard: SemanticDataFlowFact['guard']): readonly SemanticFlowGuard[] => relationResolve(relationEqual(guard.kind, 'present'), () => [...guards, guard.value], () => guards);
const sameGuard = (left: SemanticFlowGuard, right: SemanticFlowGuard): boolean => relationAll([relationEqual(knowledgeIdKey(left.predicate), knowledgeIdKey(right.predicate)), relationEqual(left.polarity, right.polarity)]);
const guardKey = (guard: SemanticFlowGuard): string => `${knowledgeIdKey(guard.predicate)}:${guard.polarity}`;
const pathKey = (path: SemanticDataFlowPath): string => `${knowledgeIdKey(path.source)}>${knowledgeIdKey(path.target)}|${[...typedProject(typedRelation(path.guards), guardKey).tuples].sort().join(',')}`;
const outgoing = (facts: readonly SemanticDataFlowFact[], source: KnowledgeId): readonly SemanticDataFlowFact[] => typedSelect(typedRelation(facts), fact => sameId(fact.source, source)).tuples;
const extendPath = (path: SemanticDataFlowPath, next: SemanticDataFlowFact): SemanticDataFlowPath => ({
    source: path.source,
    target: next.target,
    steps: [...path.steps, next],
    guards: [...path.guards, ...appendGuard([], next.guard)],
});
const acyclic = (path: SemanticDataFlowPath, next: SemanticDataFlowFact): boolean => relationEqual(typedSelect(typedRelation(path.steps), step => relationAny([sameId(step.source, next.target), sameId(step.target, next.target)])).tuples.length, 0);
const expandPaths = (facts: readonly SemanticDataFlowFact[], frontier: readonly SemanticDataFlowPath[]): readonly SemanticDataFlowPath[] => typedExpand(typedRelation(frontier), path => typedExpand(typedSelect(typedRelation(outgoing(facts, path.target)), next => acyclic(path, next)), next => typedRelation([extendPath(path, next)]))).tuples;
const closure = (facts: readonly SemanticDataFlowFact[], paths: readonly SemanticDataFlowPath[], seen: RelationMembership<string>): readonly SemanticDataFlowPath[] => {
    const next = typedDistinct(typedRelation(expandPaths(facts, paths)), pathKey);
    const fresh = typedSelect(next, path => relationEqual(relationContains(seen, pathKey(path)), false)).tuples;
    return relationResolve(relationEqual(fresh.length, 0), () => paths, () => closure(facts, fresh, relationFold(typedProject(typedRelation(fresh), pathKey).tuples, seen, (current, key) => relationInsert(current, key))));
};
const analyzeSemanticDataFlowCore = (model: SemanticKnowledgeDataFlow): SemanticDataFlowAnalysis => {
    const seeds = typedProject(typedRelation(model.dataFlow), flow => ({
        source: flow.source,
        target: flow.target,
        steps: [flow],
        guards: appendGuard([], flow.guard),
    }));
    const initial = typedDistinct(seeds, pathKey).tuples;
    const paths = closure(model.dataFlow, initial, typedProject(typedRelation(initial), pathKey).tuples);
    const reachable = typedProject(typedDistinct(typedRelation(paths), path => knowledgeIdKey(path.target)), path => path.target).tuples;
    return Object.freeze({ paths: Object.freeze(paths), reachable: Object.freeze(reachable) });
};

export const analyzeSemanticDataFlowJudgment = (model: SemanticKnowledgeDataFlow): SemanticDataFlowJudgment => {
    const analysis = analyzeSemanticDataFlowCore(model);
    return Object.freeze({
        kind: 'semantic_data_flow_judgment',
        input: 'semantic_knowledge_data_flow',
        analysis,
        closure: 'least_fixed_point',
        reasoning: 'declarative_relation_rewrite_fixed_point',
        derivation: 'relation_closure_saturation',
        closed: true,
    });
};

export const analyzeSemanticDataFlow = (model: SemanticKnowledgeDataFlow): SemanticDataFlowAnalysis => analyzeSemanticDataFlowJudgment(model).analysis;
export const pathSatisfiesGuard = (path: SemanticDataFlowPath, predicate: KnowledgeId, polarity: SemanticPredicatePolarity): boolean => typedSelect(typedRelation(path.guards), guard => sameGuard(guard, { predicate, polarity })).tuples.length > 0;

export const semanticDataFlowAnalysisPort = (analysis: SemanticDataFlowAnalysis): AstSemanticStagePort => createAnalysisPort(
    typedProject(typedRelation(analysis.paths), path => analysisFact(
        'analysis_reaches',
        astSemanticTextTerm(knowledgeIdKey(path.source)),
        astSemanticTextTerm(knowledgeIdKey(path.target)),
    )).tuples,
);

export const semanticDataFlowAnalysisInterface = (...args: Parameters<typeof semanticDataFlowAnalysisPort>): AstSemanticStageInterface =>
  astSemanticStageInterfaceOf(semanticDataFlowAnalysisPort(...args));
