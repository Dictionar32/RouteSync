import { describe, expect, it } from 'vitest';
import { semanticClosureRuntimeOperations } from '../semanticClosureEngine';

describe('Phase 1550 — upstream-owned relation closure', () => {
  it('validates catalog bindings, derives semantic facts, and canonicalizes duplicate facts', () => {
    const result = semanticClosureRuntimeOperations.closeRelations([
      semanticClosureRuntimeOperations.createFact('condition', ['admin', 'admin']),
      semanticClosureRuntimeOperations.createFact('candidate', ['admin', 'edit']),
      semanticClosureRuntimeOperations.createFact('requires', ['edit', 'admin']),
    ], 64);
    const permits = result.facts.filter(fact => fact.relation === 'permits');
    expect(result.saturated).toBe(true);
    expect(permits).toHaveLength(1);
    expect(permits[0]?.arguments).toEqual(['admin', 'edit']);
    expect(result.evidence.length).toBeGreaterThanOrEqual(result.facts.length);
  });
});
