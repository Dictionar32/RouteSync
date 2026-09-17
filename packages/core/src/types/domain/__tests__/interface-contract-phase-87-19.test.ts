import { describe, expect, it } from 'vitest';
import { PrimitiveKind } from '../../../compiler/types/SemanticType';
import {
  ResourceFieldExpressionFactory,
  matchResourceFieldExpression,
  type ResourceFieldExpressionVisitor,
} from '../expressions';

describe('Phase 87.19 resource expression ADT contract', () => {
  it('dispatches through the closed ADT without an any-based dynamic visitor lookup', () => {
    const expression = ResourceFieldExpressionFactory.primitive(PrimitiveKind.NUMBER);
    const visitor: ResourceFieldExpressionVisitor<string> = {
      primitive: () => 'primitive',
      model: () => 'model',
      resource: () => 'resource',
      object: () => 'object',
      array: () => 'array',
      property_access: () => 'property_access',
      nullsafe_property_access: () => 'nullsafe_property_access',
      variable: () => 'variable',
      type_cast: () => 'type_cast',
      binary_expression: () => 'binary_expression',
      method_call: () => 'method_call',
      nullsafe_method_call: () => 'nullsafe_method_call',
      static_method_call: () => 'static_method_call',
      literal: () => 'literal',
      unsupported: () => 'unsupported',
    };

    expect(matchResourceFieldExpression(expression, visitor)).toBe('primitive');
  });

  it('requires an explicit primitive semantic kind at the factory boundary', () => {
    expect(ResourceFieldExpressionFactory.primitive(PrimitiveKind.UNKNOWN).type).toBe(PrimitiveKind.UNKNOWN);
  });
});
