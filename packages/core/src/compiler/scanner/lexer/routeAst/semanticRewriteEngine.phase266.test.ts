import { describe, expect, it } from 'vitest';
import { rewriteSemanticRelations, type SemanticRelation } from './semanticRewriteEngine';

const v = (variable: string) => ({ variable } as const);
const relation = <R extends string>(name: R, ...args: SemanticRelation<R>['arguments']): SemanticRelation<R> => ({
  relation: name,
  arguments: args,
});

describe('Phase 266 — semantic relation rewrite engine', () => {
  it('rewrites only through semantic relation patterns', () => {
    const result = rewriteSemanticRelations(
      [relation('equivalent', 'a', 'b')],
      [{
        id: 'normalize-equivalence',
        priority: 1,
        when: [{ relation: 'equivalent', arguments: [v('left'), v('right')] }],
        replace: [{ relation: 'same-value', arguments: [v('left'), v('right')] }],
      }],
    );

    expect(result.saturated).toBe(true);
    expect(result.facts).toContainEqual(relation('same-value', 'a', 'b'));
  });
});
