import { describe, expect, it } from 'vitest';
import { semanticDecisionAlgebra } from '../semanticDecisionAlgebra';
import type { SemanticDecisionContract } from '../semanticDecisionInterface';

const INAPPLICABLE = Symbol('test.inapplicable');
const FIRST = Symbol('test.first');
const SECOND = Symbol('test.second');
type Input = Readonly<{ readonly candidate: boolean }>;
type Output = Readonly<{ readonly value: 'derived' }>;
const contract = (rules: SemanticDecisionContract<Input, Output>['rules'], precedence: SemanticDecisionContract<Input, Output>['precedence'] = []): SemanticDecisionContract<Input, Output> => ({
  kind: 'semantic_decision_contract', authority: 'upstream', closed: true, selection: 'first_proven_by_precedence', rules, precedence,
});

describe('semantic decision algebra phase 1458 typed identity and precedence contract', () => {
  it('does not derive a rule when its applicability judgment is negative', () => {
    let derivations = 0;
    const judgment = semanticDecisionAlgebra.resolve(contract([{
      id: INAPPLICABLE,
      applies: () => ({ kind: 'none' }),
      derive: () => {
        derivations += 1;
        return { kind: 'some', value: { value: 'derived' } };
      },
    }]), { candidate: false });
    expect(judgment).toEqual({ kind: 'not_derived', proof: { kind: 'semantic_decision_proof', selection: 'first_proven_by_precedence', orderedRuleIds: [INAPPLICABLE], precedence: [], evaluated: [{ rule: INAPPLICABLE, ordinal: 0, applicability: 'not_applicable', derivation: 'not_attempted' }], ruleCount: 1, termination: 'exhausted', complete: true } });
    expect(derivations).toBe(0);
  });

  it('validates rule callbacks before invoking semantic reasoning', () => {
    const invalid = {
      id: INAPPLICABLE,
      applies: undefined,
      derive: () => ({ kind: 'some', value: { value: 'derived' } }),
    } as unknown as SemanticDecisionContract<Input, Output>['rules'][number];
    expect(semanticDecisionAlgebra.resolve(contract([invalid]), { candidate: true })).toEqual({
      kind: 'contract_violation', reason: 'invalid_rule_contract',
    });
  });

  it('uses explicit precedence relations rather than numeric priority or array order', () => {
    const result = semanticDecisionAlgebra.resolve(contract([
      { id: SECOND, applies: () => ({ kind: 'some', value: true as const }), derive: () => ({ kind: 'some', value: { value: 'derived' as const } }) },
      { id: FIRST, applies: () => ({ kind: 'some', value: true as const }), derive: () => ({ kind: 'some', value: { value: 'derived' as const } }) },
    ], [{ before: FIRST, after: SECOND }]), { candidate: true });
    expect(result).toEqual({ kind: 'derived', rule: FIRST, value: { value: 'derived' }, proof: { kind: 'semantic_decision_proof', selection: 'first_proven_by_precedence', orderedRuleIds: [FIRST, SECOND], precedence: [{ before: FIRST, after: SECOND }], evaluated: [{ rule: FIRST, ordinal: 0, applicability: 'applicable', derivation: 'selected' }], ruleCount: 2, termination: 'selected', complete: true } });
  });

  it('verifies the proof snapshot without re-running semantic rule callbacks', () => {
    let evaluations = 0;
    const declared = contract([{
      id: FIRST,
      applies: () => ({ kind: 'some', value: true as const }),
      derive: () => { evaluations += 1; return { kind: 'some', value: { value: 'derived' as const } }; },
    }]);
    const judgment = semanticDecisionAlgebra.resolve(declared, { candidate: true });
    expect(semanticDecisionAlgebra.verifyProof(declared, judgment)).toEqual({ kind: 'valid' });
    expect(evaluations).toBe(1);
    if (judgment.kind !== 'derived') throw new Error('expected derived judgment');
    const tampered = { ...judgment, proof: { ...judgment.proof, orderedRuleIds: [SECOND] } };
    expect(semanticDecisionAlgebra.verifyProof(declared, tampered)).toEqual({ kind: 'invalid', reason: 'rule_order_mismatch' });
    expect(evaluations).toBe(1);
  });

  it('rejects an ambiguous precedence relation instead of falling back to declaration order', () => {
    const result = semanticDecisionAlgebra.resolve(contract([
      { id: FIRST, applies: () => ({ kind: 'some', value: true as const }), derive: () => ({ kind: 'some', value: { value: 'derived' as const } }) },
      { id: SECOND, applies: () => ({ kind: 'some', value: true as const }), derive: () => ({ kind: 'some', value: { value: 'derived' as const } }) },
    ]), { candidate: true });
    expect(result).toEqual({ kind: 'contract_violation', reason: 'ambiguous_precedence' });
  });
});
