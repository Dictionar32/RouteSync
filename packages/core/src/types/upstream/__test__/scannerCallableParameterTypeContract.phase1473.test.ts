import { describe, expect, it } from 'vitest';
import { scannerCallableListContractAlgebra } from '../scannerCallableListAlgebra';
import { scannerTokenStructureInterface } from '../scannerTokenStructureAlgebra';

type Token = Readonly<{ value: string; type: string }>;
const token = (value: string, type = value.startsWith('$') ? 'VARIABLE' : /^[A-Za-z_]+$/.test(value) ? 'IDENTIFIER' : 'PUNCTUATION'): Token => ({ value, type });
const resolve = (tokens: readonly Token[]) => scannerCallableListContractAlgebra.resolveParameters({
  tokens, purpose: 'parameters', tokenValue: item => item.value, tokenKind: item => item.type, structure: scannerTokenStructureInterface,
});

describe('callable parameter type contract phase 1473', () => {
  it('preserves primitive and nullable named type evidence', () => {
    const result = resolve([token('int'), token('$id'), token(','), token('?'), token('Customer'), token('$customer')]);
    expect(result.kind).toBe('resolved');
    if (result.kind !== 'resolved') return;
    expect(result.evidence[0]?.typeEvidence).toEqual({ kind: 'primitive', name: 'int' });
    expect(result.evidence[1]?.typeEvidence).toEqual({ kind: 'nullable', inner: { kind: 'named', nameTokens: [token('Customer')] } });
  });

  it('preserves fully qualified type name evidence', () => {
    const result = resolve([token('\\'), token('App'), token('\\'), token('Models'), token('\\'), token('Customer'), token('$customer')]);
    expect(result.kind).toBe('resolved');
    if (result.kind !== 'resolved') return;
    expect(result.evidence[0]?.typeEvidence).toMatchObject({ kind: 'named', nameTokens: [token('\\'), token('App'), token('\\'), token('Models'), token('\\'), token('Customer')] });
  });

  it('rejects adjacent identifiers that do not form a qualified type name', () => {
    expect(resolve([token('Customer'), token('Invoice'), token('$model')])).toMatchObject({ kind: 'malformed', expected: 'supported parameter type (primitive, named, or nullable)' });
  });

  it('rejects unsupported union type evidence instead of silently erasing it', () => {
    expect(resolve([token('Customer'), token('|'), token('Invoice'), token('$model')])).toMatchObject({ kind: 'malformed', expected: 'supported parameter type (primitive, named, or nullable)' });
  });
});
