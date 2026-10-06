import { describe, expectTypeOf, it } from 'vitest';
import type {
  RouteSyncManifest,
  RouteSyncManifestFlow,
  UpstreamBoundary,
} from '../manifest';
import type { ManifestSource, ManifestVersion } from '../manifest';
import type { LaravelSemanticContractCatalog } from '../highLevelContracts';
import type { SemanticRelationGraph } from '../semanticReferences';

describe('upstream interface elevation phase 45', () => {
  it('elevates a dumb manifest flow above the AST boundary', () => {
    expectTypeOf<RouteSyncManifest>().not.toExtend<RouteSyncManifestFlow>();
    expectTypeOf<RouteSyncManifest['kind']>().toEqualTypeOf<'route_sync_manifest'>();
    expectTypeOf<RouteSyncManifestFlow['kind']>().toEqualTypeOf<'route_sync_manifest_flow'>();
    expectTypeOf<RouteSyncManifestFlow['version']>().toEqualTypeOf<ManifestVersion>();
    expectTypeOf<RouteSyncManifestFlow['source']>().toEqualTypeOf<ManifestSource>();
    expectTypeOf<RouteSyncManifestFlow['contracts']>().toEqualTypeOf<LaravelSemanticContractCatalog>();
    expectTypeOf<RouteSyncManifestFlow['relations']>().toEqualTypeOf<SemanticRelationGraph>();

    // The downstream flow exposes resolved semantic meaning, not AST.
    expectTypeOf<RouteSyncManifestFlow>().not.toHaveProperty('ast');
    expectTypeOf<RouteSyncManifestFlow>().not.toHaveProperty('sourceModel');
  });

  it('keeps AST ownership concrete and construction-only', () => {
    expectTypeOf<RouteSyncManifest['ast']>().toHaveProperty('ast');
    expectTypeOf<UpstreamBoundary['flow']>().toEqualTypeOf<RouteSyncManifestFlow>();
    expectTypeOf<UpstreamBoundary>().not.toHaveProperty('manifest');
  });
});
