import { describe, expect, it } from 'vitest';
import { semanticRewriteAuthority } from '../semanticRewriteAuthority';
import type { SemanticConstraintProgram } from '../semanticConstraintInterface';

const relation = <R extends string>(name: R, ...arguments_: SemanticRelation<R>['arguments']): SemanticRelation<R> => Object.freeze({ relation: name, arguments: Object.freeze(arguments_) });
const variable = (name: string) => Object.freeze({ variable: name });

describe('Phase 1550 — upstream constraint authority contract', () => {
  it('returns a closed judgment with derivation witnesses when constraints hold', () => {
    const program: SemanticConstraintProgram<'requires' | 'permits'> = {
      rules: [{
        id: 'permit-non-guest', priority: 1,
        when: [{ relation: 'requires', arguments: [variable('action'), variable('role')] }],
        constraints: [{ kind: 'not-equals', left: variable('role'), right: 'guest' }],
        then: [{ relation: 'permits', arguments: [variable('action'), variable('role')] }],
      }],
    };
    const judgment = semanticRewriteAuthority.resolveConstraints([relation('requires', 'edit', 'admin')], program);
    expect(judgment.status).toBe('closed');
    expect(judgment.closed).toBe(true);
    expect(judgment.facts).toContainEqual(relation('permits', 'edit', 'admin'));
    expect(judgment.derivations[0]?.constraintsSatisfied).toBe(true);
    expect(judgment.derivations[0]?.premises).toContainEqual(relation('requires', 'edit', 'admin'));
  });

  it('rejects a derivation whose not-equals constraint is false', () => {
    const program: SemanticConstraintProgram<'requires' | 'permits'> = {
      rules: [{
        id: 'permit-non-guest', priority: 1,
        when: [{ relation: 'requires', arguments: [variable('action'), variable('role')] }],
        constraints: [{ kind: 'not-equals', left: variable('role'), right: 'guest' }],
        then: [{ relation: 'permits', arguments: [variable('action'), variable('role')] }],
      }],
    };
    const judgment = semanticRewriteAuthority.resolveConstraints([relation('requires', 'edit', 'guest')], program);
    expect(judgment.facts).not.toContainEqual(relation('permits', 'edit', 'guest'));
  });

  it('never reports an exhausted round budget as a closed judgment', () => {
    const program: SemanticConstraintProgram<'requires' | 'permits'> = {
      rules: [{
        id: 'permit', priority: 1,
        when: [{ relation: 'requires', arguments: [variable('action'), variable('role')] }],
        constraints: [],
        then: [{ relation: 'permits', arguments: [variable('action'), variable('role')] }],
      }],
    };
    const judgment = semanticRewriteAuthority.resolveConstraints([relation('requires', 'edit', 'admin')], program, 0);
    expect(judgment.kind).toBe('semantic_constraint_judgment');
    expect(judgment.status).toBe('incomplete');
    expect(judgment.closed).toBe(false);
    expect(judgment.saturated).toBe(false);
  });
});
