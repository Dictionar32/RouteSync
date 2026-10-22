import { describe, expect, it } from 'vitest';
import { phpParameterTypeAlgebra } from '../phpParameterTypeAlgebra';
import { phpTypeAtomAlgebra } from '../phpTypeAtomAlgebra';
import { phpTypeExpressionAlgebra } from '../phpTypeExpressionAlgebra';

describe('PHP type atom judgment phase 1480', () => {
  it('distinguishes context-dependent names from missing canonical vocabulary', () => {
    expect(phpTypeAtomAlgebra.resolve({ source: 'self' })).toMatchObject({
      kind: 'unsupported', source: 'self', reason: 'context_required',
    });
    expect(phpTypeAtomAlgebra.resolve({ source: 'parent' })).toMatchObject({
      kind: 'unsupported', source: 'parent', reason: 'context_required',
    });
    expect(phpTypeAtomAlgebra.resolve({ source: 'static' })).toMatchObject({
      kind: 'unsupported', source: 'static', reason: 'context_required',
    });
    expect(phpTypeAtomAlgebra.resolve({ source: 'void' })).toMatchObject({
      kind: 'unsupported', source: 'void', reason: 'missing_vocabulary',
    });
  });

  it('keeps unsupported semantic evidence distinct through expression composition', () => {
    expect(phpTypeExpressionAlgebra.resolve({ source: 'self|null' })).toMatchObject({
      kind: 'unsupported', source: 'self', reason: 'context_required',
    });
    expect(phpTypeExpressionAlgebra.resolve({ source: 'Customer|callable' })).toMatchObject({
      kind: 'unsupported', source: 'callable', reason: 'missing_vocabulary',
    });
  });

  it('preserves unsupported judgments through named and nullable parameter evidence', () => {
    expect(phpParameterTypeAlgebra.resolve({ kind: 'named', name: 'self' })).toMatchObject({
      kind: 'unsupported', source: 'self', reason: 'context_required',
    });
    expect(phpParameterTypeAlgebra.resolve({
      kind: 'nullable', inner: { kind: 'named', name: 'parent' },
    })).toMatchObject({ kind: 'unsupported', source: 'parent', reason: 'context_required' });
  });


  it('resolves self and parent only from explicit upstream class-context evidence', () => {
    expect(phpTypeAtomAlgebra.resolve({
      source: 'self', classContext: { enclosingClass: 'App\\Models\\Order' },
    })).toMatchObject({ kind: 'resolved', expression: { kind: 'reference', value: { kind: 'class' } } });
    expect(phpTypeAtomAlgebra.resolve({
      source: 'parent', classContext: { enclosingClass: 'App\\Models\\Order', parentClass: 'App\\Models\\BaseModel' },
    })).toMatchObject({ kind: 'resolved', expression: { kind: 'reference', value: { kind: 'class' } } });
    expect(phpTypeExpressionAlgebra.resolve({
      source: 'self|Customer', classContext: { enclosingClass: 'App\\Models\\Order' },
    })).toMatchObject({ kind: 'resolved', expression: { kind: 'union' } });
  });

  it('propagates class context through nullable parameter evidence', () => {
    expect(phpParameterTypeAlgebra.resolve({
      kind: 'nullable',
      classContext: { enclosingClass: 'App\\Models\\Order' },
      inner: { kind: 'named', name: 'self' },
    })).toMatchObject({ kind: 'resolved', expression: { kind: 'nullable' } });
  });

  it('reserves malformed for invalid atom syntax rather than unsupported vocabulary', () => {
    expect(phpTypeAtomAlgebra.resolve({ source: 'Bad Type' })).toMatchObject({
      kind: 'malformed', reason: 'invalid_atom',
    });
    expect(phpTypeAtomAlgebra.resolve({ source: 'callable' }).kind).toBe('unsupported');
  });
});
