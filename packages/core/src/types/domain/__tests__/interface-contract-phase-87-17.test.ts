import { describe, expect, it } from 'vitest';
import type { FieldNode } from '../../field';
import { matchFieldNode } from '../fieldCatamorphism';

describe('Phase 87.17 FieldNode syntax boundary', () => {
  it('does not expose declared primitive/model variants as parser syntax', () => {
    const node: FieldNode = {
      kind: 'literal',
      originalCode: '42',
      source: { file: 'ecommerce_shop/app/Http/Controllers/ProductReviewController.php', line: 37, column: 1, context: 'controller' },
      value: 42,
    };

    const result = matchFieldNode(node, {
      array: () => 'array',
      unknown: () => 'unknown',
      literal: () => 'literal',
      variable: () => 'variable',
      property_access: () => 'property_access',
      array_access: () => 'array_access',
      function_call: () => 'function_call',
      method_call: () => 'method_call',
      nullsafe_method_call: () => 'nullsafe_method_call',
      variable_call: () => 'variable_call',
      static_method_call: () => 'static_method_call',
      static_property_access: () => 'static_property_access',
      static_constant: () => 'static_constant',
      unary_expression: () => 'unary_expression',
      binary_expression: () => 'binary_expression',
      type_cast: () => 'type_cast',
      ternary: () => 'ternary',
      nullsafe_property_access: () => 'nullsafe_property_access',
      new_instance: () => 'new_instance',
      closure: () => 'closure',
      arrow_func: () => 'arrow_func',
    });

    expect(result).toBe('literal');
  });
});
