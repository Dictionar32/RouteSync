import { describe, expectTypeOf, it } from 'vitest';
import type { ManifestAst, ManifestSource, ManifestVersion, RouteSyncManifest, UpstreamBoundary, UpstreamManifestConstructionBoundary } from '../manifest';
import type { CompleteLaravelSourceModel } from '../highLevelSourceModel';

/** Phase 22: the manifest itself is an upstream interface boundary. */
describe('upstream interface elevation phase 22', () => {
  it('keeps the manifest as an interface contract', () => {
    expectTypeOf<RouteSyncManifest>().toMatchObjectType<{
      readonly kind: 'route_sync_manifest';
      readonly version: ManifestVersion;
      readonly source: ManifestSource;
      readonly sourceModel: CompleteLaravelSourceModel;
    }>();
  });

  it('keeps wrapper boundaries interface-based', () => {
    expectTypeOf<ManifestAst>().toMatchObjectType<{ readonly definition: RouteSyncManifest }>();
    expectTypeOf<UpstreamManifestConstructionBoundary>().toMatchObjectType<{ readonly manifest: RouteSyncManifest }>();
    expectTypeOf<UpstreamBoundary>().not.toHaveProperty('manifest');
  });
});
