import type { CompleteLaravelSourceModel } from '../highLevelSourceModel';
import type { RouteSyncManifest } from '../manifest';

type Assert<T extends true> = T;
type Extends<A, B> = A extends B ? true : false;

type _ManifestOwnsCompleteSourceModel = Assert<
  Extends<RouteSyncManifest['sourceModel'], CompleteLaravelSourceModel>
>;

type _ManifestDoesNotOwnBuildWrapper = Assert<
  Extends<RouteSyncManifest['sourceModel'], { readonly kind: 'complete_source_model' }>
>;

void (0 as unknown as _ManifestOwnsCompleteSourceModel);
void (0 as unknown as _ManifestDoesNotOwnBuildWrapper);
