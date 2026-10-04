import { relationAll, relationEqual, relationResolve } from '../../../relational/sequence';
import { relationFirstOption, relationOptionFold, relationOptionMap, type RelationOption } from '../../../../semantic/kernel/relationalSequence';
import type { KnowledgeId, SemanticCallable, SemanticEmission, SemanticInvocation, SemanticKnowledgeDataFlow, SemanticDataFlowFact, SemanticFact } from './semanticKnowledgeDataFlowRelations';
import type { RelationVariant } from '../../../../semantic/kernel/relationalSequence';
import type { SemanticRelation } from './semanticRewriteEngine';
import { typedExpand, typedProject, typedRelation, typedSelect } from './semanticTypedRelation';
import { solveSemanticRelations, type SemanticRelationRewrite } from './semanticRewriteEngine';
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

const invocationFacts = (model: SemanticKnowledgeDataFlow): readonly SemanticInvocation[] => typedProject(
    typedSelect(typedRelation(model.facts), (fact): fact is RelationVariant<SemanticFact, 'invocation'> => relationEqual(fact.kind, 'invocation')),
    fact => fact.value,
).tuples;
const callableFacts = (model: SemanticKnowledgeDataFlow): readonly SemanticCallable[] => typedProject(
    typedSelect(typedRelation(model.facts), (fact): fact is RelationVariant<SemanticFact, 'callable'> => relationEqual(fact.kind, 'callable')),
    fact => fact.value,
).tuples;
const emissionFacts = (model: SemanticKnowledgeDataFlow): readonly SemanticEmission[] => typedProject(
    typedSelect(typedRelation(model.facts), (fact): fact is RelationVariant<SemanticFact, 'emission'> => relationEqual(fact.kind, 'emission')),
    fact => fact.value,
).tuples;
type InterproceduralRelation = 'data-flow' | 'call-target';
type SemanticRelationOfCallTarget = SemanticRelation<'call-target'>;
const pair = <A, B>(left: A, right: B): readonly [A, B] => [left, right];
const mapOption = <V>(index: readonly (readonly [string, V])[], key: string): RelationOption<V> => relationOptionMap(relationFirstOption(index, entry => relationEqual(entry[0], key)), entry => entry[1]);

const CALLABLE_BOUNDARY_REWRITES: readonly SemanticRelationRewrite<InterproceduralRelation>[] = [
    {
        id: 'data-flow-boundary:callable', priority: 0,
        when: [{ relation: 'data-flow', arguments: [{ variable: 'source' }, { variable: 'target' }, 'callable'] }],
        then: [{ relation: 'call-target', arguments: [{ variable: 'source' }, { variable: 'target' }] }],
    },
];

const targetRelations = (model: SemanticKnowledgeDataFlow, invocations: readonly SemanticInvocation[], callables: readonly SemanticCallable[]): readonly SemanticCallTarget[] => {
    const invocationKeys = typedProject(typedRelation(invocations), invocation => pair(knowledgeIdKey(invocation.id), invocation)).tuples;
    const callableKeys = typedProject(typedRelation(callables), callable => pair(knowledgeIdKey(callable.id), callable)).tuples;
    const seed = typedProject(typedRelation(model.dataFlow), (flow: SemanticDataFlowFact) => ({
        relation: 'data-flow',
        arguments: [knowledgeIdKey(flow.source), knowledgeIdKey(flow.target), flow.role.code],
    })).tuples;
    const solved = solveSemanticRelations<InterproceduralRelation>(seed, CALLABLE_BOUNDARY_REWRITES);
    return typedExpand(
        typedSelect(
            typedRelation(solved),
            (fact): fact is SemanticRelationOfCallTarget => relationAll([relationEqual(fact.relation, 'call-target'), relationEqual(fact.arguments.length, 2)]),
        ),
        fact => relationOptionFold(
            mapOption(invocationKeys, String(fact.arguments[0])),
            () => typedRelation<SemanticCallTarget>([]),
            invocation => relationOptionFold(
                mapOption(callableKeys, String(fact.arguments[1])),
                () => typedRelation<SemanticCallTarget>([]),
                callable => typedRelation([{ invocation, callable }]),
            ),
        ),
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
