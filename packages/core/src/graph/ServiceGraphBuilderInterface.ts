import type { ServiceGraph } from '../types/semantic';
import type { RouteSyncManifestGraphSurface } from './RouteSyncManifestGraphProjectionInterface';
import type { InterfaceDependencyBoundary } from '../types/interfaces/interfaceDependencyBoundary';

/**
 * Public graph construction boundary.
 *
 * The graph layer owns this downstream boundary and consumes the upstream
 * manifest flow. The concrete ServiceGraphBuilder implementation is private
 * to graph composition.
 */
export interface ServiceGraphBuilderInterface extends InterfaceDependencyBoundary<RouteSyncManifestGraphSurface, ServiceGraph> {
}
