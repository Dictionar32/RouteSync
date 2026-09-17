import { describe, expect, it } from 'vitest';
import type { FieldNode, FieldNodeVisitor } from '../../field';
import { SourceRefFactory } from '../../semantic/sourceProvenance';

describe('Phase 87.13 FieldNode AST contract', () => {
  it('does not expose a synthetic nullsafe_chain variant', () => {
    const visitor: FieldNodeVisitor<string> = {
      primitive: () => 'primitive',
      model: () => 'model',
      object: () => 'object',
      array: () => 'array',
      unknown: () => 'unknown',
      raw_code: () => 'raw_code',
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
    };

    const source = SourceRefFactory.unknown();
    const field: FieldNode = {
      kind: 'nullsafe_property_access',
      originalCode: '$review?->rating',
      source,
      target: {
        kind: 'variable',
        originalCode: '$review',
        source,
        name: { kind: 'variable_name', value: 'review' },
      },
      property: { kind: 'property_name', value: 'rating' },
    };

    expect(visitor.nullsafe_property_access(field)).toBe('nullsafe_property_access');
  });
});
