import { relationEqual, relationNotEqual, relationResolve } from '../../../relational/sequence';
import { relationFirstOption, relationOptionFold } from '../../../../semantic/kernel/relationalSequence';
import type { KnowledgeId, SemanticKnowledgeDataFlow, SemanticSource } from './semanticKnowledgeDataFlowRelations';
import { knowledgeId, knowledgeIdKey } from './semanticKnowledgeDataFlowRelations';
import { analyzeSemanticStateDataFlow, semanticStateLocationKey, type SemanticStateDef, type SemanticStateLocation, type SemanticStateMerge, type SemanticStateUse } from './semanticStateDataFlow';
import { typedProject, typedRelation, typedSelect, typedUnion } from './semanticTypedRelation';
import { retain } from './semanticRelationalCollections';

/**
 * Phase 362 — versioned state as relational semantic authority.
 *
 * Versions are derived identities. Candidate reaching versions are selected
 * from semantic location relations; merge inputs are resolved through origin
 * relations. No host-language absence sentinel participates in the model.
 */
export type SemanticStateVersionKind = 'definition' | 'merge';
export interface SemanticStateVersion {
    readonly kind: 'state-version';
    readonly id: KnowledgeId;
    readonly versionKind: SemanticStateVersionKind;
    readonly location: SemanticStateLocation;
    readonly source: SemanticSource;
    readonly origin: KnowledgeId;
}
export interface SemanticStateVersionUse {
    readonly use: SemanticStateUse;
    readonly candidates: readonly KnowledgeId[];
}
export interface SemanticStateVersionMerge {
    readonly merge: SemanticStateMerge;
    readonly incomingVersions: readonly KnowledgeId[];
}
export interface SemanticStateVersionFlow {
    readonly versions: readonly SemanticStateVersion[];
    readonly uses: readonly SemanticStateVersionUse[];
    readonly merges: readonly SemanticStateVersionMerge[];
}

const versionId = (origin: KnowledgeId): KnowledgeId => knowledgeId(origin.identity.source, origin.identity.role, `state-version:${knowledgeIdKey(origin)}`);
const versionFromDef = (definition: SemanticStateDef): SemanticStateVersion => ({
    kind: 'state-version', id: versionId(definition.id), versionKind: 'definition',
    location: definition.location, source: definition.source, origin: definition.id,
});
const versionFromMerge = (merge: SemanticStateMerge): SemanticStateVersion => ({
    kind: 'state-version', id: versionId(merge.id), versionKind: 'merge',
    location: merge.location, source: merge.source, origin: merge.id,
});

const entryAt = <K, V>(entries: readonly (readonly [K, V])[], key: K): import('../../../../semantic/kernel/relationalSequence').RelationOption<V> =>
    relationFirstOption(entries, entry => relationEqual(entry[0], key));

const byLocation = (versions: readonly SemanticStateVersion[]): readonly (readonly [string, readonly SemanticStateVersion[]])[] => {
    let index: readonly (readonly [string, readonly SemanticStateVersion[]])[] = [];
    const add = (position: number): void => relationResolve(
        position < versions.length,
        () => {
            const version = versions[position];
            const key = semanticStateLocationKey(version.location);
            const prior: readonly SemanticStateVersion[] = relationOptionFold(entryAt(index, key), () => [], value => value);
            index = [...retain(index, ([candidate]) => relationNotEqual(candidate, key)), [key, [...prior, version]] as const];
            return add(position + 1);
        },
        () => {},
    );
    add(0);
    return index;
};

const byOrigin = (versions: readonly SemanticStateVersion[]): readonly (readonly [string, SemanticStateVersion])[] => {
    let index: readonly (readonly [string, SemanticStateVersion])[] = [];
    const add = (position: number): void => relationResolve(
        position < versions.length,
        () => {
            const version = versions[position];
            index = [...retain(index, ([candidate]) => relationNotEqual(candidate, knowledgeIdKey(version.origin))), [knowledgeIdKey(version.origin), version] as const];
            return add(position + 1);
        },
        () => {},
    );
    add(0);
    return index;
};

export const analyzeSemanticVersionedStateDataFlow = (model: SemanticKnowledgeDataFlow): SemanticStateVersionFlow => {
    const state = analyzeSemanticStateDataFlow(model);
    const definitions = typedProject(typedSelect(typedRelation(state.accesses), (access): access is SemanticStateDef => relationEqual(access.kind, 'state-def')), versionFromDef);
    const merges = typedProject(typedRelation(state.merges), versionFromMerge);
    const versions = typedUnion(definitions, merges).tuples;
    const locationIndex = byLocation(versions);
    const originIndex = byOrigin(versions);
    const uses = typedProject(typedSelect(typedRelation(state.accesses), (access): access is SemanticStateUse => relationEqual(access.kind, 'state-use')), use => {
        const candidates = relationOptionFold(entryAt(locationIndex, semanticStateLocationKey(use.location)), () => [], versionsAtLocation => typedProject(typedRelation(versionsAtLocation), version => version.id).tuples);
        return { use, candidates: Object.freeze(candidates) };
    }).tuples;
    const versionMerges = typedProject(typedRelation(state.merges), merge => {
        const incomingVersions = typedProject(
            typedSelect(
                typedProject(typedRelation(merge.incoming), origin => relationOptionFold(entryAt(originIndex, knowledgeIdKey(origin)), () => ({ kind: 'absent' }), version => ({ kind: 'present', value: version }))),
                (version): version is { readonly kind: 'present'; readonly value: SemanticStateVersion } => relationEqual(version.kind, 'present'),
            ),
            version => version.value.id,
        ).tuples;
        return { merge, incomingVersions: Object.freeze(incomingVersions) };
    }).tuples;
    return Object.freeze({ versions: Object.freeze(versions), uses: Object.freeze(uses), merges: Object.freeze(versionMerges) });
};

export const stateVersionCandidatesFor = (analysis: SemanticStateVersionFlow, useId: KnowledgeId): readonly KnowledgeId[] =>
    relationOptionFold(
        relationFirstOption(analysis.uses, use => relationEqual(knowledgeIdKey(use.use.id), knowledgeIdKey(useId))),
        () => [],
        use => use.candidates,
    );
