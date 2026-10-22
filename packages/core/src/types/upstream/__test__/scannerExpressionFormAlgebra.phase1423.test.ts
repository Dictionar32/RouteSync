import { describe, expect, it } from 'vitest';
import { scannerExpressionFormAlgebra } from '../scannerExpressionFormAlgebra';
import { scannerTokenStructureInterface } from '../scannerTokenStructureAlgebra';

describe('scannerExpressionFormAlgebra phase 1423', () => {
  const conditional = (values: readonly string[]) => scannerExpressionFormAlgebra.resolveConditional({
    tokens: values,
    tokenValue: token => token ?? '',
    collectTopLevelCandidates: (tokens, targets) => scannerTokenStructureInterface.locateTopLevelCandidates({ tokens, targets, tokenValue: token => token }),
  });

  it('resolves the matching colon after nested ternaries', () => {
    expect(conditional(['$a', '?', '$b', '?', '$c', ':', '$d', ':', '$e'])).toMatchObject({ kind: 'resolved', condition: ['$a'], consequent: ['$b', '?', '$c', ':', '$d'], alternative: ['$e'] });
  });

  it('returns not_found when no top-level question marker exists', () => {
    expect(conditional(['foo', '(', '$a', '?', '$b', ':', '$c', ')'])).toEqual({ kind: 'not_found' });
  });

  it('returns malformed when a conditional is missing its colon', () => {
    expect(conditional(['$a', '?', '$b'])).toMatchObject({ kind: 'malformed', location: { kind: 'token', evidence: '?' }, expected: ':', actual: '<end-of-expression>' });
  });

  it('resolves prefix operators from supplied language facts', () => {
    expect(scannerExpressionFormAlgebra.resolvePrefix({
      tokens: ['!', '$value'],
      rules: [{ token: '!', operator: 'logical_not' }, { token: '-', operator: 'negative' }],
      tokenValue: token => token ?? '',
    })).toEqual({ kind: 'resolved', operator: 'logical_not', index: 0 });
  });

  it('rejects a prefix operator with no operand', () => {
    expect(scannerExpressionFormAlgebra.resolvePrefix({
      tokens: ['!'],
      rules: [{ token: '!', operator: 'logical_not' }],
      tokenValue: token => token ?? '',
    })).toEqual({ kind: 'contract_violation', reason: 'missing_operand' });
  });
});
