import { describe, expectTypeOf, it } from 'vitest';
import type { RouteSyncManifest, RouteSyncManifestFlow, UpstreamBoundary } from '../manifest';
import type { ControllerContextualAttributeName, ControllerDependencyResolution } from '../controller';

describe('upstream interface elevation phase 49', () => {
  it('keeps the public flow dumb while the concrete manifest remains upstream-only', () => {
    expectTypeOf<RouteSyncManifestFlow>().not.toHaveProperty('ast');
    expectTypeOf<UpstreamBoundary>().not.toHaveProperty('manifest');
    expectTypeOf<RouteSyncManifest['ast']>().toHaveProperty('ast');
  });

  it('models Laravel contextual resolution as upstream ADT data', () => {
    expectTypeOf<ControllerContextualAttributeName>().toEqualTypeOf<
      | 'auth' | 'authenticated' | 'cache' | 'config' | 'context' | 'db'
      | 'database' | 'give' | 'log' | 'request_attribute' | 'route_parameter'
      | 'storage' | 'tag' | 'current_user'
    >();
    expectTypeOf<ControllerDependencyResolution>().toHaveProperty('kind');
  });
});
