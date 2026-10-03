import { relationAll, relationEqual, relationResolve } from '../../../relational/sequence';
import { relationFirstOption, relationOptionFold, type RelationOption, relationCatalogValueOr } from '../../../../semantic/kernel/relationalSequence';
import type { KnowledgeId, SemanticCallable, SemanticEmission, SemanticInvocation, SemanticKnowledgeDataFlow, SemanticDataFlowFact, SemanticFact } from './semanticKnowledgeDataFlowRelations';
import { typedExpand, typedProject, typedRelation, typedSelect } from './semanticTypedRelation';
import { solveSemanticRelations, type SemanticRelationRewrite } from './semanticRelationSolver';
import { knowledgeIdKey } from './semanticKnowledgeDataFlowRelations';

export interface SemanticCallTarget { readonly invocation: SemanticInvocation; readonly callable: SemanticCallable; }
export interface SemanticArgumentParameterFlow {
    readonly invocation: SemanticInvocation;
    readonly callable: SemanticCallable;
    readonly argument: KnowledgeId;
    readonly parameter: KnowledgeId;
    readonly argumentIndex: number;
}
export interface SemanticCallEmissionFlow {
    readonly invocation: SemanticInvocation;
    readonly callable: SemanticCallable;
    readonly emission: SemanticEmission;
    readonly target: KnowledgeId;
}
export interface SemanticInterproceduralDataFlow {
    readonly callTargets: readonly SemanticCallTarget[];
    readonly argumentParameters: readonly SemanticArgumentParameterFlow[];
    readonly resultFlows: readonly SemanticCallEmissionFlow[];
    readonly exceptionFlows: readonly SemanticCallEmissionFlow[];
}

type FactOfKind<K extends SemanticFact['kind']> = Extract<SemanticFact, { readonly kind: K }>['value'];
const factsByKind = <K extends SemanticFact['kind']>(model: SemanticKnowledgeDataFlow, kind: K): readonly FactOfKind<K>[] =>
    typedProject(
        typedSelect(typedRelation(model.facts), (fact): fact is Extract<SemanticFact, { readonly kind: K }> => relationEqual(fact.kind, kind)),
        fact => fact.value,
    ).tuples;
const invocationFacts = (model: SemanticKnowledgeDataFlow): readonly SemanticInvocation[] => factsByKind(model, 'invocation');
const callableFacts = (model: SemanticKnowledgeDataFlow): readonly SemanticCallable[] => factsByKind(model, 'callable');
const emissionFacts = (model: SemanticKnowledgeDataFlow): readonly SemanticEmission[] => factsByKind(model, 'emission');
type InterproceduralRelation = 'data-flow' | 'call-target';
const pair = <A, B>(left: A, right: B): readonly [A, B] => [left, right];
const mapOption = <V>(index: readonly (readonly [string, V])[], key: string): RelationOption<V> => relationFirstOption(index, entry => relationEqual(entry[0], key));

const CALLABLE_BOUNDARY_REWRITES: readonly SemanticRelationRewrite<InterproceduralRelation>[] = Object.freeze([
    Object.freeze({
        id: 'data-flow-boundary:callable', priority: 0,
        when: Object.freeze([{ relation: 'data-flow', arguments: [{ variable: 'source' }, { variable: 'target' }, 'callable'] }]),
        then: Object.freeze([{ relation: 'call-target', arguments: [{ variable: 'source' }, { variable: 'target' }] }]),
    }),
]);

