/**
 * Bound AST Artifact
 * 
 * Contains AST nodes with resolved symbol references and type information.
 * This is produced after semantic analysis binds names to symbols.
 * 
 * @module compiler/artifacts
 */

import type { ArtifactMetadata } from './Artifact';
import { TypedArtifact } from './Artifact';
import type { FileSpan,ASTBaseNode } from '../types/FileSpan';
import type { SemanticType } from '../types/SemanticType';

/**
 * Reference to a symbol from a particular source location
 */
export interface SymbolReference {
    readonly symbolId: number;
    readonly span: FileSpan;
}

/**
 * AST node with resolved bindings and type information
 */
export interface BoundASTNode extends ASTBaseNode {
    readonly kind: 'BoundASTNode';

    /** Symbol this node is bound to */
    readonly symbolId: number;

    /** Resolved semantic type */
    readonly resolvedType: SemanticType;

    /** Scope this node belongs to */
    readonly scopeId: number;

    /** References to other symbols used in this node */
    readonly references: readonly SymbolReference[];

    /** Child bound nodes */
    readonly children: readonly BoundASTNode[];
}

/**
 * Artifact containing the fully bound AST with type information
 */
export class BoundASTArtifact extends TypedArtifact<'BoundAST'> {
    public readonly typeId = 'BoundAST';

    constructor(
        public readonly root: BoundASTNode,
        public readonly metadata: ArtifactMetadata
    ) {
        super();
    }
}
