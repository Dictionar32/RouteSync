/**
 * Scanner Orchestrator Sub-Domain.
 * Conforms to Rule 14: Zero wildcard re-exports (0 `export * from`).
 *
 * @module core/compiler/scanner/orchestrator
 */

export { scanRouteSyncManifest, scanRouteSyncManifestFlow } from './upstreamManifestScanner';
// Legacy RouteManifest compatibility is deliberately not exported from the canonical orchestrator.


export type { ManifestBuilderInterface } from '../../../types/upstream/manifestBuilderInterface';
export { manifestBuilder } from '../wiring/upstreamManifestBuilder';

export type { RouteSyncManifestFlowProjectionInterface } from './RouteSyncManifestFlowProjectionInterface';
export { routeSyncManifestFlowProjection } from './upstreamManifestScanner';
