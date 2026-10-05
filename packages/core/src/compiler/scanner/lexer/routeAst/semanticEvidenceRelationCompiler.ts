import { relationContains, relationInsert, type RelationMembership } from '../../../../semantic/foundation/relationMembership';
import { relationResolve } from '../../../relational/sequence';
import { relationAny, relationEqual } from '../../../../semantic/foundation/semanticRelations';
import { relationVariantValue } from '../../../../semantic/foundation/relationalSequence';
import { semanticPresenceFold } from './semanticKnowledgeDataFlowRelations';
/**
 * Phase 287 — relation-native semantic evidence compiler.
 *
 * Evidence enters the semantic authority as typed facts and data-flow edges.
 * This compiler contains no source-language statement vocabulary. Its only
 * output is the canonical relational theory consumed by the declarative
 * program and generic solver.
 */
import { semanticTheoryFact, type SemanticTheoryFact } from './semanticRelationTheory';
import { project, retain, expand } from './semanticRelationalCollections';
import type { SemanticKnowledgeDataFlow, SemanticDataFlowFact, SemanticFact, } from './semanticKnowledgeDataFlowRelations';
import { knowledgeIdKey } from './semanticKnowledgeDataFlowRelations';
const factProjectionTable: Readonly<Record<SemanticFact['kind'], (fact: SemanticFact) => readonly SemanticTheoryFact[]>> = {
    variable: fact => [semanticTheoryFact('entity', [knowledgeIdKey(fact.value.id), fact.kind])],
    value: fact => [semanticTheoryFact('entity', [knowledgeIdKey(fact.value.id), fact.kind])],
    operator: fact => [semanticTheoryFact('entity', [knowledgeIdKey(fact.value.id), fact.kind])],
    comparison: fact => [semanticTheoryFact('entity', [knowledgeIdKey(fact.value.id), fact.kind])],
    'binary-operation': fact => [semanticTheoryFact('entity', [knowledgeIdKey(fact.value.id), fact.kind])],
    'unary-operation': fact => [semanticTheoryFact('entity', [knowledgeIdKey(fact.value.id), fact.kind])],
    predicate: fact => [
        semanticTheoryFact('entity', [knowledgeIdKey(fact.value.id), fact.kind]),
        semanticTheoryFact('condition', [knowledgeIdKey(fact.value.id), knowledgeIdKey(fact.value.id)]),
    ],
    merge: fact => [semanticTheoryFact('entity', [knowledgeIdKey(fact.value.id), fact.kind])],
    match: fact => {
        const match = relationVariantValue(fact, 'match');
        return [
            semanticTheoryFact('entity', [knowledgeIdKey(match.value.id), match.kind]),
            semanticTheoryFact('candidate', [knowledgeIdKey(match.value.id), knowledgeIdKey(match.value.candidate)]),
        ];
    },
    outcome: fact => [semanticTheoryFact('entity', [knowledgeIdKey(fact.value.id), fact.kind])],
    assignment: fact => [semanticTheoryFact('entity', [knowledgeIdKey(fact.value.id), fact.kind])],
    binding: fact => [semanticTheoryFact('entity', [knowledgeIdKey(fact.value.id), fact.kind])],
    reference: fact => [semanticTheoryFact('entity', [knowledgeIdKey(fact.value.id), fact.kind])],
    callable: fact => [semanticTheoryFact('entity', [knowledgeIdKey(fact.value.id), fact.kind])],
    invocation: fact => [semanticTheoryFact('entity', [knowledgeIdKey(fact.value.id), fact.kind])],
    access: fact => [semanticTheoryFact('entity', [knowledgeIdKey(fact.value.id), fact.kind])],
    cast: fact => [semanticTheoryFact('entity', [knowledgeIdKey(fact.value.id), fact.kind])],
    array: fact => [semanticTheoryFact('entity', [knowledgeIdKey(fact.value.id), fact.kind])],
    'static-invocation': fact => [semanticTheoryFact('entity', [knowledgeIdKey(fact.value.id), fact.kind])],
    construction: fact => [semanticTheoryFact('entity', [knowledgeIdKey(fact.value.id), fact.kind])],
    'type-check': fact => [semanticTheoryFact('entity', [knowledgeIdKey(fact.value.id), fact.kind])],
    'class-reference': fact => [semanticTheoryFact('entity', [knowledgeIdKey(fact.value.id), fact.kind])],
    'class-constant': fact => [semanticTheoryFact('entity', [knowledgeIdKey(fact.value.id), fact.kind])],
    'resource-access': fact => [semanticTheoryFact('entity', [knowledgeIdKey(fact.value.id), fact.kind])],
    'interpolated-string': fact => [semanticTheoryFact('entity', [knowledgeIdKey(fact.value.id), fact.kind])],
    'magic-constant': fact => [semanticTheoryFact('entity', [knowledgeIdKey(fact.value.id), fact.kind])],
    closure: fact => [semanticTheoryFact('entity', [knowledgeIdKey(fact.value.id), fact.kind])],
    'arrow-function': fact => [semanticTheoryFact('entity', [knowledgeIdKey(fact.value.id), fact.kind])],
    'anonymous-class': fact => [semanticTheoryFact('entity', [knowledgeIdKey(fact.value.id), fact.kind])],
    'unsupported-expression': fact => [semanticTheoryFact('entity', [knowledgeIdKey(fact.value.id), fact.kind])],
    emission: fact => [semanticTheoryFact('entity', [knowledgeIdKey(fact.value.id), fact.kind])],
    include: fact => [semanticTheoryFact('entity', [knowledgeIdKey(fact.value.id), fact.kind])],
    unset: fact => [semanticTheoryFact('entity', [knowledgeIdKey(fact.value.id), fact.kind])],
    region: fact => [semanticTheoryFact('entity', [knowledgeIdKey(fact.value.id), fact.kind])],
    'exception-handler': fact => [semanticTheoryFact('entity', [knowledgeIdKey(fact.value.id), fact.kind])],
    exception: fact => [semanticTheoryFact('entity', [knowledgeIdKey(fact.value.id), fact.kind])],
    scope: fact => [semanticTheoryFact('entity', [knowledgeIdKey(fact.value.id), fact.kind])],
};
const flowProjectionTable: Readonly<Record<SemanticDataFlowFact['kind'], (flow: SemanticDataFlowFact) => readonly SemanticTheoryFact[]>> = {
    dependency: flow => projectFlow(flow),
    'value-flow': flow => [
        ...projectFlow(flow),
        semanticTheoryFact('transfers', [knowledgeIdKey(flow.source), knowledgeIdKey(flow.target), 'value']),
    ],
};
const projectFlow = (flow: SemanticDataFlowFact): readonly SemanticTheoryFact[] => {
    const source = knowledgeIdKey(flow.source);
    const target = knowledgeIdKey(flow.target);
    const guarded = semanticPresenceFold(flow.guard, () => [], guard => [relationResolve(relationEqual(guard.polarity, 'satisfied'), () => semanticTheoryFact('requires', [source, knowledgeIdKey(guard.predicate)]), () => semanticTheoryFact('excludes', [source, knowledgeIdKey(guard.predicate)]))]);
    const role = relationResolve(relationEqual(flow.role.code, 'predicate'), () => [semanticTheoryFact('condition', [source, target]), semanticTheoryFact('requires', [source, target])], () => relationResolve(relationAny([relationEqual(flow.role.code, 'candidate'), relationEqual(flow.role.code, 'body')]), () => [semanticTheoryFact('candidate', [source, target])], () => []));
    return [semanticTheoryFact('depends', [source, target]), ...guarded, ...role];
};
export const compileSemanticEvidenceRelations = (model: Pick<SemanticKnowledgeDataFlow, 'facts' | 'dataFlow'>): readonly SemanticTheoryFact[] => {
    const projected = expand(model.facts, fact => factProjectionTable[fact.kind](fact))
        .concat(expand(model.dataFlow, flow => flowProjectionTable[flow.kind](flow)));
    let seen: RelationMembership<string> = [];
    return Object.freeze(retain(projected, fact => {
        const key = `${fact.relation}:${project(fact.arguments, String).join('|')}`;
        return relationResolve(relationContains(seen, key), () => false, () => (seen = relationInsert(seen, key), true));
    }));
};
