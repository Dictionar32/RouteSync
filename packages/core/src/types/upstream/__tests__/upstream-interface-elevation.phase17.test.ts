import { describe, expectTypeOf, it } from 'vitest';
import type {
  ControllerActionHighLevelContract,
  ModelHighLevelContract,
  ModelRelationSurface,
  RequestHighLevelContract,
  RequestValidationSurface,
  ResourceHighLevelContract,
  ResourceTransformationSurface,
  ResponseHighLevelContract,
  ResponseOutcomeSurface,
  RouteHighLevelContract,
  RouteSemanticSurface,
  ServiceDependencySurface,
  ServiceHighLevelContract,
  ControllerDataflowSurface,
} from '../highLevelContracts';

/**
 * Phase 17 locks the upstream capability interfaces themselves, rather than
 * only checking that domain contracts are assignable to their concrete
 * definitions. This keeps downstream passes dependent on semantic slices.
 */
describe('upstream semantic capability interfaces phase 17', () => {
  it('exposes model relation semantics as an upstream capability', () => {
    expectTypeOf<ModelHighLevelContract>().toExtend<ModelRelationSurface>();
  });

  it('exposes resource transformation semantics as an upstream capability', () => {
    expectTypeOf<ResourceHighLevelContract>().toExtend<ResourceTransformationSurface>();
  });

  it('exposes request validation semantics as an upstream capability', () => {
    expectTypeOf<RequestHighLevelContract>().toExtend<RequestValidationSurface>();
  });

  it('exposes response outcome semantics as an upstream capability', () => {
    expectTypeOf<ResponseHighLevelContract>().toExtend<ResponseOutcomeSurface>();
  });

  it('exposes route semantic binding/return slices upstream', () => {
    expectTypeOf<RouteHighLevelContract>().toExtend<RouteSemanticSurface>();
  });

  it('exposes controller dataflow upstream', () => {
    expectTypeOf<ControllerActionHighLevelContract>().toExtend<ControllerDataflowSurface>();
  });

  it('exposes service dependency semantics upstream', () => {
    expectTypeOf<ServiceHighLevelContract>().toExtend<ServiceDependencySurface>();
  });
});
