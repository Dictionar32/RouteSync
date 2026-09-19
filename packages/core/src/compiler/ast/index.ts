/**
 * @fileoverview AST node structures and utilities
 * @module compiler/ast
 */

export type { ASTNodeData } from './ASTNodeData';
export type { ASTNodeId } from '../utils';
export {
    createASTNodeData,
    isSameKind,
    hasChildren
} from './ASTNodeData';
