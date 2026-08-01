/**
 * Artifact Key Witness
 * 
 * Type-safe witness for artifact keys. Provides compile-time type safety
 * when reading artifacts from compilation state.
 * 
 * @module compiler/passes
 */

import type { ArtifactKey, ArtifactRegistry } from '../artifacts/types';
import type { CompilationState } from './CompilationState';

/**
 * Type witness for artifact keys
 * 
 * This pattern ensures type safety when reading artifacts from state.
 * The witness carries the artifact key at both type-level and runtime.
 */
export class ArtifactKeyWitness<K extends ArtifactKey> {
    constructor(public readonly key: K) { }

    /**
     * Reads the artifact from compilation state
     */
    public read(state: CompilationState): ArtifactRegistry[K] {
        return state.require(this);
    }
}

/**
 * Type-level tuple artifact resolution
 * 
 * Converts a tuple of artifact keys to a tuple of their artifact types.
 */
export type ResolveArtifacts<T extends readonly ArtifactKey[]> = {
    [K in keyof T]: T[K] extends ArtifactKey
    ? ArtifactRegistry[T[K]]
    : never;
};

/**
 * Reads multiple artifacts using witnesses
 */
export function readArtifacts<K extends readonly ArtifactKey[]>(
    witnesses: { [I in keyof K]: ArtifactKeyWitness<K[I]> },
    state: CompilationState
): ResolveArtifacts<K> {
    // SAFETY:
    // Array.prototype.map widens tuples to arrays. Each witness produces the
    // value corresponding to its ArtifactKey, preserving order and cardinality.
    const list = witnesses as readonly ArtifactKeyWitness<ArtifactKey>[];
    return list.map(w => w.read(state)) as ResolveArtifacts<K>;
}

/**
 * Reads element `i` from a tuple-typed array at runtime.
 *
 * `ResolveArtifacts<O>` types as a tuple — `[ArtifactRegistry[O[0]], ArtifactRegistry[O[1]], ...]`
 * — but at runtime it is just a plain array. TypeScript has no way to verify that a
 * runtime-computed index `i` lines up with the same position at the type level, so every
 * direct `tuple[i] as SomeType` at a call site is quietly asserting that on its own, and has
 * to be re-verified by hand every time the surrounding code changes.
 *
 * This function exists to centralize that one unavoidable assumption in a single, named,
 * documented place instead of scattering `as` casts across the pass-execution machinery:
 *  - there's exactly one line in the whole compiler where "trust me" is asserted for
 *    tuple-index access
 *  - callers get back `T[number]` — already the correct union type — with no cast needed
 *    at the call site
 *  - if the assumption is ever wrong, this is the one place to add a runtime guard
 *
 * SAFETY: this function does NOT bounds-check `i`. Callers must guarantee `i` is a valid
 * index for `tuple` — e.g. `i` coming from iterating `tuple.length`, as in
 * `TypedPassAdapter.applyOutputs`. It isolates the *type-level* unsoundness of tuple
 * indexing, not runtime out-of-bounds access.
 */
export function tupleAt<T extends readonly unknown[]>(tuple: T, i: number): T[number] {
    return tuple[i];
}
