import { describe, expect, it } from 'vitest';
import {
  solveSemanticConstraintProgram,
  toSemanticRelationRewrites,
  type SemanticRelation,
} from './semanticConstraintCalculus';

const v = (variable: string) => ({ variable } as const);

const relation = <R extends string>(name: R, ...args: SemanticRelation<R>['arguments']): SemanticRelation<R> => ({
  relation: name,
  arguments: args,
});

describe('Phase 266 — construct-free semantic constraint calculus', () => {
  it('derives semantics from relations plus constraints without source constructs', () => {
    const result = solveSemanticConstraintProgram(
      [
        relation('condition', 'admin'),
        relation('candidate', 'allow'),
        relation('candidate', 'deny'),
        relation('requires', 'allow', 'admin'),
        relation('excludes', 'deny', 'admin'),
      ],
      {
        rules: [
          {
            id: 'derive-permit',
            priority: 1,
            when: [{ relation: 'requires', arguments: [v('action'), v('predicate')] }],
            constraints: [{ kind: 'equals', left: v('predicate'), right: 'admin' }],
            then: [{ relation: 'permits', arguments: [v('action'), v('predicate')] }],
          },
        ],
      },
    );

    expect(result.facts).toContainEqual(relation('permits', 'allow', 'admin'));
    expect(result.facts).not.toContainEqual(relation('permits', 'deny', 'admin'));
  });

  it('rejects a constrained derivation when the constraint is false', () => {
    const result = solveSemanticConstraintProgram(
      [relation('requires', 'allow', 'guest')],
      {
        rules: [{
          id: 'admin-only',
          priority: 1,
          when: [{ relation: 'requires', arguments: [v('action'), v('predicate')] }],
          constraints: [{ kind: 'equals', left: v('predicate'), right: 'admin' }],
          then: [{ relation: 'permits', arguments: [v('action'), v('predicate')] }],
        }],
      },
    );

    expect(result.facts).not.toContainEqual(relation('permits', 'allow', 'guest'));
  });

  it('keeps rewrite compilation construct-free', () => {
    const rules = toSemanticRelationRewrites([{
      id: 'collapse-equivalence',
      priority: 1,
      when: [{ relation: 'equivalent', arguments: [v('a'), v('b')] }],
      replace: [{ relation: 'same-value', arguments: [v('a'), v('b')] }],
    }]);

    expect(rules[0]?.then[0]?.relation).toBe('same-value');
  });
});
