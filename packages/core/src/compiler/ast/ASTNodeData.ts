/**
 * @fileoverview AST node data structure
 * @module compiler/ast/ASTNodeData
 */

import type { FileSpan } from '../types/FileSpan';

/**
 * Unique identifier for an AST node
 */
import { ASTNodeId } from '../utils';

/**
 * Data associated with an AST node
 * 
 * Represents a node in the abstract syntax tree with:
 * - Kind discriminator for type checking
 * - Source location span
 * - Child node references
 * 
 * @example
 * ```typescript
 * const node: ASTNodeData = {
 *   kind: 'FunctionDeclaration',
 *   span: { start: 0, end: 100, fileId: 'main.ts' },
 *   children: [1, 2, 3] // Parameter nodes
 * };
 * ```
 */
export interface ASTNodeData {
    readonly kind: string;
    readonly span: FileSpan;
    readonly children: readonly ASTNodeId[];
}

/**
 * Creates AST node data
 * 
 * @param kind Node kind
 * @param span Source location
 * @param children Child node IDs
 * @returns AST node data
 */
export function createASTNodeData(
    kind: string,
    span: FileSpan,
    children: readonly ASTNodeId[] = []
): ASTNodeData {
    return {
        kind,
        span,
        children
    };
}

/**
 * Checks if two AST nodes have the same kind
 */
export function isSameKind(a: ASTNodeData, b: ASTNodeData): boolean {
    return a.kind === b.kind;
}

/**
 * Checks if an AST node has children
 */
export function hasChildren(node: ASTNodeData): boolean {
    return node.children.length > 0;
}
