import { describe, expectTypeOf, it } from 'vitest';
import type { LaravelSemanticContractCatalog, ModelHighLevelContract, ResourceHighLevelContract, RequestHighLevelContract, ResponseHighLevelContract, RouteHighLevelContract, ServiceSemanticContract, ControllerActionHighLevelContract, ControllerActionFlowContract } from '../highLevelContracts';
import type { CompleteLaravelSourceModel } from '../highLevelSourceModel';
import type { Sequence } from '../collections';

describe('upstream interface elevation phase 18', () => {
  it('exposes one canonical interface registry from the complete source model', () => {
    expectTypeOf<CompleteLaravelSourceModel['contracts']>().toEqualTypeOf<LaravelSemanticContractCatalog>();
    expectTypeOf<LaravelSemanticContractCatalog['models']>().toEqualTypeOf<Sequence<ModelHighLevelContract>>();
    expectTypeOf<LaravelSemanticContractCatalog['resources']>().toEqualTypeOf<Sequence<ResourceHighLevelContract>>();
    expectTypeOf<LaravelSemanticContractCatalog['requests']>().toEqualTypeOf<Sequence<RequestHighLevelContract>>();
    expectTypeOf<LaravelSemanticContractCatalog['responses']>().toEqualTypeOf<Sequence<ResponseHighLevelContract>>();
    expectTypeOf<LaravelSemanticContractCatalog['routes']>().toEqualTypeOf<Sequence<RouteHighLevelContract>>();
    expectTypeOf<LaravelSemanticContractCatalog['controllers']>().toEqualTypeOf<Sequence<ControllerActionFlowContract>>();
    expectTypeOf<LaravelSemanticContractCatalog['services']>().toEqualTypeOf<Sequence<ServiceSemanticContract>>();
  });
});
