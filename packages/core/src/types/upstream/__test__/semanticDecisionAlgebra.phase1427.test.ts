import { describe, expect, it } from 'vitest';
import { semanticDecisionAlgebra } from '../semanticDecisionAlgebra';
import type { SemanticDecisionContract } from '../semanticDecisionInterface';

const CALL = Symbol('test.call');
const ATOM = Symbol('test.atom');
type Input = Readonly<{ readonly expression: 'call' | 'atom' }>;
type Output = Readonly<{ readonly node: 'call' | 'atom' }>;
const callRule = {
  id: CALL, applies: (_input: Input) => ({ kind: 'some' as const, value: true as const }),
  derive: (input: Input) => input.expression === 'call' ? ({ kind: 'some' as const, value: { node: 'call' as const } }) : ({ kind: 'none' as const }),
};
const atomRule = {
  id: ATOM, applies: (_input: Input) => ({ kind: 'some' as const, value: true as const }),
  derive: (input: Input) => input.expression === 'atom' ? ({ kind: 'some' as const, value: { node: 'atom' as const } }) : ({ kind: 'none' as const }),
};
const precedence = [{ before: CALL, after: ATOM }] as const;
const contract = (rules: readonly (typeof callRule | typeof atomRule)[]): SemanticDecisionContract<Input, Output> => ({
  kind: 'semantic_decision_contract', authority: 'upstream', closed: true, selection: 'first_proven_by_precedence', rules, precedence,
});

describe('semantic decision algebra typed precedence', () => {
  it('uses declared precedence rather than declaration order', () => {
    expect(semanticDecisionAlgebra.resolve(contract([atomRule, callRule]), { expression: 'call' })).toEqual({
      kind: 'derived', rule: CALL, value: { node: 'call' }, proof: { kind: 'semantic_decision_proof', selection: 'first_proven_by_precedence', orderedRuleIds: [CALL, ATOM], precedence: [{ before: CALL, after: ATOM }], evaluated: [{ rule: CALL, ordinal: 0, applicability: 'applicable', derivation: 'selected' }], ruleCount: 2, termination: 'selected', complete: true },
    });
  });
  it('continues to later rule when earlier derivation is not applicable to the source', () => {
    expect(semanticDecisionAlgebra.resolve(contract([callRule, atomRule]), { expression: 'atom' })).toEqual({
      kind: 'derived', rule: ATOM, value: { node: 'atom' }, proof: { kind: 'semantic_decision_proof', selection: 'first_proven_by_precedence', orderedRuleIds: [CALL, ATOM], precedence: [{ before: CALL, after: ATOM }], evaluated: [{ rule: CALL, ordinal: 0, applicability: 'applicable', derivation: 'no_result' }, { rule: ATOM, ordinal: 1, applicability: 'applicable', derivation: 'selected' }], ruleCount: 2, termination: 'selected', complete: true },
    });
  });
  it('rejects duplicate rule identity', () => {
    expect(semanticDecisionAlgebra.resolve(contract([callRule, { ...atomRule, id: CALL }]), { expression: 'call' })).toEqual({
      kind: 'contract_violation', reason: 'duplicate_rule_id',
    });
  });
});
