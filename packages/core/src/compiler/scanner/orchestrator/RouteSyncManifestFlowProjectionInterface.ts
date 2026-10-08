import type { RouteSyncManifest, RouteSyncManifestFlow } from '../../../types/upstream/manifest';
import type { UpstreamWiringInterface } from '../../../types/interfaces/interfaceDependencyBoundary';

/**
 * Downstream-owned wiring boundary that projects the validated construction
 * manifest into the AST-free semantic flow consumed by graph/dataflow/IR.
 *
 * The upstream manifest owns construction (including CompleteSourceAst).
 * This boundary owns the decision to expose only the semantic flow surface.
 */
export interface RouteSyncManifestFlowProjectionInterface
  extends UpstreamWiringInterface<RouteSyncManifest, RouteSyncManifestFlow> {}
