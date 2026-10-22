import { describe, expect, it } from 'vitest';
import { scannerTokenStructureAlgebra } from '../scannerTokenStructureAlgebra';

const collect = (tokens: readonly string[], targets: readonly string[]) => scannerTokenStructureAlgebra.findTopLevelCandidates({ tokens, targets, tokenValue: token => token });

describe('scannerTokenStructureAlgebra candidate collection phase 1421', () => {
  it('collects every matching top-level operator in source order', () => {
    expect(collect(['$a', '+', 'call', '(', '$x', '+', '$y', ')', '*', '$b'], ['+', '*'])).toEqual({
      kind: 'complete', matches: [{ token: '+', index: 1 }, { token: '*', index: 8 }],
    });
  });
  it('returns an empty candidate list for valid structure without matches', () => {
    expect(collect(['call', '(', '$x', ')'], ['+', '*'])).toEqual({ kind: 'complete', matches: [] });
  });
  it('rejects malformed delimiters even when no target was found first', () => {
    expect(collect(['$a', '(', '$b', ']'], ['+'])).toMatchObject({ kind: 'malformed', index: 3, expected: ')', actual: ']' });
  });
});
