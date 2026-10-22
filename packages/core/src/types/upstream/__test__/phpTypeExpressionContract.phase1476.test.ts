import { describe, expect, it } from 'vitest';
import { phpTypeExpressionAlgebra } from '../phpTypeExpressionAlgebra';

describe('PHP type expression contract phase 1476', () => {
  const resolve = (source: string) => phpTypeExpressionAlgebra.resolve({ source });

  it('accepts explicitly parenthesized DNF intersection members', () => {
    expect(resolve('(Customer&Countable)|Invoice').kind).toBe('resolved');
    expect(resolve('Customer|(Invoice&Countable)').kind).toBe('resolved');
  });

  it('rejects unparenthesized union/intersection mixtures', () => {
    expect(resolve('Customer|Invoice&Countable')).toMatchObject({ kind: 'malformed' });
  });

  it('rejects intersection containing a union instead of silently reinterpreting it', () => {
    expect(resolve('Customer&(Invoice|Countable)')).toMatchObject({ kind: 'malformed' });
  });

  it('rejects nullable-prefix combinations that PHP grammar does not permit', () => {
    expect(resolve('?Customer|Invoice')).toMatchObject({ kind: 'malformed' });
    expect(resolve('?Customer&Countable')).toMatchObject({ kind: 'malformed' });
    expect(resolve('??Customer')).toMatchObject({ kind: 'malformed' });
  });

  it('distinguishes unsupported native atoms from malformed grammar', () => {
    for (const source of ['void', 'null', 'true', 'false', 'iterable', 'resource', 'callable']) {
      expect(resolve(source), source).toMatchObject({ kind: 'unsupported', reason: 'missing_vocabulary' });
    }
    for (const source of ['self', 'parent', 'static']) {
      expect(resolve(source), source).toMatchObject({ kind: 'unsupported', reason: 'context_required' });
    }
  });

  it('preserves supported primitive, named, nullable, and array forms', () => {
    expect(resolve('int').kind).toBe('resolved');
    expect(resolve('\\App\\Models\\Customer').kind).toBe('resolved');
    expect(resolve('?Customer').kind).toBe('resolved');
    expect(resolve('Customer[]').kind).toBe('resolved');
  });
});
