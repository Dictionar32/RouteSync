/**
 * Data Provenance sub-domain.
 * Conforms to Rule 14: Zero wildcard re-exports (0 `export * from`).
 *
 * @module types/domain/provenance
 */

export {
  DataProvenanceKind,
  type DataProvenanceKindSpecification,
  type DataProvenanceKindRegistry,
  DATA_PROVENANCE_REGISTRY,
  type ProvenanceSourceRef,
  type DataProvenanceVisitor,
  matchDataProvenance
} from './dataProvenanceKind';

export {
  type EndpointProvenanceDescriptor,
  ScannedEndpointProvenanceDescriptor
} from './endpointProvenance';
