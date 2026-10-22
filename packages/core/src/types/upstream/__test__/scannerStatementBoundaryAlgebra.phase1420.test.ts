import { describe, expect, it } from 'vitest';
import { scannerStatementBoundaryAlgebra } from '../scannerStatementBoundaryAlgebra';

const resolve = (tokens: readonly string[], start = 0) => scannerStatementBoundaryAlgebra.resolve({
  tokens,
  start,
  tokenValue: token => token,
});

describe('scannerStatementBoundaryAlgebra phase 1420', () => {
  it('finds a semicolon only outside nested delimiters', () => {
    expect(resolve(['call', '(', 'a', ';', 'b', ')', ';', 'tail'])).toEqual({
      kind: 'terminator', index: 6, state: { parentheses: 0, brackets: 0, braces: 0 },
    });
  });
  it('rejects an unexpected closer', () => {
    expect(resolve(['a', ')', ';'])).toEqual({
      kind: 'malformed', index: 1, actual: ')', reason: 'unexpected_closer',
    });
  });
  it('rejects mismatched nested delimiter kinds even if counts would balance', () => {
    expect(resolve(['(', '[', ')', ']', ';'])).toEqual({
      kind: 'malformed', index: 2, expected: ']', actual: ')', reason: 'mismatched_closer',
    });
  });
  it('rejects unclosed delimiters at end of input', () => {
    expect(resolve(['a', '{', 'b'])).toEqual({
      kind: 'malformed', index: 3, expected: '}', actual: '<end-of-input>', reason: 'unclosed_delimiter',
    });
  });
  it('rejects an invalid start cursor', () => {
    expect(resolve(['a'], -1)).toEqual({
      kind: 'malformed', index: -1, expected: '<valid-index>', actual: '-1', reason: 'invalid_start',
    });
  });
});
