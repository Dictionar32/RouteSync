/**
 * Scanner Orchestrator Sub-Domain.
 * Conforms to Rule 14: Zero wildcard re-exports (0 `export * from`).
 *
 * @module core/compiler/scanner/orchestrator
 */

export { scanRouteSyncManifest } from './upstreamManifestScanner';
// Legacy RouteManifest compatibility is deliberately not exported from the canonical orchestrator.

