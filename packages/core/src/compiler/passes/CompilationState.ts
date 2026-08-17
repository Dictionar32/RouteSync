/**
 * Immutable container for compiler artifacts produced during a compilation.
 *
 * Artifact insertion validates the registry key and required metadata. Merging
 * preserves shared artifact instances but rejects conflicting values for the
 * same artifact key.
 */
import type { ArtifactKey, ArtifactRegistry, ArtifactStorage } from '../artifacts/types';
import type { ArtifactKeyWitness } from './ArtifactKeyWitness';

export class CompilationState {
    private constructor(private readonly artifacts: Readonly<ArtifactStorage>) { }

    /** Creates a state with no artifacts. */
    public static empty(): CompilationState {
        return new CompilationState({});
    }


    /** Checks whether an artifact is present in the state. */
    public has<K extends ArtifactKey>(key: K): boolean {
        return this.artifacts[key] !== undefined;
    }


    /** Reads an artifact without throwing when it is absent. */
    public get<K extends ArtifactKey>(key: K): ArtifactRegistry[K] | undefined {
        return this.artifacts[key];
    }


    /** Lists the artifact keys currently stored in the state. */
    public keys(): readonly ArtifactKey[] {
        return Object.keys(this.artifacts) as ArtifactKey[];
    }


    /** Adds an artifact and rejects replacement with a different value. */
    public put<K extends ArtifactKey>(key: K, value: ArtifactRegistry[K]): CompilationState {
        if (value === null || typeof value !== 'object' || value.typeId !== key) {
            throw new Error(`Invalid artifact for key ${String(key)}: typeId does not match the registry key`);
        }

        if (!value.metadata || typeof value.metadata.hash !== 'string') {
            throw new Error(`Invalid artifact for key ${String(key)}: missing artifact metadata`);
        }

        const existing = this.artifacts[key];
        if (existing !== undefined && existing !== value) {
            throw new Error(`Artifact conflict for ${String(key)}: state already contains a different value`);
        }

        if (existing === value) {
            return this;
        }

        return new CompilationState({
            ...this.artifacts,
            [key]: value
        });
    }


    /** Merges states while allowing only identical shared artifact instances. */
    public merge(other: CompilationState): CompilationState {
        let merged: CompilationState = this;

        for (const key of other.keys()) {
            const value = other.get(key);
            if (value === undefined) continue;

            const existing = merged.get(key);
            if (existing !== undefined && existing !== value) {
                throw new Error(`Artifact merge conflict for ${String(key)}`);
            }

            if (existing === undefined) {
                merged = merged.put(key, value);
            }
        }

        return merged;
    }

    /** Reads a required artifact and throws when it is missing. */
    public require<K extends ArtifactKey>(witness: ArtifactKeyWitness<K>): ArtifactRegistry[K] {
        const value = this.artifacts[witness.key];
        if (value === undefined) {
            throw new Error(`Missing artifact: ${witness.key}`);
        }
        return value;
    }
}
