import { describe, expectTypeOf, it } from 'vitest';
import type { ControllerActionRouteFlowContract, ControllerRouteFlowSurface, LaravelSemanticContractCatalog } from '../highLevelContracts';
import type { Sequence } from '../collections';
import type { RouteReference } from '../semanticReferences';

describe('controller route flow interface phase 28', () => {
  it('keeps route binding as a passive upstream capability', () => {
    expectTypeOf<ControllerActionRouteFlowContract>().toExtend<ControllerRouteFlowSurface>();
    expectTypeOf<ControllerActionRouteFlowContract['routes']>().toEqualTypeOf<Sequence<RouteReference>>();
  });

  it('exposes the elevated flow beside the canonical controller contract', () => {
    expectTypeOf<LaravelSemanticContractCatalog['controllerFlows']>()
      .toEqualTypeOf<Sequence<ControllerActionRouteFlowContract>>();
  });
});
