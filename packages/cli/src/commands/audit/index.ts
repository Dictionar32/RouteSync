/**
 * Audit command sub-domain.
 * Conforms to Rule 14: Zero wildcard re-exports (0 `export * from`).
 */

export { auditManifestDrift } from './driftAuditor';
export { auditSemanticCoverage, type SemanticAuditOptions } from './semanticAuditor';
