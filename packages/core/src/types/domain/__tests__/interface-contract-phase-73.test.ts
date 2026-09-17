import { describe, expectTypeOf, it } from 'vitest';
import type {
  RawRouteDefInput,
  RouteDef,
  RouteDefContract
} from '../routeEntityDefinition';

describe('Phase 73 canonical RouteDef contract', () => {
  it('makes RouteDef identical to the complete domain contract', () => {
    expectTypeOf<RouteDef>().toEqualTypeOf<RouteDefContract>();
  });

  it('contains no optional or nullable fields in the canonical route type', () => {
    expectTypeOf<RouteDef['identity']>().toEqualTypeOf<RouteDefContract['identity']>();
    expectTypeOf<RouteDef['security']>().toEqualTypeOf<RouteDefContract['security']>();
    expectTypeOf<RouteDef['payload']>().toEqualTypeOf<RouteDefContract['payload']>();
    expectTypeOf<RouteDef['provenance']>().toEqualTypeOf<RouteDefContract['provenance']>();
  });

  it('isolates permissive source data at the explicit raw boundary', () => {
    expectTypeOf<RawRouteDefInput['schema']>().toEqualTypeOf<Record<string, unknown>>();
    expectTypeOf<RawRouteDefInput['response']>().toEqualTypeOf<RouteDefContract['payload']['response']>();
    expectTypeOf<RawRouteDefInput['sourceLine']>().toEqualTypeOf<number>();
  });
});
