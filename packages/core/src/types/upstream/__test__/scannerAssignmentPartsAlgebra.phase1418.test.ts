import { describe, expect, it } from 'vitest';
import { relationNone, relationSome } from '../../../semantic/relations/relationalSequence';
import { scannerAssignmentPartsAlgebra, type AssignmentOperatorRule } from '../scannerAssignmentPartsAlgebra';
import { scannerTokenStructureAlgebra } from '../scannerTokenStructureAlgebra';

type OperatorKind = 'set' | 'add';
const operators: readonly AssignmentOperatorRule<OperatorKind>[] = [
  { token: '+=', kind: 'add' },
  { token: '=', kind: 'set' },
];

const resolve = (tokens: readonly string[]) => scannerAssignmentPartsAlgebra.resolve({
  tokens,
  operators,
  tokenValue: token => token ?? '',
  findTopLevelOperator: (source, operator) => scannerTokenStructureAlgebra.findTopLevel({ tokens: source, target: operator, tokenValue: token => token }),
  classifyTarget: target => {
    const candidate = target[0];
    return target.length === 1 && candidate?.startsWith('$') ? relationSome(candidate) : relationNone();
  },
  classifyValue: value => value.join(''),
  slice: (source, start, end = source.length) => source.slice(start, end),
});

describe('scannerAssignmentPartsAlgebra phase 1418', () => {
  it('selects the compound operator and preserves the right-hand value', () => {
    expect(resolve(['$count', '+=', '1'])).toEqual({
      kind: 'resolved',
      tokenIndex: 1,
      value: { target: '$count', operator: { kind: 'add' }, reference: { kind: 'by_value' }, value: '1' },
    });
  });

  it('recognizes reference assignment and removes the reference marker from the value', () => {
    expect(resolve(['$copy', '=', '&', '$source'])).toEqual({
      kind: 'resolved',
      tokenIndex: 1,
      value: { target: '$copy', operator: { kind: 'set' }, reference: { kind: 'by_reference' }, value: '$source' },
    });
  });

  it('returns an explicit malformed result for unbalanced token structure', () => {
    expect(resolve(['$count', '=', '(', '1'])).toEqual({ kind: 'malformed', index: 4, expected: ')', actual: '<end-of-input>' });
  });

  it('rejects assignments without a valid target or right-hand value', () => {
    expect(resolve(['=', '1'])).toEqual({ kind: 'unresolved', reason: 'invalid_operator_position' });
    expect(resolve(['$count', '='])).toEqual({ kind: 'unresolved', reason: 'invalid_operator_position' });
    expect(resolve(['$count', '+', '1'])).toEqual({ kind: 'unresolved', reason: 'no_assignment_operator' });
  });
});
