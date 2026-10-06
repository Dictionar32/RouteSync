import { describe, expectTypeOf, it } from 'vitest';
import type { RouteHighLevelContract, RouteSemanticSurface } from '../../../../types/upstream/highLevelContracts';
import type { RouteDefinition, RouteParameterBinding } from '../../../../types/upstream/route';
import type { RouteSyncManifestFlow } from '../../../../types/upstream/manifest';
import type { ControllerActionInfo } from '../../descriptors/request/controllerActionTypes';

/** Phase 50: route meaning is resolved upstream; the public flow stays AST-free. */
describe('upstream interface elevation phase 50', () => {
  it('keeps route contracts semantic and independent from RouteAst', () => {
    expectTypeOf<RouteHighLevelContract>().toExtend<RouteSemanticSurface>();
    expectTypeOf<RouteHighLevelContract>().toExtend<RouteDefinition>();
    expectTypeOf<RouteSyncManifestFlow>().not.toHaveProperty('ast');
  });

  it('keeps model binding as a route contract, not container dependency resolution', () => {
    expectTypeOf<RouteParameterBinding>().toHaveProperty('kind');
    expectTypeOf<ControllerActionInfo>().toHaveProperty('parameters');
  });
});
