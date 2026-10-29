import { describe, expect, it } from 'vitest';
import {
  irLoweringOperations,
  NULLABLE_WRAPPER_RULES,
  RESPONSE_FIELD_NORMALIZATION_RULES,
  RESPONSE_RESOLVED_TYPE_RULES,
} from '../semanticIRLoweringRelations';

describe('IR lowering domain operations', () => {
  it('continues a found lowering rule through its domain judgment', () => {
    const judgment = irLoweringOperations.ruleSet(RESPONSE_FIELD_NORMALIZATION_RULES).lookup('primitive');
    expect(judgment.kind).toBe('ir_lowering_rule_found');
    expect(judgment.continueWith({ found: rule => rule.operation, missing: () => 'missing' })).toBe('primitive');
  });

  it('represents an absent lowering rule as a distinct judgment', () => {
    const judgment = irLoweringOperations.ruleSet(RESPONSE_FIELD_NORMALIZATION_RULES).lookup('unknown_kind');
    expect(judgment.kind).toBe('ir_lowering_rule_missing');
    expect(judgment.continueWith({ found: rule => rule.operation, missing: sourceKind => sourceKind })).toBe('unknown_kind');
  });

  it('resolves existing response lowering vocabularies without relation foundation imports', () => {
    expect(irLoweringOperations.resolve('reference', RESPONSE_RESOLVED_TYPE_RULES)).toBe('reference');
    expect(irLoweringOperations.resolve('nullable', NULLABLE_WRAPPER_RULES)).toBe('nullable_wrapper');
  });

  it('preserves blocker behavior for a lowering kind with no declared rule', () => {
    expect(() => irLoweringOperations.resolve('unregistered_kind', RESPONSE_FIELD_NORMALIZATION_RULES))
      .toThrow('No declarative lowering operation for unregistered_kind');
  });
});
