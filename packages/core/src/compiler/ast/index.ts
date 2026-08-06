/**
 * @fileoverview AST node structures and utilities
 * @module compiler/ast
 */

export type { ASTNodeId, ASTNodeData } from './ASTNodeData';
export {
    createASTNodeData,
    isSameKind,
    hasChildren
} from './ASTNodeData';
