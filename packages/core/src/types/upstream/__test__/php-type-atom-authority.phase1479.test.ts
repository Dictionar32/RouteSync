import { describe, expect, it } from 'vitest';
import { phpTypeAtomAlgebra } from '../phpTypeAtomAlgebra';
import { phpTypeExpressionAlgebra } from '../phpTypeExpressionAlgebra';
import { phpParameterTypeAlgebra } from '../phpParameterTypeAlgebra';

describe('PHP type atom authority phase 1479', () => {
  it('owns canonical primitive semantics independently of grammar composition', () => {
    const cases = [
      ['string', { kind: 'primitive', value: { kind: 'string' } }],
      ['int', { kind: 'primitive', value: { kind: 'integer' } }],
      ['float', { kind: 'primitive', value: { kind: 'decimal' } }],
      ['bool', { kind: 'primitive', value: { kind: 'boolean' } }],
      ['array', { kind: 'primitive', value: { kind: 'json' } }],
      ['mixed', { kind: 'mixed' }],
      ['never', { kind: 'uninhabited' }],
    ] as const;
    for (const [source, expression] of cases) {
      expect(phpTypeAtomAlgebra.resolve({ source })).toEqual({ kind: 'resolved', expression });
    }
  });

  it('preserves PHP integer and decimal identity before target projection', () => {
    expect(phpTypeAtomAlgebra.resolve({ source: 'int' })).toEqual({
      kind: 'resolved', expression: { kind: 'primitive', value: { kind: 'integer' } },
    });
    expect(phpTypeAtomAlgebra.resolve({ source: 'float' })).toEqual({
      kind: 'resolved', expression: { kind: 'primitive', value: { kind: 'decimal' } },
    });
  });

  it('shares one atom judgment across parameter and expression consumers', () => {
    for (const name of ['string', 'int', 'float', 'bool', 'mixed', 'array'] as const) {
      const atom = phpTypeAtomAlgebra.resolve({ source: name });
      const parameter = phpParameterTypeAlgebra.resolve({ kind: 'primitive', name });
      const expression = phpTypeExpressionAlgebra.resolve({ source: name });
      expect(parameter).toEqual(atom);
      expect(expression).toEqual(atom);
    }
  });

  it('fails closed without conflating unsupported semantics with malformed atoms', () => {
    for (const source of ['void', 'null', 'true', 'false', 'iterable', 'resource', 'callable']) {
      expect(phpTypeAtomAlgebra.resolve({ source }).kind).toBe('unsupported');
    }
    for (const source of ['self', 'parent', 'static']) {
      expect(phpTypeAtomAlgebra.resolve({ source })).toMatchObject({ kind: 'unsupported', reason: 'context_required' });
    }
    expect(phpTypeAtomAlgebra.resolve({ source: 'Bad Type' })).toMatchObject({ kind: 'malformed', reason: 'invalid_atom' });
  });

  it('resolves qualified class names through the same atom authority', () => {
    expect(phpTypeAtomAlgebra.resolve({ source: '\\App\\Models\\Customer' })).toMatchObject({
      kind: 'resolved', expression: { kind: 'reference', value: { kind: 'class' } },
    });
  });
});
