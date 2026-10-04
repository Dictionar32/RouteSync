import { relationEqual } from '../../../../semantic/kernel/semanticRelations';
import type { KnowledgeId, SemanticAssignment, SemanticFact, SemanticKnowledgeDataFlow, SemanticAccess, SemanticAccessMember, SemanticMerge, SemanticPresence, SemanticSource, } from './semanticKnowledgeDataFlowRelations';
import { knowledgeIdKey } from './semanticKnowledgeDataFlowRelations';
import { typedExpand, typedProject, typedRelation, typedSelect } from './semanticTypedRelation';
import { relationVariantValue, type RelationVariant } from '../../../../semantic/kernel/relationalSequence';
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
    readonly member: SemanticAccessMember;
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
    readonly selector: SemanticPresence<KnowledgeId>;
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
    variable: location => `variable:${knowledgeIdKey(relationVariantValue(location, 'variable').variable)}`,
    member: location => {
        const member = relationVariantValue(location, 'member');
        const memberResolvers: Record<typeof member.member['kind'], (value: typeof member.member) => string> = {
            'knowledge-id': value => `knowledge-id:${knowledgeIdKey(relationVariantValue(member.member, 'knowledge-id').value)}`,
            identifier: value => `identifier:${relationVariantValue(member.member, 'identifier').value.value.value}`,
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
const referenceUse = (reference: RelationVariant<SemanticFact, 'reference'>): SemanticStateUse => ({
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
        member: relationVariantValue(access.member, access.member.kind),
    },
    source: access.source,
});
const assignmentFacts = (facts: readonly SemanticFact[]): readonly SemanticStateDef[] => typedProject(typedSelect(typedRelation(facts), (fact): fact is RelationVariant<SemanticFact, 'assignment'> => relationEqual(fact.kind, 'assignment')), fact => assignmentDef(fact.value)).tuples;
const referenceFacts = (facts: readonly SemanticFact[]): readonly SemanticStateUse[] => typedProject(typedSelect(typedRelation(facts), (fact): fact is RelationVariant<SemanticFact, 'reference'> => relationEqual(fact.kind, 'reference')), fact => referenceUse(fact)).tuples;
const accessFacts = (facts: readonly SemanticFact[]): readonly SemanticStateUse[] => typedProject(typedSelect(typedRelation(facts), (fact): fact is RelationVariant<SemanticFact, 'access'> => relationEqual(fact.kind, 'access')), fact => accessUse(fact.value)).tuples;
const mergeState = (merge: SemanticMerge): SemanticStateMerge => ({
    kind: 'state-merge',
    id: merge.id,
    location: { kind: 'variable', variable: merge.id },
    incoming: merge.values,
    selector: merge.selector,
    source: merge.source,
});
const mergeFacts = (facts: readonly SemanticFact[]): readonly SemanticStateMerge[] => typedProject(typedSelect(typedRelation(facts), (fact): fact is RelationVariant<SemanticFact, 'merge'> => relationEqual(fact.kind, 'merge')), fact => mergeState(fact.value)).tuples;
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
