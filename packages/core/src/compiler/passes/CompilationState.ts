/**
 * Relation-backed immutable compiler state.
 *
 * Artifact facts are tuples. Presence, lookup, merge and validation are
 * relation operations; semantic state is never mutated in place.
 */
import type { ArtifactKey, ArtifactRegistry } from '../artifacts/types';
import type { ArtifactKeyWitness } from './ArtifactKeyWitness';
import {
    relationEqual,
    relationIndexAdd,
    relationIndexLookup,
    relationOptionFold,
    relationProject,
    relationFold,
    relationResolve,
    type RelationIndex,
    type RelationOption,
} from '../../semantic/foundation/relationalSequence';

export type CompilationState = Readonly<{
    readonly artifacts: RelationIndex<ArtifactKey, ArtifactRegistry[ArtifactKey]>;
    readonly has: <K extends ArtifactKey>(key: K) => boolean;
    readonly get: <K extends ArtifactKey>(key: K) => RelationOption<ArtifactRegistry[K]>;
    readonly keys: () => readonly ArtifactKey[];
    readonly put: <K extends ArtifactKey>(key: K, value: ArtifactRegistry[K]) => CompilationState;
    readonly merge: (other: CompilationState) => CompilationState;
    readonly require: <K extends ArtifactKey>(witness: ArtifactKeyWitness<K>) => ArtifactRegistry[K];
}>;

type StoredArtifact = ArtifactRegistry[ArtifactKey];

const artifactIsValid = <K extends ArtifactKey>(key: K, value: ArtifactRegistry[K]): boolean => relationResolve(
    relationEqual(value.typeId, key),
    () => relationEqual(typeof value.metadata.hash, 'string'),
    () => false,
);

const createState = (artifacts: RelationIndex<ArtifactKey, StoredArtifact>): CompilationState => {
    const frozen = Object.freeze(artifacts);
    const state: CompilationState = {
        artifacts: frozen,
        has: key => relationOptionFold(
            relationIndexLookup(frozen, key),
            () => false,
            () => true,
        ),
        get: key => relationIndexLookup(frozen, key) as RelationOption<ArtifactRegistry[typeof key]>,
        keys: () => Object.freeze(relationProject(frozen, entry => entry[0])),
        put: (key, value) => relationResolve(
            artifactIsValid(key, value),
            () => {
                const existing = relationIndexLookup(frozen, key) as RelationOption<ArtifactRegistry[typeof key]>;
                return relationOptionFold(
                    existing,
                    () => createState(relationIndexAdd(frozen, key, value)),
                    current => relationResolve(
                        relationEqual(current, value),
                        () => state,
                        () => { throw Error(`Artifact conflict for ${String(key)}: state already contains a different value`); },
                    ),
                );
            },
            () => { throw Error(`Invalid artifact for key ${String(key)}: typeId does not match the registry key`); },
        ),
        merge: other => relationFold(
            other.artifacts,
            state,
            (merged, entry) => merged.put(entry[0], entry[1]),
        ),
        require: witness => relationOptionFold(
            relationIndexLookup(frozen, witness.key),
            () => { throw Error(`Missing artifact: ${witness.key}`); },
            value => value as ArtifactRegistry[typeof witness.key],
        ),
    };
    return Object.freeze(state);
};

export const CompilationState = Object.freeze({
    empty: (): CompilationState => createState(Object.freeze([])),
});
