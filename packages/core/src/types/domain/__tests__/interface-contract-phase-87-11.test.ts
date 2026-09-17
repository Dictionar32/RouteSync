import { describe, expect, test } from 'vitest';
import type { SourceRef } from '../../semantic/sourceProvenance';
import type { BinaryAstNode } from '../phpAst/nodes';
import { FIELD_NODE_ALGEBRA } from '../../../../../../cli/src/parsers/php/algebra/fieldNodeAlgebra';

describe('Phase 87.11 AST → FieldNode provenance contract', () => {
  test('preserves required source provenance across the AST boundary', () => {
    const source: SourceRef = Object.freeze({
      file: 'app/Http/Controllers/ProductReviewController.php',
      line: 37,
      column: 21,
      context: 'controller'
    });

    const node: BinaryAstNode = {
      kind: 'binary',
      originalCode: '$rating ?? 0',
      source,
      operator: { kind: 'null_coalesce' },
      left: {
        kind: 'variable',
        originalCode: '$rating',
        source,
        name: 'rating' as never
      },
      right: {
        kind: 'literal',
        originalCode: '0',
        source,
        value: 0
      }
    };

    const field = FIELD_NODE_ALGEBRA.binary(
      node,
      FIELD_NODE_ALGEBRA.variable(node.left as never),
      FIELD_NODE_ALGEBRA.literal(node.right as never)
    );

    expect(field.source).toBe(source);
    expect(field.originalCode).toBe('$rating ?? 0');
  });
});
