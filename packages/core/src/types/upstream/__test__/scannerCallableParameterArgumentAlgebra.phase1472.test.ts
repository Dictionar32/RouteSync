import { describe, expect, it } from 'vitest';
import { scannerCallableListContractAlgebra } from '../scannerCallableListAlgebra';
import { scannerTokenStructureInterface } from '../scannerTokenStructureAlgebra';

type Token = Readonly<{ value: string; type: string }>;
const token = (value: string, type = value.startsWith('$') ? 'VARIABLE' : value === '...' ? 'ELLIPSIS' : /^[A-Za-z_]+$/.test(value) ? 'IDENTIFIER' : value === ':' ? 'COLON' : value === '=' ? 'ASSIGN' : 'PUNCTUATION'): Token => ({ value, type });
const values = (tokens: readonly Token[]) => tokens.map(item => item.value);

describe('callable parameter and argument contract phase 1472', () => {
  it('returns typed parameter evidence for defaults, references, and variadics', () => {
    const result = scannerCallableListContractAlgebra.resolveParameters({
      tokens: [token('int'), token('$id'), token('='), token('1'), token(','), token('&'), token('...'), token('$rest')],
      purpose: 'parameters', tokenValue: item => item.value, tokenKind: item => item.type, structure: scannerTokenStructureInterface,
    });
    expect(result.kind).toBe('resolved');
    if (result.kind !== 'resolved') return;
    expect(result.evidence).toHaveLength(2);
    expect(result.evidence[0]).toMatchObject({ variable: token('$id'), byReference: false, variadic: false });
    expect(values(result.evidence[0]!.defaultTokens ?? [])).toEqual(['1']);
    expect(result.evidence[1]).toMatchObject({ variable: token('$rest'), byReference: true, variadic: true });
  });

  it('rejects a parameter with no variable', () => {
    const result = scannerCallableListContractAlgebra.resolveParameters({
      tokens: [token('int')], purpose: 'parameters', tokenValue: item => item.value, tokenKind: item => item.type, structure: scannerTokenStructureInterface,
    });
    expect(result).toMatchObject({ kind: 'malformed', expected: 'exactly one parameter variable' });
  });

  it('rejects an empty default expression', () => {
    const result = scannerCallableListContractAlgebra.resolveParameters({
      tokens: [token('$id'), token('='), token(',')], purpose: 'parameters', tokenValue: item => item.value, tokenKind: item => item.type, structure: scannerTokenStructureInterface,
    });
    expect(result).toMatchObject({ kind: 'malformed', expected: 'non-empty default value' });
  });

  it('classifies named arguments through a closed judgment', () => {
    const result = scannerCallableListContractAlgebra.resolveArgument({
      tokens: [token('name'), token(':'), token('$value')], tokenValue: item => item.value, tokenKind: item => item.type,
    });
    expect(result).toMatchObject({ kind: 'resolved', evidence: { kind: 'named', name: token('name'), valueTokens: [token('$value')] } });
  });

  it('rejects unpacked arguments without an expression', () => {
    const result = scannerCallableListContractAlgebra.resolveArgument({
      tokens: [token('...')], tokenValue: item => item.value, tokenKind: item => item.type,
    });
    expect(result).toMatchObject({ kind: 'malformed', expected: 'expression after ...' });
  });
});
