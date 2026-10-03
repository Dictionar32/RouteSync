import { describe, expectTypeOf, it } from 'vitest';
import type {
  ControllerRequestBindingContract,
  ControllerRouteParameterBindingContract,
  ControllerRouteFlowSurface,
} from '../controller';
import type { ControllerRequestBindingKind } from '../request';
import type { ControllerRouteParameterBindingKind } from '../route';
import type { ControllerRequestBindingContract as LegacyRequestBindingContract, ControllerRouteParameterBindingContract as LegacyRouteBindingContract } from '../highLevelContracts';

describe('controller flow upstream ownership phase 44', () => {
  it('owns request binding ADT in request.ts', () => {
    expectTypeOf<ControllerRequestBindingContract['kind']>().toEqualTypeOf<ControllerRequestBindingKind>();
  });

  it('owns route binding ADT in route.ts', () => {
    expectTypeOf<ControllerRouteParameterBindingContract['kind']>().toEqualTypeOf<ControllerRouteParameterBindingKind>();
  });

  it('keeps legacy high-level imports as compatibility aliases', () => {
    expectTypeOf<LegacyRequestBindingContract>().toEqualTypeOf<ControllerRequestBindingContract>();
    expectTypeOf<LegacyRouteBindingContract>().toEqualTypeOf<ControllerRouteParameterBindingContract>();
  });

  it('keeps the route flow surface passive', () => {
    expectTypeOf<ControllerRouteFlowSurface['routes']>().toMatchTypeOf<readonly unknown[]>();
  });
});
