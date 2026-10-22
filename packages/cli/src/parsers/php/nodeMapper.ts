/**
 * nodeMapper.ts
 *
 * Canonical AST boundary: PhpGrammarNode → PhpAstNode.
 * No legacy lowering occurs on the runtime parser path.
 *
 * @module cli/parsers/php
 */

import type { PhpAstNode } from '@routesync/core';
import type { PhpGrammarNode } from './ast/grammar';
import { phpNodeSourceSliceOperation } from './sourceSlice';
import { phpAstBoundaryAdapter } from './boundaryAdapter';

const mapPhpAstNodeImplementation = (grammarNode: PhpGrammarNode, source: string): PhpAstNode => {
    const originalCode = phpNodeSourceSliceOperation.slice(grammarNode, source);
    return phpAstBoundaryAdapter.adaptJudgment(grammarNode, originalCode).ast;
}


export interface PhpAstNodeMappingOperationInterface {
  readonly map: (grammarNode: PhpGrammarNode, source: string) => PhpAstNode;
}

export const phpAstNodeMappingOperation: PhpAstNodeMappingOperationInterface = Object.freeze({
  map: mapPhpAstNodeImplementation,
});
