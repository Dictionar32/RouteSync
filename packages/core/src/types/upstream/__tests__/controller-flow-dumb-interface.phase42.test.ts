import { describe, expectTypeOf, it } from 'vitest';
import type {
  ControllerRequestBindingContract,
  ControllerRouteParameterBindingContract,
} from '../highLevelContracts';
import type { ControllerReference, ModelReference, RequestReference, RouteReference } from '../semanticReferences';
import type { RouteParameterName, VariableName } from '../names';

describe('controller flow dumb interface phase 42', () => {
  it('carries only references and resolved kind for request flow', () => {
    expectTypeOf<ControllerRequestBindingContract['route']>().toEqualTypeOf<RouteReference>();
    expectTypeOf<ControllerRequestBindingContract['controller']>().toEqualTypeOf<ControllerReference>();
    expectTypeOf<ControllerRequestBindingContract['parameter']>()
      .toEqualTypeOf<VariableName | { readonly kind: 'absent' }>();
    expectTypeOf<ControllerRequestBindingContract['request']>()
      .toEqualTypeOf<RequestReference | { readonly kind: 'absent' }>();
  });

  it('carries only references and resolved kind for route-parameter flow', () => {
    expectTypeOf<ControllerRouteParameterBindingContract['route']>().toEqualTypeOf<RouteReference>();
    expectTypeOf<ControllerRouteParameterBindingContract['controller']>().toEqualTypeOf<ControllerReference>();
    expectTypeOf<ControllerRouteParameterBindingContract['parameter']>().toEqualTypeOf<VariableName>();
    expectTypeOf<ControllerRouteParameterBindingContract['routeParameter']>().toEqualTypeOf<RouteParameterName>();
    expectTypeOf<ControllerRouteParameterBindingContract['model']>()
      .toEqualTypeOf<ModelReference | { readonly kind: 'absent' }>();
  });
});
