import { describe, expect, it, expectTypeOf } from 'vitest';
import type {
  ModelHighLevelContract,
  RelationHighLevelContract,
  ResourceHighLevelContract,
  RequestHighLevelContract,
  ResponseHighLevelContract,
  RouteHighLevelContract,
  ControllerHighLevelContract,
  ServiceHighLevelContract,
} from '../highLevelContracts';
import type { ModelDefinition } from '../model';
import type { EloquentRelationDescriptor } from '../modelVocabulary';
import type { ResourceDefinition } from '../resource';
import type { RequestDefinition } from '../request';
import type { ResponseDefinition } from '../response';
import type { RouteDefinition } from '../route';
import type { ControllerMethod } from '../controller';
import type { ServiceDefinition } from '../service';

describe('upstream interface elevation phase 16', () => {
  it('keeps high-level contracts assignable to canonical upstream interfaces', () => {
    expectTypeOf<ModelHighLevelContract>().toExtend<ModelDefinition>();
    expectTypeOf<RelationHighLevelContract>().toExtend<EloquentRelationDescriptor>();
    expectTypeOf<ResourceHighLevelContract>().toExtend<ResourceDefinition>();
    expectTypeOf<RequestHighLevelContract>().toExtend<RequestDefinition>();
    expectTypeOf<ResponseHighLevelContract>().toExtend<ResponseDefinition>();
    expectTypeOf<RouteHighLevelContract>().toExtend<RouteDefinition>();
    expectTypeOf<ControllerHighLevelContract>().toExtend<ControllerMethod>();
    expectTypeOf<ServiceHighLevelContract>().toExtend<ServiceDefinition>();
  });

  it('does not require primitive semantic reconstruction at the high-level boundary', () => {
    const relation = {} as RelationHighLevelContract;
    expect(relation).toBeDefined();
  });
});
