import { describe, expect, it } from 'vitest';
import { scannerTokenStructureAlgebra } from '../scannerTokenStructureAlgebra';

const findClose = (tokens: readonly string[], index: number) => scannerTokenStructureAlgebra.findMatchingClose({ tokens, index, tokenValue: token => token });
const findOpen = (tokens: readonly string[], index: number) => scannerTokenStructureAlgebra.findMatchingOpen({ tokens, index, tokenValue: token => token });

describe('scannerTokenStructureAlgebra phase 1438 delimiter evidence', () => {
  it('finds a matching close for a valid nested delimiter sequence', () => {
    expect(findClose(['call', '(', '[', 'x', ']', ')'], 1)).toEqual({ kind: 'found', index: 5 });
  });

  it('returns malformed evidence for a mismatched close', () => {
    expect(findClose(['(', 'x', ']'], 0)).toEqual({ kind: 'malformed', index: 2, expected: ')', actual: ']' });
  });

  it('returns malformed evidence when the matching close is missing', () => {
    expect(findClose(['call', '(', 'x'], 1)).toEqual({ kind: 'malformed', index: 3, expected: ')', actual: '<end-of-input>' });
  });

  it('finds the matching open for a nested array access', () => {
    expect(findOpen(['$items', '[', '$nested', '[', '0', ']', ']'], 6)).toEqual({ kind: 'found', index: 1 });
  });

  it('returns malformed evidence for an unmatched opener while scanning backward', () => {
    expect(findOpen(['[', '(', ']'], 2)).toEqual({ kind: 'malformed', index: 1, expected: '[', actual: '(' });
  });

  it('returns not_found when the requested closing token is not a delimiter', () => {
    expect(findOpen(['$items', '0'], 1)).toEqual({ kind: 'not_found', index: 1 });
  });
});
