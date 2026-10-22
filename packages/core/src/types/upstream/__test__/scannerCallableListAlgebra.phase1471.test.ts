import { describe, expect, it } from 'vitest';
import { scannerCallableListContractAlgebra } from '../scannerCallableListAlgebra';
import { scannerTokenStructureInterface } from '../scannerTokenStructureAlgebra';

type Token = Readonly<{ value: string; type: string }>;
const tokens = (values: readonly string[]): readonly Token[] => values.map(value => ({ value, type: value.startsWith('$') ? 'VARIABLE' : value === '&' ? 'AMPERSAND' : 'PUNCTUATION' }));
const listQuery = (values: readonly string[]) => ({
  tokens: tokens(values), purpose: 'arguments' as const, tokenValue: (token: Token) => token.value, structure: scannerTokenStructureInterface,
});

describe('scanner callable-list contract algebra phase 1471', () => {
  it('partitions commas only at the top level', () => {
    expect(scannerCallableListContractAlgebra.resolveList(listQuery(['call', '(', '$x', ',', '$y', ')'])).kind).toBe('resolved');
    const result = scannerCallableListContractAlgebra.resolveList(listQuery(['$x', ',', 'g', '(', '$y', ',', '$z', ')']));
    expect(result).toMatchObject({ kind: 'resolved', evidence: { parts: [[{ value: '$x' }], [{ value: 'g' }, { value: '(' }, { value: '$y' }, { value: ',' }, { value: '$z' }, { value: ')' }]] } });
  });
  it('accepts a trailing comma but rejects an empty leading element', () => {
    expect(scannerCallableListContractAlgebra.resolveList(listQuery(['$x', ','])).kind).toBe('resolved');
    expect(scannerCallableListContractAlgebra.resolveList(listQuery([',', '$x'])).kind).toBe('malformed');
  });
  it('produces typed capture evidence for value and reference captures', () => {
    const result = scannerCallableListContractAlgebra.resolveCaptures({
      tokens: tokens(['&', '$left', ',', '$right']), purpose: 'captures',
      tokenValue: token => token.value, tokenKind: token => token.type, structure: scannerTokenStructureInterface,
    });
    expect(result).toMatchObject({ kind: 'resolved', evidence: [{ byReference: true, token: { value: '$left' } }, { byReference: false, token: { value: '$right' } }] });
  });
  it('rejects unbalanced delimiters and malformed capture entries', () => {
    expect(scannerCallableListContractAlgebra.resolveList(listQuery(['f', '(', '$x'])).kind).toBe('malformed');
    expect(scannerCallableListContractAlgebra.resolveCaptures({
      tokens: tokens(['$x', '$y']), purpose: 'captures', tokenValue: token => token.value,
      tokenKind: token => token.type, structure: scannerTokenStructureInterface,
    }).kind).toBe('malformed');
  });
});
