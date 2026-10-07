import type { SourceProjectIdentity } from './highLevelSourceModel';
import type { RouteSyncManifest } from './manifest';

/** Canonical construction contract for the concrete upstream manifest. */
export interface ManifestBuilderInterface {
  readonly build: (sourceProject: SourceProjectIdentity) => Promise<RouteSyncManifest>;
}
