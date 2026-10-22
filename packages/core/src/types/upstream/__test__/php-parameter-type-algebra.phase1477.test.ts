import { describe, expect, it } from 'vitest';
import { phpParameterTypeAlgebra } from '../phpParameterTypeAlgebra';

describe('PHP parameter type algebra phase 1477', () => {
  it('maps primitive type evidence to canonical semantic vocabulary', () => {
    expect(phpParameterTypeAlgebra.resolve({ kind: 'primitive', name: 'int' })).toMatchObject({ kind: 'resolved', expression: { kind: 'primitive', value: { kind: 'number' } } });
    expect(phpParameterTypeAlgebra.resolve({ kind: 'primitive', name: 'bool' })).toMatchObject({ kind: 'resolved', expression: { kind: 'primitive', value: { kind: 'boolean' } } });
    expect(phpParameterTypeAlgebra.resolve({ kind: 'primitive', name: 'array' })).toMatchObject({ kind: 'resolved', expression: { kind: 'primitive', value: { kind: 'json' } } });
  });


  it('shares canonical PHP primitive semantics with property type expressions', async () => {
    const { phpTypeExpressionAlgebra } = await import('../phpTypeExpressionAlgebra');
    for (const name of ['string', 'int', 'float', 'bool', 'mixed', 'array'] as const) {
      const parameter = phpParameterTypeAlgebra.resolve({ kind: 'primitive', name });
      const property = phpTypeExpressionAlgebra.resolve({ source: name });
      expect(parameter).toEqual(property);
    }
  });

  it('resolves nested nullable named types once in upstream algebra', () => {
    expect(phpParameterTypeAlgebra.resolve({ kind: 'nullable', inner: { kind: 'named', name: 'App\\Models\\Customer' } })).toMatchObject({ kind: 'resolved', expression: { kind: 'nullable', value: { kind: 'reference', value: { kind: 'class', name: { kind: 'class_name', value: { kind: 'string_value', value: 'App\\Models\\Customer' } } } } } });
  });

  it('returns a closed malformed judgment for empty named evidence', () => {
    expect(phpParameterTypeAlgebra.resolve({ kind: 'named', name: '  ' })).toMatchObject({ kind: 'malformed' });
  });
});
