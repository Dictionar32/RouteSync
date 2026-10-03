import { describe, expect, it } from 'vitest';
import { rewriteFixedPoint, rewriteOnce, type RewritePattern } from './semanticDecisionCalculus';

describe('semantic rewrite engine phase 340', () => {
  it('derives a rewrite witness without semantic branch vocabulary', () => {
    const rules: readonly RewritePattern<number>[] = Object.freeze([
      { id: 'increment', matches: value => value < 3, rewrite: value => value + 1, requires: Object.freeze([]) },
    ]);
    const witness = rewriteOnce(0, rules);
    expect(witness.kind).toBe('some');
    expect(witness).toMatchObject({ kind: 'some', value: { after: 1 } });
  });

  it('reaches a fixed point through rewrite closure', () => {
    const rules: readonly RewritePattern<number>[] = Object.freeze([
      { id: 'increment', matches: value => value < 3, rewrite: value => value + 1, requires: Object.freeze([]) },
    ]);
    const result = rewriteFixedPoint(0, rules);
    expect(result.value).toBe(3);
    expect(result.converged).toBe(true);
    expect(result.witnesses).toHaveLength(3);
  });
});
