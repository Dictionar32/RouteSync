import { relationResolve } from '../../../relational/sequence';
import { absent, present, type Presence } from '../../../../types/upstream/presence';
import { relationEqual } from '../../../../semantic/kernel/semanticRelations';
import type { KnowledgeId, SemanticAssignment, SemanticDataFlowFact, SemanticFact, SemanticKnowledgeDataFlow, SemanticAccess, SemanticMerge, SemanticSource, SemanticIdentifier, } from './semanticKnowledgeDataFlowRelations';
import { knowledgeIdKey } from './semanticKnowledgeDataFlowRelations';
import { typedExpand, typedProject, typedRelation, typedSelect } from './semanticTypedRelation';
/**
 * Phase 216 — syntax-independent state/data-flow model.
 *
 * Inspired by the separation used by LLVM MemorySSA: state changes are
 * represented as defs, reads as uses, and ambiguous incoming state as merges.
 * Unlike MemorySSA, RouteSync does not require a CFG as its semantic source of
 * truth. A CFG may later be an analysis aid; this model remains knowledge-first.
 */
export type SemanticStateLocation = {
    readonly kind: 'variable';
    readonly variable: KnowledgeId;
} | {
    readonly kind: 'member';
    readonly receiver: KnowledgeId;
    readonly member: {
        readonly kind: 'knowledge-id';
        readonly value: KnowledgeId;
    } | {
        readonly kind: 'identifier';
        readonly value: SemanticIdentifier;
    };
};
export type SemanticStateAccessKind = 'def' | 'use' | 'merge';
export interface SemanticStateDef {
    readonly kind: 'state-def';
    readonly id: KnowledgeId;
    readonly location: SemanticStateLocation;
    readonly value: KnowledgeId;
    readonly source: SemanticSource;
}
export interface SemanticStateUse {
    readonly kind: 'state-use';
    readonly id: KnowledgeId;
    readonly location: SemanticStateLocation;
    readonly source: SemanticSource;
}
export interface SemanticStateMerge {
    readonly kind: 'state-merge';
    readonly id: KnowledgeId;
    readonly location: SemanticStateLocation;
    readonly incoming: readonly KnowledgeId[];
    readonly selector: Presence<KnowledgeId>;
    readonly source: SemanticSource;
}
export type SemanticStateAccess = SemanticStateDef | SemanticStateUse | SemanticStateMerge;
export interface SemanticStateDefUse {
    readonly definition: SemanticStateDef;
    readonly use: SemanticStateUse;
}
export interface SemanticStateDataFlow {
    readonly accesses: readonly SemanticStateAccess[];
    readonly defUse: readonly SemanticStateDefUse[];
    readonly merges: readonly SemanticStateMerge[];
}
const locationKeyResolvers: Record<SemanticStateLocation['kind'], (location: SemanticStateLocation) => string> = {
    variable: location => `variable:${knowledgeIdKey((location as Extract<SemanticStateLocation, {
        kind: 'variable';
    }>).variable)}`,
    member: location => {
        const member = location as Extract<SemanticStateLocation, {
            kind: 'member';
        }>;
        const memberResolvers: Record<typeof member.member['kind'], (value: typeof member.member) => string> = {
            'knowledge-id': value => `knowledge-id:${knowledgeIdKey((value as Extract<typeof member.member, {
                kind: 'knowledge-id';
            }>).value)}`,
            identifier: value => `identifier:${(value as Extract<typeof member.member, {
                kind: 'identifier';
            }>).value.value.value}`,
        };
        return `member:${knowledgeIdKey(member.receiver)}:${memberResolvers[member.member.kind](member.member)}`;
    },
};
const locationKey = (location: SemanticStateLocation): string => locationKeyResolvers[location.kind](location);
const assignmentDef = (assignment: SemanticAssignment): SemanticStateDef => ({
    kind: 'state-def',
    id: assignment.id,
    location: { kind: 'variable', variable: assignment.target },
    value: assignment.value,
    source: assignment.source,
});
const referenceUse = (reference: Extract<SemanticFact, {
    kind: 'reference';
}>): SemanticStateUse => ({
    kind: 'state-use',
    id: reference.value.id,
    location: { kind: 'variable', variable: reference.value.variable },
    source: reference.value.source,
});
const accessUse = (access: SemanticAccess): SemanticStateUse => ({
    kind: 'state-use',
    id: access.id,
    location: {
        kind: 'member',
        receiver: access.receiver,
        member: relationResolve(relationEqual(access.member.kind, 'knowledge-id'), () => ({ kind: 'knowledge-id', value: access.member }), () => ({ kind: 'identifier', value: access.member })),
    },
    source: access.source,
});
const assignmentFacts = (facts: readonly SemanticFact[]): readonly SemanticStateDef[] => typedProject(typedSelect(typedRelation(facts), (fact): fact is Extract<SemanticFact, {
    kind: 'assignment';
}> => relationEqual(fact.kind, 'assignment')), fact => assignmentDef(fact.value)).tuples;
const referenceFacts = (facts: readonly SemanticFact[]): readonly SemanticStateUse[] => typedProject(typedSelect(typedRelation(facts), (fact): fact is Extract<SemanticFact, {
    kind: 'reference';
}> => relationEqual(fact.kind, 'reference')), fact => referenceUse(fact)).tuples;
const accessFacts = (facts: readonly SemanticFact[]): readonly SemanticStateUse[] => typedProject(typedSelect(typedRelation(facts), (fact): fact is Extract<SemanticFact, {
    kind: 'access';
}> => relationEqual(fact.kind, 'access')), fact => accessUse(fact.value)).tuples;
const mergeFacts = (facts: readonly SemanticFact[]): readonly SemanticStateMerge[] => typedProject(typedSelect(typedRelation(facts), (fact): fact is Extract<SemanticFact, {
    kind: 'merge';
}> => relationEqual(fact.kind, 'merge')), fact => {
    const merge: SemanticMerge = fact.value;
    return {
        kind: 'state-merge' as const,
        id: merge.id,
        location: { kind: 'variable' as const, variable: merge.id },
        incoming: merge.values,
        selector: relationResolve(relationEqual(merge.selector.kind, 'present'), () => present(merge.selector.value), () => absent<KnowledgeId>()),
        source: merge.source,
    };
}).tuples;
/**
 * Derives state accesses from canonical semantic facts and resolves possible
 * def-use relationships by semantic location. The Maps/Sets here are only
 * indexes/worklists; they never become the semantic source of truth.
 */
export const analyzeSemanticStateDataFlow = (model: SemanticKnowledgeDataFlow): SemanticStateDataFlow => {
    const defs = assignmentFacts(model.facts);
    const uses = [...referenceFacts(model.facts), ...accessFacts(model.facts)];
    const merges = mergeFacts(model.facts);
    const defUse = typedExpand(typedRelation(uses), use => typedProject(typedSelect(typedRelation(defs), definition => relationEqual(locationKey(definition.location), locationKey(use.location))), definition => Object.freeze({ definition, use }))).tuples;
    return Object.freeze({
        accesses: Object.freeze([...defs, ...uses, ...merges]),
        defUse: Object.freeze(defUse),
        merges: Object.freeze(merges),
    });
};
export const semanticStateLocationKey = locationKey;
