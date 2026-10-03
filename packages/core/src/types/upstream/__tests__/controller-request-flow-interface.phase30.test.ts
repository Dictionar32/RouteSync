import { describe, expectTypeOf, it } from 'vitest';
import type {
  ControllerActionRouteFlowContract,
  ControllerRequestBindingContract,
  ControllerRequestFlowSurface,
  LaravelSemanticContractCatalog,
} from '../highLevelContracts';
import type { Sequence } from '../collections';

describe('phase30 controller request flow interface', () => {
  it('keeps request flow passive at the interface boundary', () => {
    expectTypeOf<ControllerActionRouteFlowContract>().toExtend<ControllerRequestFlowSurface>();
    expectTypeOf<ControllerActionRouteFlowContract['requestBindings']>()
      .toEqualTypeOf<Sequence<ControllerRequestBindingContract>>();
    expectTypeOf<LaravelSemanticContractCatalog['controllerFlows']>()
      .toEqualTypeOf<Sequence<ControllerActionRouteFlowContract>>();
  });
});
