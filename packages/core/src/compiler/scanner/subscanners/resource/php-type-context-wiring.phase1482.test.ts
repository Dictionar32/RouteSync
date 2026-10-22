import { describe, expect, it } from 'vitest';
import { resolveParameterType } from '../../lexer/routeAst/phpAstExpressionMappings';
import type { PhpTypeClassContext } from '../../../../types/upstream/phpTypeAtomInterface';
import type { PhpParameterTypeAst } from '../../lexer/phpMethodAstTypes';

const context: PhpTypeClassContext = {
  enclosingClass: 'App\\Http\\Resources\\ProductResource',
  parentClass: 'Illuminate\\Http\\Resources\\Json\\JsonResource',
};

const named = (name: string): PhpParameterTypeAst => ({ kind: 'named', name });

 describe('PHP type context wiring phase 1482', () => {
  it('resolves self from enclosing class evidence', () => {
    const result = resolveParameterType(named('self'), undefined, undefined, context);
    expect(result).toMatchObject({
      kind: 'reference',
      value: { kind: 'class', name: { value: { value: 'App\\Http\\Resources\\ProductResource' } } },
    });
  });

  it('resolves parent from declared base-class evidence', () => {
    const result = resolveParameterType(named('parent'), undefined, undefined, context);
    expect(result).toMatchObject({
      kind: 'reference',
      value: { kind: 'class', name: { value: { value: 'Illuminate\\Http\\Resources\\Json\\JsonResource' } } },
    });
  });

  it('does not silently classify static as an ordinary class reference', () => {
    const result = resolveParameterType(named('static'), undefined, undefined, context);
    expect(result).toMatchObject({ kind: 'error' });
    expect(JSON.stringify(result)).toContain('late-static');
  });

  it('preserves context through nullable evidence', () => {
    const result = resolveParameterType({ kind: 'nullable', inner: named('self') }, undefined, undefined, context);
    expect(result).toMatchObject({
      kind: 'nullable',
      value: { kind: 'reference', value: { kind: 'class', name: { value: { value: 'App\\Http\\Resources\\ProductResource' } } } },
    });
  });
});
