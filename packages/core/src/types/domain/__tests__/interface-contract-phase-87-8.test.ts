import { describe, expect, test } from 'vitest';
import type { PhpParameter } from '../phpAst/astValues';
import type { FieldNode } from '../../field';

describe('Phase 87.8 AST/FieldNode contract', () => {
  test('arrow parameters retain PHP parameter ADT', () => {
    const parameter: PhpParameter = {
      variable: { kind: 'variable_name', value: 'query' }
    };
    const node: FieldNode = {
      kind: 'arrow_func',
      originalCode: 'fn($query) => $query',
      parameters: [parameter],
      body: {
        kind: 'variable',
        originalCode: '$query',
        name: parameter.variable
      }
    };

    expect(node.parameters[0].variable.kind).toBe('variable_name');
  });

  test('PHP array remains array syntax at AST-to-field boundary', () => {
    const node: FieldNode = {
      kind: 'array',
      originalCode: "['status' => 'paid']",
      entries: [{
        key: {
          kind: 'explicit',
          expression: {
            kind: 'literal',
            originalCode: "'status'",
            value: 'status'
          }
        },
        value: {
          kind: 'literal',
          originalCode: "'paid'",
          value: 'paid'
        }
      }]
    };

    expect(node.kind).toBe('array');
    expect(node.entries[0].key.kind).toBe('explicit');
  });
});
