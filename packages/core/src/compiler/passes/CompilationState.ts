/**
 * Compilation State
 * 
 * Immutable container for artifacts accumulated during compilation.
 * New states are created by adding or merging artifacts.
 * 
 * @module compiler/passes
 */

import type { ArtifactKey, ArtifactRegistry, ArtifactStorage } from '../artifacts/types';
import type { ArtifactKeyWitness } from './ArtifactKeyWitness';

/**
 * Immutable compilation state holding accumulated artifacts
 */
export class CompilationState {
    private constructor(private readonly artifacts: Readonly<ArtifactStorage>) { }

    /**
     * Creates an empty compilation state
     */
    public static empty(): CompilationState {
        return new CompilationState({});
    }

    /**
     * Returns a new state with an additional artifact
     */
    public put<K extends ArtifactKey>(
        key: K,
        value: ArtifactRegistry[K]
    ): CompilationState {
        return new CompilationState({
            ...this.artifacts,
            [key]: value
        });
    }

    /**
     * Returns a new state with artifacts merged from another state
     */
    public merge(other: CompilationState): CompilationState {
        return new CompilationState({
            ...this.artifacts,
            ...other.artifacts
        });
    }

    /**
     * Retrieves a required artifact, throwing if not present
     */
    public require<K extends ArtifactKey>(
        witness: ArtifactKeyWitness<K>
    ): ArtifactRegistry[K] {
        const value = this.artifacts[witness.key];
        if (!value) {
            throw new Error(`Missing artifact: ${witness.key}`);
        }
        return value;
    }
}
