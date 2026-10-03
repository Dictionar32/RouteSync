import { describe, expect, it } from 'vitest';
import { expectTypeOf } from 'vitest';
import type {
  ControllerActionRouteFlowContract,
  ControllerRouteParameterBindingContract,
  ControllerRouteParameterBindingSurface,
  LaravelSemanticContractCatalog,
} from '../highLevelContracts';
import type { Sequence } from '../collections';

describe('phase29 controller route parameter binding interface', () => {
  it('keeps route parameter binding passive at the interface boundary', () => {
    expectTypeOf<ControllerActionRouteFlowContract>().toExtend<ControllerRouteParameterBindingSurface>();
    expectTypeOf<ControllerActionRouteFlowContract['parameterBindings']>()
      .toEqualTypeOf<Sequence<ControllerRouteParameterBindingContract>>();
    expectTypeOf<LaravelSemanticContractCatalog['controllerFlows']>()
      .toEqualTypeOf<Sequence<ControllerActionRouteFlowContract>>();
  });
});
