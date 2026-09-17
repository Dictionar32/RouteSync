import { describe, expect, it } from 'vitest'
import type { FieldNode } from '../../field'
import { matchFieldNode, type FieldNodeVisitor } from '../fieldCatamorphism'

describe('Phase 87.14 FieldNode AST boundary', () => {
  it('does not expose raw_code as a parser FieldNode variant', () => {
    const visitor: FieldNodeVisitor<string> = {
      primitive: () => 'primitive',
      model: () => 'model',
      object: () => 'object',
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
      arrow_func: () => 'arrow_func'
    }

    const field: FieldNode = {
      kind: 'literal',
      originalCode: '42',
      source: { file: 'Example.php', line: 1, column: 1, context: 'return 42;' },
      value: 42
    }

    expect(matchFieldNode(field, visitor)).toBe('literal')
  })
})
