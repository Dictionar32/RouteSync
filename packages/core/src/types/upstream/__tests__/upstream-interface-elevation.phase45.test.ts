import { describe, expectTypeOf, it } from 'vitest';
import type {
  RouteSyncManifest,
  RouteSyncManifestFlow,
  UpstreamBoundary,
} from '../manifest';
import type { CompleteLaravelSourceModel } from '../highLevelSourceModel';
import type { ManifestSource, ManifestVersion } from '../manifest';

describe('upstream interface elevation phase 45', () => {
  it('elevates a dumb manifest flow above the AST boundary', () => {
    expectTypeOf<RouteSyncManifest>().toExtend<RouteSyncManifestFlow>();
    expectTypeOf<RouteSyncManifestFlow['version']>().toEqualTypeOf<ManifestVersion>();
    expectTypeOf<RouteSyncManifestFlow['source']>().toEqualTypeOf<ManifestSource>();
    expectTypeOf<RouteSyncManifestFlow['sourceModel']>().toEqualTypeOf<CompleteLaravelSourceModel>();

    // The downstream flow exposes resolved semantic meaning, not AST.
    expectTypeOf<RouteSyncManifestFlow>().not.toHaveProperty('ast');
    expectTypeOf<RouteSyncManifestFlow['sourceModel']['contracts']>().toHaveProperty('controllers');
  });

  it('keeps AST ownership concrete and construction-only', () => {
    expectTypeOf<RouteSyncManifest['ast']>().toHaveProperty('ast');
    expectTypeOf<UpstreamBoundary['flow']>().toEqualTypeOf<RouteSyncManifestFlow>();
    expectTypeOf<UpstreamBoundary>().not.toHaveProperty('manifest');
  });
});
