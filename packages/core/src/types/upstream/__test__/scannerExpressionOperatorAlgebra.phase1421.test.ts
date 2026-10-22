import { describe, expect, it } from 'vitest';
import { scannerExpressionOperatorAlgebra } from '../scannerExpressionOperatorAlgebra';
import {
  EXPRESSION_ASSOCIATIVITY_LEFT,
  EXPRESSION_ASSOCIATIVITY_NON_ASSOCIATIVE,
  EXPRESSION_ASSOCIATIVITY_RIGHT,
  EXPRESSION_OPERATOR_CONTRACT_VIOLATION,
  EXPRESSION_OPERATOR_MALFORMED,
  EXPRESSION_OPERATOR_NOT_FOUND,
  EXPRESSION_OPERATOR_PRECEDENCE_CYCLE,
  EXPRESSION_OPERATOR_PRECEDENCE_INCOMPARABLE,
  EXPRESSION_OPERATOR_RESOLVED,
} from '../scannerExpressionOperatorInterface';
import { scannerTokenStructureInterface } from '../scannerTokenStructureAlgebra';
import type { ExpressionOperatorRule, ExpressionPrecedenceRelation } from '../scannerExpressionOperatorInterface';

const WEAK: unique symbol = Symbol('test.precedence.weak');
const MEDIUM: unique symbol = Symbol('test.precedence.medium');
const STRONG: unique symbol = Symbol('test.precedence.strong');
const POWER: unique symbol = Symbol('test.precedence.power');
type Tier = typeof WEAK | typeof MEDIUM | typeof STRONG | typeof POWER;
type Operator = Readonly<{ readonly identity: symbol }>;
const rules: readonly ExpressionOperatorRule<Operator, Tier>[] = [
  { token: '+', operator: { identity: Symbol('add') }, tier: MEDIUM, associativity: EXPRESSION_ASSOCIATIVITY_LEFT },
  { token: '-', operator: { identity: Symbol('subtract') }, tier: MEDIUM, associativity: EXPRESSION_ASSOCIATIVITY_LEFT },
  { token: '*', operator: { identity: Symbol('multiply') }, tier: STRONG, associativity: EXPRESSION_ASSOCIATIVITY_LEFT },
  { token: '**', operator: { identity: Symbol('power') }, tier: POWER, associativity: EXPRESSION_ASSOCIATIVITY_RIGHT },
  { token: '||', operator: { identity: Symbol('or') }, tier: WEAK, associativity: EXPRESSION_ASSOCIATIVITY_LEFT },
];
const precedence: readonly ExpressionPrecedenceRelation<Tier>[] = [
  { weaker: WEAK, stronger: MEDIUM },
  { weaker: MEDIUM, stronger: STRONG },
  { weaker: STRONG, stronger: POWER },
];
const resolve = (tokens: readonly string[]) => scannerExpressionOperatorAlgebra.resolve({
  tokens,
  rules,
  precedence,
  tokenValue: token => token,
  collectTopLevelCandidates: (source, targets) => scannerTokenStructureInterface.locateTopLevelCandidates({ tokens: source, targets, tokenValue: token => token }),
});

