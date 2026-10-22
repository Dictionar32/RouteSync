import { describe, expect, it } from 'vitest';
import { scannerTokenStructureAlgebra } from '../scannerTokenStructureAlgebra';

const find = (tokens: readonly string[], target: string) => scannerTokenStructureAlgebra.findTopLevel({ tokens, target, tokenValue: token => token });

describe('scannerTokenStructureAlgebra phase 1419', () => {
  it('ignores target tokens nested in balanced delimiters', () => {
    expect(find(['$x', '=', 'call', '(', '$a', '=', '1', ')', '+', '2'], '=')).toEqual({ kind: 'found', index: 1 });
  });
  it('validates structure after a candidate operator before accepting it', () => {
    expect(find(['$x', '=', '(', '$y'], '=')).toEqual({ kind: 'malformed', index: 4, expected: ')', actual: '<end-of-input>' });
  });
  it('reports mismatched closing delimiters as malformed', () => {
    expect(find(['(', '$x', ']'], '=')).toEqual({ kind: 'malformed', index: 2, expected: ')', actual: ']' });
  });
  it('reports unclosed delimiters instead of treating them as ordinary absence', () => {
    expect(find(['(', '$x'], '=')).toEqual({ kind: 'malformed', index: 2, expected: ')', actual: '<end-of-input>' });
  });
  it('returns not_found for a structurally valid sequence without the target', () => {
    expect(find(['$x', '+', '1'], '=')).toEqual({ kind: 'not_found', index: 3 });
  });
});
