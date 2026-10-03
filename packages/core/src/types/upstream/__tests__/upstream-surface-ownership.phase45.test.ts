import { expectTypeOf, test } from 'vitest';
import type {
  ModelRelationSurface,
  ResourceTransformationSurface,
  RequestValidationSurface,
  ResponseOutcomeSurface,
  RouteSemanticSurface,
  ControllerDataflowSurface,
  DependencyFlowSurface,
  ServiceDependencySurface,
} from '../highLevelContracts';
import type { ModelRelationSurface as CanonicalModelRelationSurface } from '../model';
import type { ResourceTransformationSurface as CanonicalResourceTransformationSurface } from '../resource';
import type { RequestValidationSurface as CanonicalRequestValidationSurface } from '../request';
import type { ResponseOutcomeSurface as CanonicalResponseOutcomeSurface } from '../response';
import type { RouteSemanticSurface as CanonicalRouteSemanticSurface } from '../route';
import type { ControllerDataflowSurface as CanonicalControllerDataflowSurface, DependencyFlowSurface as CanonicalDependencyFlowSurface } from '../controller';
import type { ServiceDependencySurface as CanonicalServiceDependencySurface } from '../service';

test('phase 45 compatibility surfaces resolve to canonical upstream owners', () => {
  expectTypeOf<ModelRelationSurface>().toEqualTypeOf<CanonicalModelRelationSurface>();
  expectTypeOf<ResourceTransformationSurface>().toEqualTypeOf<CanonicalResourceTransformationSurface>();
  expectTypeOf<RequestValidationSurface>().toEqualTypeOf<CanonicalRequestValidationSurface>();
  expectTypeOf<ResponseOutcomeSurface>().toEqualTypeOf<CanonicalResponseOutcomeSurface>();
  expectTypeOf<RouteSemanticSurface>().toEqualTypeOf<CanonicalRouteSemanticSurface>();
  expectTypeOf<ControllerDataflowSurface>().toEqualTypeOf<CanonicalControllerDataflowSurface>();
  expectTypeOf<DependencyFlowSurface>().toEqualTypeOf<CanonicalDependencyFlowSurface>();
  expectTypeOf<ServiceDependencySurface>().toEqualTypeOf<CanonicalServiceDependencySurface>();
});
