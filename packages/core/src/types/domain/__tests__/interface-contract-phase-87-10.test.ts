import { describe, expect, test } from 'vitest';
import { foldPhpAstNode } from '../phpAst/algebra';
import type { PhpAstNode } from '../phpAst/nodes';
import type { FieldNode } from '../../field';

describe('Phase 87.10 AST → Field ADT boundary', () => {
  test('preserves canonical unsupported reason instead of collapsing to free code', () => {
    const ast: PhpAstNode = {
      kind: 'unsupported',
      originalCode: '$query->futureFeature()',
      source: { kind: 'absent' },
      reason: { kind: 'unsupported_syntax' }
    };

    const field = foldPhpAstNode(ast, {
      propertyLookup: () => { throw new Error('unexpected'); },
      nullsafePropertyLookup: () => { throw new Error('unexpected'); },
      offsetLookup: () => { throw new Error('unexpected'); },
      staticPropertyLookup: () => { throw new Error('unexpected'); },
      functionCall: () => { throw new Error('unexpected'); },
      methodCall: () => { throw new Error('unexpected'); },
      nullsafeMethodCall: () => { throw new Error('unexpected'); },
      staticMethodCall: () => { throw new Error('unexpected'); },
      variableCall: () => { throw new Error('unexpected'); },
      newInstance: () => { throw new Error('unexpected'); },
      closure: () => { throw new Error('unexpected'); },
      arrowFunc: () => { throw new Error('unexpected'); },
      binary: () => { throw new Error('unexpected'); },
      unary: () => { throw new Error('unexpected'); },
      typeCast: () => { throw new Error('unexpected'); },
      ternary: () => { throw new Error('unexpected'); },
      array: () => { throw new Error('unexpected'); },
      literal: () => { throw new Error('unexpected'); },
      staticConstant: () => { throw new Error('unexpected'); },
      variable: () => { throw new Error('unexpected'); },
      unsupported: (node) => ({ kind: 'unknown', originalCode: node.originalCode, reason: node.reason })
    } satisfies import('../phpAst/algebra').PhpAstFolder<FieldNode>);

    expect(field).toEqual({
      kind: 'unknown',
      originalCode: '$query->futureFeature()',
      reason: { kind: 'unsupported_syntax' }
    });
  });
});
