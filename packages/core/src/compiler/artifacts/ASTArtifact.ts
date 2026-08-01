/**
 * AST Artifact
 * 
 * Contains the abstract syntax tree representation of source code.
 * This is typically the first artifact produced by the parser.
 * 
 * @module compiler/artifacts
 */

import type { ArtifactMetadata } from './Artifact';
import { TypedArtifact } from './Artifact';

/**
 * Source location information for AST nodes
*/
import { FileSpan } from '../types/FileSpan';

/**
 * Base interface for all AST nodes
 */
import { ASTBaseNode } from '../types/FileSpan';

/**
 * Class declaration node
 */
export class ClassDeclaration implements ASTBaseNode {
    readonly kind = 'ClassDeclaration';
    constructor(
        readonly span: FileSpan,
        readonly name: string
    ) { }
}

/**
 * Method declaration node
 */
export class MethodDeclaration implements ASTBaseNode {
    readonly kind = 'MethodDeclaration';
    constructor(
        readonly span: FileSpan,
        readonly name: string
    ) { }
}

/**
 * Property declaration node
 */
export class PropertyDeclaration implements ASTBaseNode {
    readonly kind = 'PropertyDeclaration';
    constructor(
        readonly span: FileSpan,
        readonly name: string
    ) { }
}

/**
 * Function call expression node
 */
export class CallExpression implements ASTBaseNode {
    readonly kind = 'CallExpression';
    constructor(
        readonly span: FileSpan,
        readonly callee: string
    ) { }
}

/**
 * Discriminated union of all AST node types
 */
export type ASTNode =
    | ClassDeclaration
    | MethodDeclaration
    | PropertyDeclaration
    | CallExpression;

/**
 * Artifact containing the abstract syntax tree
 */
export class ASTArtifact extends TypedArtifact<'AST'> {
    public readonly typeId = 'AST';

    constructor(
        public readonly root: ASTNode,
        public readonly metadata: ArtifactMetadata
    ) {
        super();
    }
}
