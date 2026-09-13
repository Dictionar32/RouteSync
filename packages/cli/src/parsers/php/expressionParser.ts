/**
 * expressionParser.ts
 *
 * Runs php-parser engine on wrapped expression code and delegates to nodeMapper.
 *
 * @module cli/parsers/php
 */

import { Engine } from 'php-parser';
import type { FieldNode } from '@routesync/core';
import { mapPhpAstNode } from './nodeMapper';

const parser = new Engine({
  parser: {
    extractDoc: true,
    php7: true
  },
  ast: {
    withPositions: true
  }
});

export function parsePhpExpression(code: string, hints?: { pattern?: string }): FieldNode {
  if (hints && hints.pattern) {
    if (hints.pattern === 'variable' && code.match(/^\$[a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*$/)) {
      return { kind: 'variable', originalCode: code, name: code.substring(1) };
    }
  }

  const wrapped = `<?php $val = ${code};`;
  try {
    const ast = parser.parseCode(wrapped, 'eval');
    if (ast && ast.children && ast.children.length > 0) {
      const expr = ast.children[0] as Record<string, unknown>;
      if (expr && expr.kind === 'expressionstatement' && expr.expression && typeof expr.expression === 'object' && (expr.expression as unknown as Record<string, unknown>).kind === 'assign') {
        return mapPhpAstNode((expr.expression as unknown as Record<string, unknown>).right, wrapped);
      }
    }
  } catch (_e) {
    // Ignore parser errors and fallback to unknown
  }
  return { kind: 'unknown', code };
}
