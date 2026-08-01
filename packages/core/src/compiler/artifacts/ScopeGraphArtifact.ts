/**
 * Scope Graph Artifact
 * 
 * Contains the lexical scope hierarchy for name resolution.
 * Maps scope identifiers to their parent scopes and symbol bindings.
 * 
 * @module compiler/artifacts
 */

import type { ArtifactMetadata } from './Artifact';
import { TypedArtifact } from './Artifact';

/**
 * Represents a single scope in the scope graph
 */
export interface ScopeNode {
    /** Unique identifier for this scope */
    readonly scopeId: number;

    /** Parent scope identifier (undefined for root scope) */
    readonly parentId?: number;

    /** Name-to-symbol-ID bindings declared in this scope */
    readonly bindings: ReadonlyMap<string, number>;
}

/**
 * Artifact containing the complete scope hierarchy
 */
export class ScopeGraphArtifact extends TypedArtifact<'ScopeGraph'> {
    public readonly typeId = 'ScopeGraph';

    constructor(
        public readonly scopes: ReadonlyMap<number, ScopeNode>,
        public readonly metadata: ArtifactMetadata
    ) {
        super();
    }
}