describe('scannerExpressionOperatorAlgebra typed precedence contract', () => {
  it('selects the weaker operator as root without numeric precedence', () => {
    expect(resolve(['$a', '+', '$b', '*', '$c'])).toMatchObject({ kind: EXPRESSION_OPERATOR_RESOLVED, token: '+', before: ['$a'], after: ['$b', '*', '$c'] });
  });
  it('selects the rightmost operator for left-associative chains', () => {
    expect(resolve(['$a', '-', '$b', '-', '$c'])).toMatchObject({ kind: EXPRESSION_OPERATOR_RESOLVED, token: '-', before: ['$a', '-', '$b'], after: ['$c'] });
  });
  it('selects the leftmost operator for right-associative chains', () => {
    expect(resolve(['$a', '**', '$b', '**', '$c'])).toMatchObject({ kind: EXPRESSION_OPERATOR_RESOLVED, token: '**', before: ['$a'], after: ['$b', '**', '$c'], associativity: EXPRESSION_ASSOCIATIVITY_RIGHT });
  });
  it('selects a lower-precedence coalescing tier through the typed relation', () => {
    expect(resolve(['$a', '||', '$b', '+', '$c'])).toMatchObject({ kind: EXPRESSION_OPERATOR_RESOLVED, token: '||', before: ['$a'], after: ['$b', '+', '$c'] });
  });
  it('ignores operators nested in calls and arrays', () => {
    expect(resolve(['call', '(', '$a', '+', '$b', ')', '*', '$c'])).toMatchObject({ kind: EXPRESSION_OPERATOR_RESOLVED, token: '*', before: ['call', '(', '$a', '+', '$b', ')'], after: ['$c'] });
  });
  it('propagates malformed delimiter evidence', () => {
    expect(resolve(['$a', '+', '(', '$b'])).toMatchObject({ kind: EXPRESSION_OPERATOR_MALFORMED, expected: ')', actual: '<end-of-input>' });
  });
  it('rejects conflicting associativity within a tier', () => {
    const invalidRules: readonly ExpressionOperatorRule<Operator, Tier>[] = [rules[0], { ...rules[1], associativity: EXPRESSION_ASSOCIATIVITY_RIGHT }];
    expect(scannerExpressionOperatorAlgebra.resolve({ tokens: ['a', '+', 'b'], rules: invalidRules, precedence, tokenValue: token => token, collectTopLevelCandidates: (source, targets) => scannerTokenStructureInterface.locateTopLevelCandidates({ tokens: source, targets, tokenValue: token => token }) })).toMatchObject({ kind: EXPRESSION_OPERATOR_CONTRACT_VIOLATION });
  });
  it('rejects incomparable precedence tiers', () => {
    expect(scannerExpressionOperatorAlgebra.resolve({ tokens: ['a', '+', 'b'], rules, precedence: [{ weaker: WEAK, stronger: MEDIUM }], tokenValue: token => token, collectTopLevelCandidates: (source, targets) => scannerTokenStructureInterface.locateTopLevelCandidates({ tokens: source, targets, tokenValue: token => token }) })).toMatchObject({ kind: EXPRESSION_OPERATOR_CONTRACT_VIOLATION, reason: EXPRESSION_OPERATOR_PRECEDENCE_INCOMPARABLE });
  });
  it('rejects precedence cycles', () => {
    expect(scannerExpressionOperatorAlgebra.resolve({ tokens: ['a', '+', 'b'], rules, precedence: [...precedence, { weaker: STRONG, stronger: WEAK }], tokenValue: token => token, collectTopLevelCandidates: (source, targets) => scannerTokenStructureInterface.locateTopLevelCandidates({ tokens: source, targets, tokenValue: token => token }) })).toMatchObject({ kind: EXPRESSION_OPERATOR_CONTRACT_VIOLATION, reason: EXPRESSION_OPERATOR_PRECEDENCE_CYCLE });
  });
  it('rejects an unparenthesized chain at a non-associative tier', () => {
    const comparisonRules: readonly ExpressionOperatorRule<Operator, Tier>[] = [
      { token: '<', operator: { identity: Symbol('less') }, tier: MEDIUM, associativity: EXPRESSION_ASSOCIATIVITY_NON_ASSOCIATIVE },
      { token: '>', operator: { identity: Symbol('greater') }, tier: MEDIUM, associativity: EXPRESSION_ASSOCIATIVITY_NON_ASSOCIATIVE },
    ];
    expect(scannerExpressionOperatorAlgebra.resolve({ tokens: ['$a', '<', '$b', '>', '$c'], rules: comparisonRules, precedence: [], tokenValue: token => token, collectTopLevelCandidates: (source, targets) => scannerTokenStructureInterface.locateTopLevelCandidates({ tokens: source, targets, tokenValue: token => token }) })).toMatchObject({ kind: EXPRESSION_OPERATOR_MALFORMED, expected: 'parenthesized expression for non-associative operators', actual: '>' });
  });
  it('returns not-found when no candidate operator exists', () => {
    expect(resolve(['$a', '$b'])).toEqual({ kind: EXPRESSION_OPERATOR_NOT_FOUND });
  });
});
