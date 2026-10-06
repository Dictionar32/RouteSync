import type { SourceProjectIdentity } from '../../../types/upstream/highLevelSourceModel';
import type { RouteSyncManifest } from '../../../types/upstream/manifest';

/** Canonical construction contract for the concrete upstream manifest. */
export interface ManifestBuilderInterface {
  readonly build: (sourceProject: SourceProjectIdentity) => Promise<RouteSyncManifest>;
}
