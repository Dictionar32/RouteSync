/**
 * nodeMapper.ts
 *
 * Pure Dataflow AST Lowering: PhpGrammarNode → FieldNode.
 * 0 if, 0 switch, pure F-Algebra tree fold orchestration.
 *
 * @module cli/parsers/php
 */

import type { FieldNode } from '@routesync/core';
import { foldPhpAstNode } from '@routesync/core';
import { sliceNodeSource } from './sourceSlice';
import { adaptPhpAstBoundary } from './boundaryAdapter';
import { FIELD_NODE_ALGEBRA } from './algebra/fieldNodeAlgebra';

export function mapPhpAstNode(grammarNode: unknown, source: string): FieldNode {
    const originalCode = sliceNodeSource(grammarNode, source);
    const astNode = adaptPhpAstBoundary(grammarNode, originalCode);
    return foldPhpAstNode(astNode, FIELD_NODE_ALGEBRA);
}