const targetRelations = (model: SemanticKnowledgeDataFlow, invocations: readonly SemanticInvocation[], callables: readonly SemanticCallable[]): readonly SemanticCallTarget[] => {
    const invocationKeys = typedProject(typedRelation(invocations), invocation => pair(knowledgeIdKey(invocation.id), invocation)).tuples;
    const callableKeys = typedProject(typedRelation(callables), callable => pair(knowledgeIdKey(callable.id), callable)).tuples;
    const seed = typedProject(typedRelation(model.dataFlow), (flow: SemanticDataFlowFact) => ({
        relation: 'data-flow',
        arguments: [knowledgeIdKey(flow.source), knowledgeIdKey(flow.target), flow.role.code],
    })).tuples;
    const solved = solveSemanticRelations<InterproceduralRelation>(seed, CALLABLE_BOUNDARY_REWRITES);
    return typedProject(
        typedSelect(
            typedProject(
                typedSelect(typedRelation(solved), fact => relationAll([relationEqual(fact.relation, 'call-target'), relationEqual(fact.arguments.length, 2)])),
                fact => pair(
                    relationOptionFold(mapOption(invocationKeys, String(fact.arguments[0])), () => ({ kind: 'absent' }), value => ({ kind: 'present', value })),
                    relationOptionFold(mapOption(callableKeys, String(fact.arguments[1])), () => ({ kind: 'absent' }), value => ({ kind: 'present', value })),
                ),
            ),
            entry => relationAll([relationEqual(entry[0].kind, 'present'), relationEqual(entry[1].kind, 'present')]),
        ),
        entry => ({ invocation: entry[0].value, callable: entry[1].value }),
    ).tuples;
};

const emissionIndex = (model: SemanticKnowledgeDataFlow): readonly (readonly [string, SemanticEmission])[] =>
    typedProject(typedRelation(emissionFacts(model)), emission => pair(knowledgeIdKey(emission.id), emission)).tuples;

export const analyzeSemanticInterproceduralDataFlow = (model: SemanticKnowledgeDataFlow): SemanticInterproceduralDataFlow => {
    const invocations = invocationFacts(model);
    const callables = callableFacts(model);
    const emissions = emissionIndex(model);
    const callTargets = targetRelations(model, invocations, callables);
    const argumentParameters = typedExpand(typedRelation(callTargets), target => typedExpand(typedRelation(target.invocation.arguments), (argument, index) => {
        const parameter = relationFirstOption(target.callable.parameters, (_candidate, position) => relationEqual(position, index));
        return relationOptionFold(parameter, () => typedRelation<SemanticArgumentParameterFlow>([]), value => typedRelation([{
            invocation: target.invocation, callable: target.callable, argument, parameter: value, argumentIndex: index,
        }]));
    })).tuples;
    const emissionFlows = (code: 'result' | 'exception'): readonly SemanticCallEmissionFlow[] => typedExpand(
        typedRelation(callTargets),
        target => typedExpand(
            typedRelation(target.callable.emissions),
            id => relationOptionFold(
                mapOption(emissions, knowledgeIdKey(id)),
                () => typedRelation<SemanticCallEmissionFlow>([]),
                emission => relationResolve(
                    relationEqual(emission.definition.code, code),
                    () => typedRelation([{ invocation: target.invocation, callable: target.callable, emission, target: target.invocation.id }]),
                    () => typedRelation<SemanticCallEmissionFlow>([]),
                ),
            ),
        ),
    ).tuples;
    return Object.freeze({
        callTargets: Object.freeze(callTargets),
        argumentParameters: Object.freeze(argumentParameters),
        resultFlows: Object.freeze(emissionFlows('result')),
        exceptionFlows: Object.freeze(emissionFlows('exception')),
    });
};

export const callTargetFor = (analysis: SemanticInterproceduralDataFlow, invocation: KnowledgeId): readonly SemanticCallable[] => Object.freeze(
    typedProject(typedSelect(typedRelation(analysis.callTargets), target => relationEqual(knowledgeIdKey(target.invocation.id), knowledgeIdKey(invocation))), target => target.callable).tuples,
);
export const parameterFlowsFor = (analysis: SemanticInterproceduralDataFlow, invocation: KnowledgeId): readonly SemanticArgumentParameterFlow[] => Object.freeze(
    typedSelect(typedRelation(analysis.argumentParameters), flow => relationEqual(knowledgeIdKey(flow.invocation.id), knowledgeIdKey(invocation))).tuples,
);
