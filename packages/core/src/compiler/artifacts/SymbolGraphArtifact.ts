/**
 * Symbol Graph Artifact
 * 
 * Contains the global symbol table mapping symbol names to their definitions.
 * This is used for cross-module symbol resolution.
 * 
 * @module compiler/artifacts
 */

import type { ArtifactMetadata } from './Artifact';
import { TypedArtifact } from './Artifact';
import { SemanticType } from '../../types/semantic';

/**
 * Symbol definition with type information
 */
export interface Symbol {
    /** Symbol name */
    readonly name: string;

    /** Symbol kind */
    readonly kind: 'class' | 'method' | 'property';

    /** Optional type information */
    readonly type?: SemanticType;
}

export interface SymbolNode {
    readonly id: string;
    readonly kind: 'class' | 'method' | 'property';
    readonly name: string;
    readonly namespace: string;
    readonly parentId?: string;
    readonly extendsId?: string;
    readonly implementsIds: readonly string[];
}

/**
 * Global symbol table
 */
export interface SymbolTable {
    readonly symbols: ReadonlyMap<string, Symbol>;
}

/**
 * Artifact containing the global symbol graph
 */
export class SymbolGraphArtifact extends TypedArtifact<'SymbolGraph'> {
    public readonly typeId = 'SymbolGraph';

    constructor(
        public readonly symbols: SymbolTable,
        public readonly metadata: ArtifactMetadata
    ) {
        super();
    }
}
