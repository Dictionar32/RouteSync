import { describe, expect, it } from 'vitest';
import type {
  ModelHighLevelContract as BarrelModel,
  ResourceHighLevelContract as BarrelResource,
  RequestHighLevelContract as BarrelRequest,
  ResponseHighLevelContract as BarrelResponse,
  RouteHighLevelContract as BarrelRoute,
  ControllerActionHighLevelContract as BarrelController,
  ServiceHighLevelContract as BarrelService,
  ServiceSemanticContract as BarrelServiceSemantic,
  ResourceFieldSemanticContract as BarrelResourceField,
  LaravelSemanticContractCatalog,
} from '../highLevelContracts';
import type { ModelHighLevelContract } from '../model';
import type { ResourceHighLevelContract, ResourceFieldSemanticContract } from '../resource';
import type { RequestHighLevelContract } from '../request';
import type { ResponseHighLevelContract } from '../response';
import type { RouteHighLevelContract } from '../route';
import type { ControllerActionHighLevelContract } from '../controller';
import type { ServiceHighLevelContract, ServiceSemanticContract } from '../service';
import type { LaravelSemanticContractCatalog as CanonicalCatalog } from '../highLevelSourceModel';

describe('phase 46 upstream ownership', () => {
  it('keeps legacy high-level imports identical to canonical ADT owners', () => {
    expectTypeOf<BarrelModel>().toEqualTypeOf<ModelHighLevelContract>();
    expectTypeOf<BarrelResource>().toEqualTypeOf<ResourceHighLevelContract>();
    expectTypeOf<BarrelRequest>().toEqualTypeOf<RequestHighLevelContract>();
    expectTypeOf<BarrelResponse>().toEqualTypeOf<ResponseHighLevelContract>();
    expectTypeOf<BarrelRoute>().toEqualTypeOf<RouteHighLevelContract>();
    expectTypeOf<BarrelController>().toEqualTypeOf<ControllerActionHighLevelContract>();
    expectTypeOf<BarrelService>().toEqualTypeOf<ServiceHighLevelContract>();
    expectTypeOf<BarrelServiceSemantic>().toEqualTypeOf<ServiceSemanticContract>();
    expectTypeOf<BarrelResourceField>().toEqualTypeOf<ResourceFieldSemanticContract>();
  });

  it('keeps the source-model catalog as the aggregate upstream boundary', () => {
    expectTypeOf<LaravelSemanticContractCatalog>().toEqualTypeOf<CanonicalCatalog>();
  });
});
