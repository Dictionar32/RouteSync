import { describe, expectTypeOf, it } from 'vitest';
import type {
  ControllerExpression,
  ControllerRuntimeReturn,
  ControllerPropertyPath,
} from '../controllerExpression';
import type { VariableName, PropertyName } from '../names';
import type { Expression } from '../expression';

describe('controller expression upstream ownership phase 41', () => {
  it('owns the controller expression ADT upstream', () => {
    expectTypeOf<Extract<ControllerExpression, { readonly kind: 'variable' }>['name']>()
      .toEqualTypeOf<VariableName>();
  });

  it('keeps runtime return as a passive upstream value', () => {
    expectTypeOf<ControllerRuntimeReturn['kind']>().toEqualTypeOf<'none' | 'expressions'>();
    expectTypeOf<Extract<ControllerRuntimeReturn, { readonly kind: 'expressions' }>['expressions']>()
      .toEqualTypeOf<readonly Expression[]>();
  });

  it('keeps property paths made from upstream names', () => {
    expectTypeOf<ControllerPropertyPath['root']>().toEqualTypeOf<VariableName>();
    expectTypeOf<ControllerPropertyPath['steps']>().toEqualTypeOf<readonly PropertyName[]>();
  });
});
