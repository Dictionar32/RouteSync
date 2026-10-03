import { describe, expectTypeOf, it } from 'vitest';
import type { RouteSyncManifest, RouteSyncManifestFlow, UpstreamBoundary } from '../manifest';

describe('upstream interface elevation phase 48', () => {
  it('keeps the public flow AST-free', () => {
    expectTypeOf<RouteSyncManifestFlow>().not.toHaveProperty('ast');
    expectTypeOf<UpstreamBoundary['flow']>().toEqualTypeOf<RouteSyncManifestFlow>();
  });

  it('keeps AST only on the construction artifact', () => {
    expectTypeOf<RouteSyncManifest['ast']>().toHaveProperty('ast');
    expectTypeOf<UpstreamBoundary>().not.toHaveProperty('manifest');
  });
});
